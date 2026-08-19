/**
 * College Scorecard — the bulk data file.
 *
 * WHY THIS EXISTS
 * The JSON API needs a key, and the shared `DEMO_KEY` allows about thirty
 * requests an hour per IP — not enough to page through 250 rows even once. The
 * Department of Education also publishes the whole institution table as a
 * download, with **no key and no rate limit**, which is what makes
 * `npm run db:seed` work on a machine that has never registered for anything.
 *
 * The file is ~23 MB zipped and ~100 MB as CSV, so it is downloaded once into
 * `.cache/scorecard/` (git-ignored) and reused. Delete that directory to force
 * a refresh.
 *
 * The CSV is read line by line rather than loaded into memory: 100 MB as a
 * JavaScript string is ~200 MB of heap, and there is no reason to pay it when
 * we want twenty of its 3,308 columns.
 *
 * SERVER ONLY — it writes to disk and reads a 100 MB file.
 */

import { createReadStream } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

import { unzipSync } from "fflate";

import type { ScorecardUniversity } from "@/lib/api/scorecard";

/** Where the data page lists the current files. */
const DATA_PAGE = "https://collegescorecard.ed.gov/data/";

/**
 * Used when the data page cannot be read. The filename carries a release date,
 * so this goes stale — it is a fallback, not the primary path.
 */
const FALLBACK_URL =
  "https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Institution_06102026.zip";

const CACHE_DIR = path.join(process.cwd(), ".cache", "scorecard");

/* -------------------------------------------------------------------------- */
/* CSV columns                                                                */
/* -------------------------------------------------------------------------- */

/**
 * CIP2 programme codes, mapped to the same labels the JSON client uses.
 *
 * The bulk file names these columns `PCIP11`, `PCIP14`, … where the API calls
 * them `program_percentage.computer`, `.engineering`. Same numbers, different
 * spelling.
 */
const PROGRAM_COLUMNS: Record<string, { en: string; uz: string }> = {
  PCIP01: { en: "Agriculture", uz: "Qishloq xo'jaligi" },
  PCIP04: { en: "Architecture", uz: "Arxitektura" },
  PCIP09: { en: "Communications", uz: "Kommunikatsiya" },
  PCIP11: { en: "Computer Science", uz: "Kompyuter fanlari" },
  PCIP13: { en: "Education", uz: "Pedagogika" },
  PCIP14: { en: "Engineering", uz: "Muhandislik" },
  PCIP16: { en: "Languages", uz: "Tillar" },
  PCIP22: { en: "Law", uz: "Huquq" },
  PCIP23: { en: "English", uz: "Ingliz tili va adabiyoti" },
  PCIP26: { en: "Biology", uz: "Biologiya" },
  PCIP27: { en: "Mathematics", uz: "Matematika" },
  PCIP38: { en: "Philosophy", uz: "Falsafa" },
  PCIP40: { en: "Physical Sciences", uz: "Aniq fanlar" },
  PCIP42: { en: "Psychology", uz: "Psixologiya" },
  PCIP44: { en: "Public Policy", uz: "Davlat siyosati" },
  PCIP45: { en: "Social Sciences", uz: "Ijtimoiy fanlar" },
  PCIP50: { en: "Arts", uz: "San'at" },
  PCIP51: { en: "Health Sciences", uz: "Tibbiyot fanlari" },
  PCIP52: { en: "Business", uz: "Biznes" },
  PCIP54: { en: "History", uz: "Tarix" },
};

const COLUMNS = [
  "UNITID",
  "INSTNM",
  "CITY",
  "STABBR",
  "INSTURL",
  "ADM_RATE",
  "SATMTMID",
  "SATVRMID",
  "SAT_AVG",
  "TUITIONFEE_OUT",
  "UGDS",
  "PREDDEG",
  "CURROPER",
  ...Object.keys(PROGRAM_COLUMNS),
];

/* -------------------------------------------------------------------------- */
/* Parsing helpers                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Split one CSV line, respecting quotes.
 *
 * Institution names contain commas ("University of California, Berkeley") and
 * the occasional escaped quote, so splitting on `,` alone corrupts every row
 * after the first such name. Embedded newlines do not occur in this dataset —
 * if that ever changes, this needs a streaming state machine instead.
 */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      // A doubled quote inside a quoted field is a literal quote.
      if (inQuotes && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(cell);
      cell = "";
      continue;
    }

    cell += char;
  }

  cells.push(cell);
  return cells;
}

/**
 * The dataset's several ways of saying "no value".
 *
 * `NULL` is a missing measure, `NA` is not applicable, and `PS` is
 * privacy-suppressed (too few students to publish without identifying them).
 * All three must become null rather than zero — a suppressed admission rate
 * rendered as 0% would tell a student the school is impossible to get into.
 */
function num(value: string | undefined): number | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "NULL" || trimmed === "NA" || trimmed === "PS") {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "" || trimmed === "NULL" || trimmed === "NA") return null;
  return trimmed;
}

function normaliseUrl(value: string | undefined): string | null {
  const raw = text(value);
  if (!raw) return null;

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Download + cache                                                           */
/* -------------------------------------------------------------------------- */

/** Read the data page and pick out the institution-level download. */
async function resolveBulkUrl(): Promise<string> {
  try {
    const response = await fetch(DATA_PAGE, { cache: "no-store" });
    const html = await response.text();
    const match = html.match(
      /https:\/\/[^"']*Most-Recent-Cohorts-Institution_[^"']*\.zip/,
    );
    return match?.[0] ?? FALLBACK_URL;
  } catch {
    return FALLBACK_URL;
  }
}

/**
 * Path to the extracted CSV, downloading and unzipping it on first use.
 *
 * `onProgress` exists so a seed can say what it is doing during a 23 MB
 * download rather than looking frozen.
 */
async function ensureCsv(
  onProgress?: (message: string) => void,
): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });

  const cached = (await readdir(CACHE_DIR)).find((file) =>
    file.endsWith(".csv"),
  );
  if (cached) return path.join(CACHE_DIR, cached);

  const url = await resolveBulkUrl();
  onProgress?.(`downloading ${url.split("/").pop()}`);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `College Scorecard bulk download failed: HTTP ${response.status}`,
    );
  }

  const zipped = new Uint8Array(await response.arrayBuffer());
  onProgress?.(`unpacking ${(zipped.byteLength / 1e6).toFixed(1)} MB`);

  const files = unzipSync(zipped, {
    // The archive also carries a __MACOSX sidecar; take the data file only.
    filter: (file) =>
      file.name.endsWith(".csv") && !file.name.startsWith("__MACOSX"),
  });

  const [name, contents] = Object.entries(files)[0] ?? [];
  if (!name || !contents) {
    throw new Error("No CSV found inside the College Scorecard archive.");
  }

  const target = path.join(CACHE_DIR, path.basename(name));
  await writeFile(target, contents);
  return target;
}

/* -------------------------------------------------------------------------- */
/* The reader                                                                 */
/* -------------------------------------------------------------------------- */

export interface BulkOptions {
  limit?: number;
  minStudents?: number;
  onProgress?: (message: string) => void;
}

/**
 * The most academically selective four-year US institutions, from the bulk file.
 *
 * Returns the same shape as the JSON client, so the seed can use either without
 * knowing which one it got. Selection matches it too: predominantly bachelor's,
 * currently operating, big enough to matter, with both an SAT average and a
 * real admission rate — sorted by SAT descending.
 */
export async function fetchTopUniversitiesFromBulk({
  limit = 250,
  minStudents = 500,
  onProgress,
}: BulkOptions = {}): Promise<ScorecardUniversity[]> {
  const csvPath = await ensureCsv(onProgress);
  onProgress?.("reading the institution table");

  const stream = createReadStream(csvPath, { encoding: "utf8" });
  const lines = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  let index: Map<string, number> | null = null;
  const eligible: Array<{ sat: number; row: ScorecardUniversity }> = [];

  for await (const line of lines) {
    if (!line) continue;

    const cells = splitCsvLine(line);

    // The first line is the header: remember where the columns we want live.
    if (index === null) {
      index = new Map();
      cells.forEach((name, position) => {
        const clean = name.replace(/^﻿/, "").trim();
        if (COLUMNS.includes(clean)) index!.set(clean, position);
      });
      continue;
    }

    const at = (column: string) => {
      const position = index!.get(column);
      return position === undefined ? undefined : cells[position];
    };

    // Predominantly bachelor's degrees, and still open.
    if (at("PREDDEG") !== "3" || at("CURROPER") !== "1") continue;

    const satAverage = num(at("SAT_AVG"));
    const acceptanceRate = num(at("ADM_RATE"));
    const studentSize = num(at("UGDS"));
    const scorecardId = num(at("UNITID"));
    const name = text(at("INSTNM"));

    if (satAverage === null || name === null || scorecardId === null) continue;
    // A zero rate means "not reported", not "nobody gets in".
    if (acceptanceRate === null || acceptanceRate <= 0) continue;
    if (studentSize === null || studentSize < minStudents) continue;

    const satMath = num(at("SATMTMID"));
    const satReading = num(at("SATVRMID"));

    const programs = Object.entries(PROGRAM_COLUMNS)
      .map(([column, label]) => ({ label, share: num(at(column)) ?? 0 }))
      // Below 5% is a programme the university happens to offer, not one it is
      // known for.
      .filter((entry) => entry.share >= 0.05)
      .sort((a, b) => b.share - a.share)
      .slice(0, 5);

    eligible.push({
      sat: satAverage,
      row: {
        scorecardId,
        name,
        city: text(at("CITY")),
        state: text(at("STABBR")),
        country: "United States",
        websiteUrl: normaliseUrl(at("INSTURL")),
        acceptanceRate,
        satMath,
        satReading,
        satTotal:
          satMath !== null && satReading !== null
            ? satMath + satReading
            : satAverage,
        tuitionUsd: num(at("TUITIONFEE_OUT")),
        studentSize,
        topPrograms: programs.map((entry) => entry.label.en),
        topProgramsUz: programs.map((entry) => entry.label.uz),
      },
    });
  }

  /*
   * Sorted here rather than by the API, and the whole eligible set is held
   * first: it is about a thousand rows, which is nothing, and a running top-N
   * would be more code for no measurable gain.
   */
  eligible.sort((a, b) => b.sat - a.sat);

  onProgress?.(`${eligible.length} eligible institutions, taking ${limit}`);

  return eligible.slice(0, limit).map((entry) => entry.row);
}

/** True when the bulk file has already been downloaded. */
export async function hasBulkCache(): Promise<boolean> {
  try {
    const files = await readdir(CACHE_DIR);
    return files.some((file) => file.endsWith(".csv"));
  } catch {
    return false;
  }
}

/** Exported for tests: the raw CSV line splitter and value coercion. */
export const __internal = { splitCsvLine, num, text };
