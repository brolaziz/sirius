/**
 * `POST /api/admin/bulk-import` — load reference data into Sirius.
 *
 * One endpoint for the four collections that grow over time and have no
 * business being hand-written into a seed script: the SAT vocabulary bank,
 * admissions outcomes, essays, and the activity tier list.
 *
 * Idempotent by natural key, so the same file can be posted repeatedly:
 *   vocabulary  → `englishWord`
 *   applicants  → `applicantKey` + university
 *   essays      → prompt + applicant (re-posting replaces the text)
 *   activities  → `tier` + `title`
 *
 * Auth: `Authorization: Bearer $ADMIN_IMPORT_TOKEN`. In development the token
 * may be unset for convenience; in production a missing token disables the
 * endpoint entirely, so an unconfigured deployment cannot have reference data
 * injected by an anonymous caller.
 *
 * `dryRun: true` validates and reports what *would* happen, writing nothing.
 *
 * Example:
 *   curl -X POST http://localhost:3000/api/admin/bulk-import \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer $ADMIN_IMPORT_TOKEN" \
 *     --data-binary @vocabulary.json
 *
 * `GET` returns the accepted payload shape, so the contract can be checked
 * without reading this file.
 */

import { timingSafeEqual } from "node:crypto";

import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  bulkImportSchema,
  type ActivityItem,
  type ApplicantItem,
  type EssayItem,
  type VocabularyItem,
} from "@/lib/validation/bulk-import";

/**
 * Cap the body so a malformed or hostile payload cannot exhaust memory. Larger
 * than the test-import cap because a 6,000-word vocabulary bank is legitimately
 * big.
 */
const MAX_BODY_BYTES = 16 * 1024 * 1024; // 16 MB

/** Constant-time comparison, to avoid leaking the token via timing. */
function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

type AuthOutcome = { ok: true } | { ok: false; status: number; message: string };

function authorise(request: Request): AuthOutcome {
  const expected = process.env.ADMIN_IMPORT_TOKEN?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!expected) {
    if (isProduction) {
      return {
        ok: false,
        status: 503,
        message:
          "ADMIN_IMPORT_TOKEN is not configured on the server, so imports are " +
          "disabled. Set it in the environment and redeploy.",
      };
    }
    // Development convenience: no token configured, no token required.
    return { ok: true };
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();

  if (!provided || !tokensMatch(provided, expected)) {
    return {
      ok: false,
      status: 401,
      message:
        "Missing or invalid bearer token. Send `Authorization: Bearer " +
        "$ADMIN_IMPORT_TOKEN`.",
    };
  }

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Writers                                                                    */
/* -------------------------------------------------------------------------- */

async function importVocabulary(items: VocabularyItem[]): Promise<number> {
  for (const item of items) {
    await prisma.vocabulary.upsert({
      where: { englishWord: item.englishWord },
      create: item,
      update: item,
    });
  }
  return items.length;
}

/**
 * Resolve a university by id or by name.
 *
 * Names arrive in whatever form the source used, so the lookup is
 * case-insensitive and falls back to a prefix match — "MIT" will not resolve,
 * but "massachusetts institute of technology" will.
 */
async function resolveUniversityId(
  byId: string | null,
  byName: string | null,
): Promise<string | null> {
  if (byId) {
    const exists = await prisma.university.findUnique({
      where: { id: byId },
      select: { id: true },
    });
    return exists?.id ?? null;
  }

  if (!byName) return null;

  const match = await prisma.university.findFirst({
    where: { name: { equals: byName, mode: "insensitive" } },
    select: { id: true },
  });
  if (match) return match.id;

  const partial = await prisma.university.findFirst({
    where: { name: { startsWith: byName, mode: "insensitive" } },
    select: { id: true },
  });
  return partial?.id ?? null;
}

interface ImportResult {
  imported: number;
  skipped: Array<{ item: string; reason: string }>;
}

async function importApplicants(items: ApplicantItem[]): Promise<ImportResult> {
  const skipped: ImportResult["skipped"] = [];
  let imported = 0;

  for (const [index, item] of items.entries()) {
    const universityId = await resolveUniversityId(
      item.universityId,
      item.universityName,
    );

    if (!universityId) {
      skipped.push({
        item: item.universityName ?? `#${index}`,
        reason: "No university in the database matches that name or id.",
      });
      continue;
    }

    /*
     * A missing key gets a deterministic one derived from the row's position,
     * so a re-post updates the same record instead of appending a duplicate.
     */
    const applicantKey = item.applicantKey ?? `import-${index}`;

    const data = {
      status: item.status,
      year: item.year,
      satScore: item.satScore,
      actScore: item.actScore,
      gpaUnweighted: item.gpaUnweighted,
      gpaWeighted: item.gpaWeighted,
      major: item.major,
      /*
       * Cast rather than widen the Zod schema: Prisma's `InputJsonValue` is a
       * recursive type that `z.record(z.string(), z.unknown())` cannot satisfy
       * structurally, even though every value that reaches here is JSON — it
       * arrived as parsed JSON in the request body.
       */
      demographics: (item.demographics ?? undefined) as Prisma.InputJsonValue | undefined,
      extracurriculars: (item.extracurriculars ??
        undefined) as Prisma.InputJsonValue | undefined,
      awards: (item.awards ?? undefined) as Prisma.InputJsonValue | undefined,
      isSample: item.isSample,
    };

    await prisma.applicantProfile.upsert({
      where: { applicantKey_universityId: { applicantKey, universityId } },
      create: { applicantKey, universityId, ...data },
      update: data,
    });

    imported += 1;
  }

  return { imported, skipped };
}

async function importEssays(items: EssayItem[]): Promise<ImportResult> {
  const skipped: ImportResult["skipped"] = [];
  let imported = 0;

  for (const item of items) {
    const universityId = await resolveUniversityId(
      item.universityId,
      item.universityName,
    );

    /*
     * An essay with no university is a Common App personal statement, which is
     * valid. Only a *named* university that cannot be found is a problem —
     * silently filing it as "no university" would hide the typo.
     */
    if (!universityId && item.universityName) {
      skipped.push({
        item: item.prompt.slice(0, 40),
        reason: `No university matches "${item.universityName}".`,
      });
      continue;
    }

    const applicantProfileId = item.applicantKey
      ? ((
          await prisma.applicantProfile.findFirst({
            where: { applicantKey: item.applicantKey },
            select: { id: true },
          })
        )?.id ?? null)
      : null;

    const data = {
      universityId,
      applicantProfileId,
      prompt: item.prompt,
      content: item.content,
      wordCount: item.wordCount,
      topicTags: item.topicTags,
      year: item.year,
      isPremium: item.isPremium,
      isSample: item.isSample,
    };

    /*
     * No natural unique key on essays — two applicants can answer the same
     * prompt — so identity is prompt plus applicant, matched by hand.
     */
    const existing = await prisma.essay.findFirst({
      where: { prompt: item.prompt, applicantProfileId },
      select: { id: true },
    });

    if (existing) {
      await prisma.essay.update({ where: { id: existing.id }, data });
    } else {
      await prisma.essay.create({ data });
    }

    imported += 1;
  }

  return { imported, skipped };
}

async function importActivities(items: ActivityItem[]): Promise<number> {
  for (const item of items) {
    await prisma.activityReference.upsert({
      where: { tier_title: { tier: item.tier, title: item.title } },
      create: item,
      update: item,
    });
  }
  return items.length;
}

/* -------------------------------------------------------------------------- */
/* Handlers                                                                   */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  const auth = authorise(request);
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  if (!isDatabaseConfigured()) {
    return Response.json(
      {
        error:
          "No database is configured. Set DATABASE_URL and run `npx prisma db push`.",
      },
      { status: 503 },
    );
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return Response.json(
      {
        error: `Payload too large. The cap is ${MAX_BODY_BYTES / 1024 / 1024} MB.`,
      },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body is not valid JSON." }, { status: 400 });
  }

  const parsed = bulkImportSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Payload failed validation.",
        /*
         * The first twenty issues with their paths — enough to fix the file,
         * without dumping a thousand-line report into someone's terminal.
         */
        issues: parsed.error.issues.slice(0, 20).map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }

  const payload = parsed.data;

  if (payload.dryRun) {
    return Response.json({
      dryRun: true,
      wouldImport: {
        vocabulary: payload.vocabulary?.length ?? 0,
        applicants: payload.applicants?.length ?? 0,
        essays: payload.essays?.length ?? 0,
        activities: payload.activities?.length ?? 0,
      },
    });
  }

  try {
    const vocabulary = payload.vocabulary
      ? await importVocabulary(payload.vocabulary)
      : 0;
    const applicants = payload.applicants
      ? await importApplicants(payload.applicants)
      : { imported: 0, skipped: [] };
    const essays = payload.essays
      ? await importEssays(payload.essays)
      : { imported: 0, skipped: [] };
    const activities = payload.activities
      ? await importActivities(payload.activities)
      : 0;

    return Response.json({
      imported: {
        vocabulary,
        applicants: applicants.imported,
        essays: essays.imported,
        activities,
      },
      skipped: [...applicants.skipped, ...essays.skipped],
    });
  } catch (error) {
    console.error("[bulk-import] failed:", error);
    return Response.json(
      { error: "Import failed. Nothing after the failure point was written." },
      { status: 500 },
    );
  }
}

/** The contract, so a caller can check the shape without reading the source. */
export function GET() {
  return Response.json({
    endpoint: "POST /api/admin/bulk-import",
    auth: "Authorization: Bearer $ADMIN_IMPORT_TOKEN",
    maxBodyBytes: MAX_BODY_BYTES,
    options: { dryRun: "boolean — validate and report, write nothing" },
    collections: {
      vocabulary: {
        keyedBy: "word",
        fields: {
          word: "string (required)",
          translation: "string — Uzbek",
          definition: "string — English gloss",
          explanationUz: "string",
          partOfSpeech: "string",
          example: "string",
          synonyms: "string[]",
          category: "string — e.g. 'SAT Tier 1'",
        },
      },
      applicants: {
        keyedBy: "applicantKey + university",
        fields: {
          university: "string — name, matched case-insensitively",
          universityId: "string — alternative to `university`",
          applicantKey: "string — groups one applicant's several decisions",
          status: "ACCEPTED | REJECTED | WAITLISTED (required)",
          year: "number",
          satScore: "number 400–1600",
          actScore: "number 1–36",
          gpaUnweighted: "number 0–4",
          gpaWeighted: "number 0–6",
          major: "string",
          demographics: "object — coarse buckets only, never identifying",
          extracurriculars: "[{ title, role, hours, description }]",
          awards: "[{ title, level, year }]",
          isSample: "boolean — badge it as a demonstration row",
        },
      },
      essays: {
        keyedBy: "prompt + applicant",
        fields: {
          university: "string — omit for a Common App personal statement",
          applicantKey: "string — links to an imported applicant",
          prompt: "string (required)",
          content: "string (required)",
          wordCount: "number — counted from `content` when omitted",
          topicTags: "string[]",
          year: "number",
          isPremium: "boolean — renders as locked",
          isSample: "boolean",
        },
      },
      activities: {
        keyedBy: "tier + title",
        fields: {
          tier: "string — 'Bronze I', 'Silver', 'Gold' (required)",
          category: "string — 'STEM', 'Leadership' (required)",
          title: "string (required)",
          titleUz: "string",
          description: "string",
          descriptionUz: "string",
          order: "number — sort position within the tier",
        },
      },
    },
  });
}
