/**
 * College Scorecard API client.
 *
 * The US Department of Education publishes admissions and cost data for every
 * accredited institution in the country. It is the only free, authoritative
 * source for the numbers the explorer runs on, and it removes the worst part of
 * the old approach: a human typing acceptance rates into a seed file and them
 * quietly going stale.
 *
 * SERVER ONLY. The API key is a secret and the endpoint has no CORS headers, so
 * nothing here may be imported from a Client Component.
 *
 * WHAT "TOP" MEANS HERE
 * There is no ranking field in the dataset. This module defines the top by
 * *academic selectivity* — highest average SAT among four-year institutions —
 * which is the closest thing the data supports to "the schools a Sirius student
 * is aiming at". The trade-off is real and worth knowing: test-blind schools
 * report no SAT at all, so Caltech and a handful of others are absent by
 * construction. Sort by `latest.admissions.admission_rate.overall:asc` instead
 * if you would rather have them and lose the SAT ordering.
 *
 * TWO API BEHAVIOURS THAT WILL BITE YOU
 *   1. Errors come back as **HTTP 200** with an `{ error: … }` body. Checking
 *      `response.ok` is not enough; `readPage` inspects the payload.
 *   2. Ties at a page boundary can repeat a row across pages — two schools on
 *      1410 straddling page 0 and page 1 were observed. Results are therefore
 *      de-duplicated by id.
 *
 * Docs: https://collegescorecard.ed.gov/data/api-documentation/
 */

const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools";

/**
 * `DEMO_KEY` works without registration but is rate-limited to roughly thirty
 * requests an hour, per IP — which is not enough to page through 200 rows more
 * than once. Get a free key from https://api.data.gov/signup/ and put it in
 * `SCORECARD_API_KEY` before relying on this.
 */
const DEMO_KEY = "DEMO_KEY";

/** The API's hard ceiling on `per_page`. */
const MAX_PER_PAGE = 100;

/* -------------------------------------------------------------------------- */
/* Field mapping                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The CIP2 programme families the API reports a percentage for, with labels in
 * both languages.
 *
 * Only the families a Sirius student would plausibly apply to are listed —
 * "precision production" and "transportation" are real CIP families, but a
 * card that offers them as a highlight is noise.
 */
const PROGRAM_FIELDS: Record<string, { en: string; uz: string }> = {
  computer: { en: "Computer Science", uz: "Kompyuter fanlari" },
  engineering: { en: "Engineering", uz: "Muhandislik" },
  mathematics: { en: "Mathematics", uz: "Matematika" },
  physical_science: { en: "Physical Sciences", uz: "Aniq fanlar" },
  biological: { en: "Biology", uz: "Biologiya" },
  health: { en: "Health Sciences", uz: "Tibbiyot fanlari" },
  business_marketing: { en: "Business", uz: "Biznes" },
  social_science: { en: "Social Sciences", uz: "Ijtimoiy fanlar" },
  psychology: { en: "Psychology", uz: "Psixologiya" },
  english: { en: "English", uz: "Ingliz tili va adabiyoti" },
  history: { en: "History", uz: "Tarix" },
  philosophy_religious: { en: "Philosophy", uz: "Falsafa" },
  visual_performing: { en: "Arts", uz: "San'at" },
  architecture: { en: "Architecture", uz: "Arxitektura" },
  communication: { en: "Communications", uz: "Kommunikatsiya" },
  education: { en: "Education", uz: "Pedagogika" },
  language: { en: "Languages", uz: "Tillar" },
  legal: { en: "Law", uz: "Huquq" },
  public_administration_social_service: {
    en: "Public Policy",
    uz: "Davlat siyosati",
  },
  agriculture: { en: "Agriculture", uz: "Qishloq xo'jaligi" },
};

/** Everything requested from the API, in its dotted-path form. */
const FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.school_url",
  "latest.admissions.admission_rate.overall",
  "latest.admissions.sat_scores.midpoint.math",
  "latest.admissions.sat_scores.midpoint.critical_reading",
  "latest.admissions.sat_scores.average.overall",
  "latest.cost.tuition.out_of_state",
  "latest.student.size",
  ...Object.keys(PROGRAM_FIELDS).map(
    (key) => `latest.academics.program_percentage.${key}`,
  ),
].join(",");

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A raw result row.
 *
 * The API returns *flat* objects whose keys are the dotted paths that were
 * requested — not a nested structure — which is why this is an index signature
 * rather than a shape.
 */
type ScorecardRow = Record<string, string | number | null>;

interface ScorecardPayload {
  metadata?: { total?: number; page?: number; per_page?: number };
  results?: ScorecardRow[];
  error?: { code?: string; message?: string };
}

/** One institution, mapped into the shape Sirius stores. */
export interface ScorecardUniversity {
  /** IPEDS UNITID. Stable across years — the upsert key. */
  scorecardId: number;
  name: string;
  city: string | null;
  state: string | null;
  country: "United States";
  websiteUrl: string | null;
  /** 0–1. `0.0361` is a 3.6% admission rate. */
  acceptanceRate: number | null;
  satMath: number | null;
  satReading: number | null;
  /** Section midpoints added together, or the reported average as a fallback. */
  satTotal: number | null;
  tuitionUsd: number | null;
  studentSize: number | null;
  /** The largest programme families by share of degrees awarded. */
  topPrograms: string[];
  topProgramsUz: string[];
}

/** Thrown for anything the caller might want to explain to a human. */
export class ScorecardError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ScorecardError";
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/**
 * The API returns URLs in whatever form the institution filed them:
 * `www.stanford.edu/`, `https://www.minerva.edu/`, occasionally with trailing
 * whitespace. Normalise to something a browser will accept from an `href`.
 */
function normaliseUrl(value: unknown): string | null {
  const raw = asString(value);
  if (!raw) return null;

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withScheme);
    return url.toString().replace(/\/$/, "");
  } catch {
    // A malformed URL is not worth failing an import over.
    return null;
  }
}

/**
 * The programme families with the largest share of degrees awarded.
 *
 * A share below 5% is dropped: every large university awards *some* degrees in
 * most families, and listing a 0.4% programme as a highlight would be
 * misleading.
 */
function topPrograms(row: ScorecardRow, limit = 5) {
  const scored = Object.keys(PROGRAM_FIELDS)
    .map((key) => ({
      key,
      share: asNumber(row[`latest.academics.program_percentage.${key}`]) ?? 0,
    }))
    .filter((entry) => entry.share >= 0.05)
    .sort((a, b) => b.share - a.share)
    .slice(0, limit);

  return {
    en: scored.map((entry) => PROGRAM_FIELDS[entry.key].en),
    uz: scored.map((entry) => PROGRAM_FIELDS[entry.key].uz),
  };
}

function mapRow(row: ScorecardRow): ScorecardUniversity | null {
  const scorecardId = asNumber(row["id"]);
  const name = asString(row["school.name"]);

  // Without an id or a name the row cannot be stored or shown.
  if (scorecardId === null || name === null) return null;

  const acceptanceRate = asNumber(
    row["latest.admissions.admission_rate.overall"],
  );

  /*
   * A zero admission rate is not a 0% school, it is a school that filed
   * nothing. Publishing it would tell a student the place is impossible to get
   * into, which is worse than saying nothing.
   */
  if (acceptanceRate !== null && acceptanceRate <= 0) return null;

  const satMath = asNumber(row["latest.admissions.sat_scores.midpoint.math"]);
  const satReading = asNumber(
    row["latest.admissions.sat_scores.midpoint.critical_reading"],
  );
  const satAverage = asNumber(
    row["latest.admissions.sat_scores.average.overall"],
  );

  const programs = topPrograms(row);

  return {
    scorecardId,
    name,
    city: asString(row["school.city"]),
    state: asString(row["school.state"]),
    country: "United States",
    websiteUrl: normaliseUrl(row["school.school_url"]),
    acceptanceRate,
    satMath,
    satReading,
    /*
     * Prefer the two section midpoints added together, because that is the
     * number a student compares their own total against. Fall back to the
     * reported average when a school publishes one but not the split.
     */
    satTotal:
      satMath !== null && satReading !== null
        ? satMath + satReading
        : satAverage,
    tuitionUsd: asNumber(row["latest.cost.tuition.out_of_state"]),
    studentSize: asNumber(row["latest.student.size"]),
    topPrograms: programs.en,
    topProgramsUz: programs.uz,
  };
}

/* -------------------------------------------------------------------------- */
/* The client                                                                 */
/* -------------------------------------------------------------------------- */

export interface FetchOptions {
  /** How many institutions to return in total, across as many pages as needed. */
  limit?: number;
  /**
   * Ignore institutions smaller than this. The default keeps the list to places
   * with a real undergraduate intake and filters out the long tail of tiny
   * specialist colleges.
   */
  minStudents?: number;
  /** Overrides `SCORECARD_API_KEY`. Mostly useful in tests. */
  apiKey?: string;
  /** Called after each page, for progress output during a seed. */
  onPage?: (page: number, received: number, total: number) => void;
}

/** Read one page, turning the API's 200-with-an-error-body into a throw. */
async function readPage(url: string): Promise<ScorecardPayload> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    // Server-side only; never cache a seed request.
    cache: "no-store",
  });

  let payload: ScorecardPayload;
  try {
    payload = (await response.json()) as ScorecardPayload;
  } catch {
    throw new ScorecardError(
      `College Scorecard returned ${response.status} with a non-JSON body.`,
    );
  }

  /*
   * The important case: `api.data.gov` answers a rate-limited or unauthorised
   * request with HTTP 200 and an error object. Trusting the status code here
   * would silently import zero universities over a good database.
   */
  if (payload.error) {
    const code = payload.error.code ?? "UNKNOWN";
    const hint =
      code === "OVER_RATE_LIMIT"
        ? " DEMO_KEY allows about thirty requests an hour — set SCORECARD_API_KEY from https://api.data.gov/signup/."
        : code === "API_KEY_MISSING" || code === "API_KEY_INVALID"
          ? " Check SCORECARD_API_KEY in .env."
          : "";

    throw new ScorecardError(
      `${payload.error.message ?? "College Scorecard request failed."}${hint}`,
      code,
    );
  }

  if (!response.ok) {
    throw new ScorecardError(
      `College Scorecard responded ${response.status}.`,
      String(response.status),
    );
  }

  return payload;
}

/**
 * Fetch the most academically selective four-year US institutions.
 *
 * Pages through the API `per_page=100` at a time — its hard ceiling — and stops
 * as soon as it has `limit` rows or the API runs out. Requests are sequential
 * rather than parallel: `api.data.gov` rate-limits per IP, and three requests
 * fired at once is a good way to spend the budget on a 429.
 *
 * Filters applied in the query so the API does the work:
 *   • `school.degrees_awarded.predominant=3` — predominantly bachelor's
 *   • `school.operating=1` — still open
 *   • `latest.student.size__range` — big enough to matter
 *   • SAT average and admission rate both present — the two fields the sort and
 *     the explorer depend on
 */
export async function fetchTopUniversities({
  limit = 250,
  minStudents = 500,
  apiKey,
  onPage,
}: FetchOptions = {}): Promise<ScorecardUniversity[]> {
  const key = apiKey || process.env.SCORECARD_API_KEY || DEMO_KEY;

  const collected = new Map<number, ScorecardUniversity>();
  const pages = Math.ceil(limit / MAX_PER_PAGE);

  for (let page = 0; page < pages; page += 1) {
    const params = new URLSearchParams({
      api_key: key,
      fields: FIELDS,
      "school.degrees_awarded.predominant": "3",
      "school.operating": "1",
      "latest.student.size__range": `${minStudents}..`,
      "latest.admissions.sat_scores.average.overall__not": "null",
      "latest.admissions.admission_rate.overall__not": "null",
      sort: "latest.admissions.sat_scores.average.overall:desc",
      per_page: String(MAX_PER_PAGE),
      page: String(page),
    });

    const payload = await readPage(`${BASE_URL}?${params.toString()}`);
    const rows = payload.results ?? [];

    for (const row of rows) {
      const mapped = mapRow(row);
      // Keyed by id, so a row repeated across a page boundary lands once.
      if (mapped && !collected.has(mapped.scorecardId)) {
        collected.set(mapped.scorecardId, mapped);
      }
    }

    onPage?.(page, rows.length, collected.size);

    // A short page means the result set is exhausted.
    if (rows.length < MAX_PER_PAGE) break;
    if (collected.size >= limit) break;
  }

  return Array.from(collected.values()).slice(0, limit);
}

/** True when a real API key is configured, rather than the shared demo key. */
export function hasScorecardKey(): boolean {
  return Boolean(process.env.SCORECARD_API_KEY?.trim());
}
