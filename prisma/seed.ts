/**
 * Database seed.
 *
 * Run with:  npm run db:seed
 *
 * What this seeds:
 *   • the English→Uzbek dictionary, mirrored from `data/vocabulary.json`
 *   • a starter list of universities for the explorer
 *
 * What this deliberately does **not** seed: SAT tests or questions. Sirius has
 * no question content of its own by design — you import your own bank through
 * `POST /api/tests/import`. Inventing plausible-looking SAT questions here would
 * put material of unknown quality in front of students and make it unclear which
 * content is really theirs.
 *
 * Everything below is idempotent (`upsert` keyed on a unique column), so running
 * the seed repeatedly is safe.
 *
 * Imports are relative rather than using the `@/` alias: this script runs under
 * `tsx` outside Next's module resolution.
 */

import "dotenv/config";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";
import { UNIVERSITY_SEED } from "../data/universities";
import {
  ScorecardError,
  fetchTopUniversities,
  hasScorecardKey,
} from "../lib/api/scorecard";
import { fetchTopUniversitiesFromBulk } from "../lib/api/scorecard-bulk";
import { STARTER_ROADMAP } from "../lib/user";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env and point it at a " +
      "Postgres instance first.",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/* -------------------------------------------------------------------------- */
/* Dictionary                                                                  */
/* -------------------------------------------------------------------------- */

interface VocabularyFile {
  entries: Array<{
    word: string;
    partOfSpeech: string;
    translation: string;
    explanation: string;
    explanationUz: string;
    example: string;
  }>;
}

async function seedVocabulary(): Promise<number> {
  const path = join(process.cwd(), "data", "vocabulary.json");
  const file = JSON.parse(readFileSync(path, "utf8")) as VocabularyFile;

  for (const entry of file.entries) {
    const data = {
      translatedWord: entry.translation,
      explanation: entry.explanation,
      explanationUz: entry.explanationUz,
      partOfSpeech: entry.partOfSpeech,
      example: entry.example,
    };

    await prisma.vocabulary.upsert({
      where: { englishWord: entry.word.toLowerCase() },
      create: { englishWord: entry.word.toLowerCase(), ...data },
      update: data,
    });
  }

  return file.entries.length;
}

/* -------------------------------------------------------------------------- */
/* Universities                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A starter list, chosen to span the range a Sirius student realistically
 * considers: highly selective US universities that meet full need, UK options,
 * and attainable choices closer to home.
 *
 * IMPORTANT: the figures below are **indicative round numbers** for a working
 * demo, not verified admissions data. Acceptance rates, tuition and score
 * expectations change every cycle. Refresh them from each university's own
 * admissions pages before putting this in front of students.
 */
// The list itself lives in `data/universities.ts` — see the note there.

/**
 * Give the seeded roadmap rows their slug.
 *
 * Accounts created before the column existed have `slug: null`, which would
 * leave their checklist stuck in English forever. The starter list is fixed and
 * ordered, so `order` identifies each row unambiguously — and the update is
 * scoped to `slug: null` so a student who has edited a task is never touched.
 */
async function backfillRoadmapSlugs(): Promise<number> {
  let updated = 0;

  for (const [index, task] of STARTER_ROADMAP.entries()) {
    const result = await prisma.roadmapTask.updateMany({
      where: { order: index, slug: null, title: task.title },
      data: { slug: task.slug },
    });
    updated += result.count;
  }

  return updated;
}

async function seedUniversities(): Promise<number> {
  for (const university of UNIVERSITY_SEED) {
    const data = {
      country: university.country,
      city: university.city,
      acceptanceRate: university.acceptanceRate,
      minSat: university.minSat,
      minIelts: university.minIelts,
      minToefl: university.minToefl,
      averageGpa: university.averageGpa,
      tuitionUsd: university.tuitionUsd,
      meetsFullNeed: university.meetsFullNeed,
      worldRanking: university.worldRanking,
      websiteUrl: university.websiteUrl,
      applicationDeadline: university.applicationDeadline
        ? new Date(university.applicationDeadline)
        : null,
      imageUrl: university.imageUrl,
      description: university.description,
      descriptionUz: university.descriptionUz,
      extracurriculars: [...university.extracurriculars],
      extracurricularsUz: [...university.extracurricularsUz],
      popularMajors: [...university.popularMajors],
      popularMajorsUz: [...university.popularMajorsUz],
      studentProfile: university.studentProfile,
      studentProfileUz: university.studentProfileUz,
    };

    await prisma.university.upsert({
      where: { name: university.name },
      create: { name: university.name, ...data },
      update: data,
    });
  }

  return UNIVERSITY_SEED.length;
}

/**
 * Import the most selective US institutions from the College Scorecard API.
 *
 * The federal dataset supplies the numbers that go stale — admission rate, SAT
 * midpoints, tuition — so those are always taken from the API. Everything the
 * API cannot know stays untouched on re-import:
 *
 *   • the hand-written Uzbek copy and "what they look for" notes
 *   • IELTS/TOEFL floors and GPA, which the Scorecard does not carry
 *   • a licensed campus photo, once someone adds one
 *
 * That split is why the update lists its fields explicitly instead of spreading
 * the whole object: a refresh must not wipe the editorial work with nulls. It
 * is also why `dataSource` is only set when a row is *created* — a curated row
 * that has been enriched with federal numbers is still curated, and the prune
 * below depends on being able to tell the two apart.
 *
 * Matching is by `scorecardId` where a row already has one, and by name for the
 * first import — which is what attaches the twelve curated rows (Stanford, MIT,
 * Harvard, …) to their federal records instead of duplicating them.
 */
/**
 * Federal names that differ from the name a student would recognise.
 *
 * Without this the API's "Columbia University in the City of New York" lands
 * beside our "Columbia University" as a second row, and the explorer shows the
 * same place twice. Keyed by the API's name; the value is the curated name to
 * merge into.
 */
const SCORECARD_NAME_ALIASES: Record<string, string> = {
  "Columbia University in the City of New York": "Columbia University",
  "Arizona State University Campus Immersion": "Arizona State University",
  "Arizona State University-Tempe": "Arizona State University",
  "Massachusetts Institute of Technology": "Massachusetts Institute of Technology",
};

/**
 * Get the university list, from whichever source can actually deliver it.
 *
 * The JSON API is tried first because it is the freshest and needs no download.
 * When it refuses — no key, or the shared DEMO_KEY out of budget, which is the
 * common case on a new machine — the bulk file takes over. It carries the same
 * table with no key and no rate limit, so `npm run db:seed` fills the explorer
 * either way.
 */
async function loadUniversities(limit: number) {
  if (hasScorecardKey()) {
    try {
      const rows = await fetchTopUniversities({
        limit,
        onPage: (page, received, total) => {
          console.log(`    api page ${page}: ${received} rows (${total} unique)`);
        },
      });
      return { rows, source: "API" as const };
    } catch (error) {
      const reason =
        error instanceof ScorecardError ? error.message : String(error);
      console.warn(`    api unavailable (${reason})`);
      console.warn("    falling back to the bulk data file");
    }
  } else {
    console.log("    no SCORECARD_API_KEY — using the bulk data file");
  }

  const rows = await fetchTopUniversitiesFromBulk({
    limit,
    onProgress: (message) => console.log(`    ${message}`),
  });

  return { rows, source: "bulk file" as const };
}

async function seedUniversitiesFromScorecard(): Promise<{
  written: number;
  pruned: number;
  source: string;
}> {
  const { rows: universities, source } = await loadUniversities(250);

  let written = 0;

  for (const uni of universities) {
    /*
     * `minSat` is what the explorer filters on, and for API rows it is the sum
     * of the two section midpoints. Curated rows keep whatever was written by
     * hand when the API has no SAT for that school.
     */
    const apiFields = {
      scorecardId: uni.scorecardId,
      country: uni.country,
      city: uni.city,
      state: uni.state,
      acceptanceRate: uni.acceptanceRate,
      satMath: uni.satMath,
      satReading: uni.satReading,
      tuitionUsd: uni.tuitionUsd,
      studentSize: uni.studentSize,
      websiteUrl: uni.websiteUrl,
    };

    const curatedName = SCORECARD_NAME_ALIASES[uni.name] ?? uni.name;

    const existing = await prisma.university.findFirst({
      where: {
        OR: [
          { scorecardId: uni.scorecardId },
          { name: uni.name },
          { name: curatedName },
        ],
      },
      select: { id: true, minSat: true, popularMajors: true },
    });

    if (existing) {
      await prisma.university.update({
        where: { id: existing.id },
        data: {
          ...apiFields,
          // Only fill these when the curated row left them empty.
          minSat: uni.satTotal ?? existing.minSat,
          popularMajors:
            existing.popularMajors.length > 0
              ? existing.popularMajors
              : uni.topPrograms,
        },
      });
    } else {
      await prisma.university.create({
        data: {
          ...apiFields,
          dataSource: "scorecard",
          name: curatedName,
          minSat: uni.satTotal,
          popularMajors: uni.topPrograms,
          popularMajorsUz: uni.topProgramsUz,
        },
      });
    }

    written += 1;
  }

  /*
   * Prune API rows that have dropped out of the top of the list.
   *
   * NOT `prisma.university.deleteMany()`. Emptying the table would take the
   * twelve curated rows with it — Oxford, Cambridge, UCL, Toronto, NYUAD and
   * WIUT are not in a US federal dataset and would never come back — along
   * with their hand-written Uzbek copy. Worse, `UniversityShortlistEntry`
   * cascades on delete, so every student's shortlist would be silently emptied
   * on a routine reseed.
   *
   * Deleting only the API-origin rows that this run did not return achieves the
   * same "no stale rows" outcome without either loss.
   */
  /*
   * Repair rows an earlier version of this script mislabelled.
   *
   * It used to stamp `dataSource: "scorecard"` on every row it touched,
   * including the curated ones it merged federal numbers into. Anything with
   * hand-written Uzbek copy is curated by definition, whatever the column says.
   */
  await prisma.university.updateMany({
    where: { dataSource: "scorecard", descriptionUz: { not: null } },
    data: { dataSource: "curated" },
  });

  /*
   * Prune API rows that have dropped out of the top of the list.
   *
   * NOT `prisma.university.deleteMany()`. Emptying the table would take the
   * curated rows with it — Oxford, Cambridge, UCL, Toronto, NYUAD and WIUT are
   * not in a US federal dataset and would never come back — along with their
   * hand-written Uzbek copy. Worse, `UniversityShortlistEntry` cascades on
   * delete, so every student's shortlist would be silently emptied on a routine
   * reseed.
   *
   * Deleting only the API-origin rows this run did not return achieves the same
   * "no stale rows" outcome without either loss. `descriptionUz: null` is the
   * second guard: a row somebody has written copy for is never dropped, however
   * it got here.
   */
  const keptIds = universities.map((uni) => uni.scorecardId);
  const { count: pruned } = await prisma.university.deleteMany({
    where: {
      dataSource: "scorecard",
      descriptionUz: null,
      scorecardId: { notIn: keptIds },
    },
  });

  return { written, pruned, source };
}

/* -------------------------------------------------------------------------- */

async function main() {
  console.log("Seeding Sirius…");

  const vocabularyCount = await seedVocabulary();
  console.log(`  ✓ ${vocabularyCount} dictionary entries`);

  const universityCount = await seedUniversities();
  console.log(`  ✓ ${universityCount} universities`);

  /*
   * The API import is best-effort: a rate-limited DEMO_KEY or a dropped
   * connection should not fail a seed that has already written the curated
   * list and the dictionary.
   */
  try {
    const { written, pruned, source } = await seedUniversitiesFromScorecard();
    console.log(
      `  ✓ ${written} universities from College Scorecard (${source})` +
        (pruned > 0 ? `, ${pruned} stale rows pruned` : ""),
    );
  } catch (error) {
    console.warn(
      `  ! College Scorecard import skipped: ${(error as Error).message}`,
    );
    console.warn(
      "    Existing university rows were left untouched.",
    );
  }

  const slugCount = await backfillRoadmapSlugs();
  if (slugCount > 0) {
    console.log(`  ✓ ${slugCount} roadmap rows given a translation key`);
  }

  console.log(
    "\nDone. Note: no SAT tests were seeded — import your own question bank " +
      "with POST /api/tests/import.",
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
