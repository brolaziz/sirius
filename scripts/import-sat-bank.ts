/**
 * Import the SAT question bank in `prisma/data/sat/*.json` into the database.
 *
 * Run with:  npm run import:sat
 *            npm run import:sat -- --dry-run     (validates, touches nothing)
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHAT THIS SCRIPT PROMISES
 *
 *   1. **It never deletes.** Not the questions it did not see this run, not a
 *      test, not a taxonomy row. A bank file that loses a question by accident
 *      must not take a student's answer history with it, and `deleteMany` in an
 *      import script is how that happens. Rows no longer present in the files
 *      are counted and reported as orphans, and left alone.
 *   2. **Running it twice changes nothing the second time.** Every write is an
 *      `upsert` keyed on a natural key: `Test.externalId` and
 *      `(Question.testId, Question.externalId)`.
 *   3. **A bad question is skipped, not fatal.** It appears in the report with
 *      the reason. Only a file that is not a bank file at all stops the run.
 *   4. **The taxonomy is read, never written.** The `domains` and `skills`
 *      tables are content that predates this importer. If a code in
 *      `lib/taxonomy.ts` has no row there the run stops and says which — the
 *      one place code and database could drift apart, checked every time.
 *
 * The questions go into two unpublished tests — `sat-bank-reading` and
 * `sat-bank-math`. Unpublished because they are a *bank*, not a sitting: 20
 * questions is not a Reading module and offering it as one would misrepresent
 * what a student just did. Practice reads them by skill; the full mock in a
 * later phase will assemble real modules out of the same rows.
 * ───────────────────────────────────────────────────────────────────────────
 */

import "dotenv/config";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { printDatabaseBanner } from "@/lib/db-banner";
import { SKILL_CODES, type Section } from "@/lib/taxonomy";
import {
  prepareBank,
  type PreparedQuestion,
  type RejectedQuestion,
} from "@/lib/validation/sat-bank";

const DATA_DIR = join(process.cwd(), "prisma", "data", "sat");

/** The two bank containers. `Question.testId` is required, so these exist. */
const BANK_TESTS: Readonly<
  Record<
    Section,
    {
      externalId: string;
      title: string;
      description: string;
      durationMinutes: number;
    }
  >
> = {
  READING: {
    externalId: "sat-bank-reading",
    title: "SAT question bank — Reading & Writing",
    description:
      "Imported Reading & Writing questions, filed by skill. Not a sitting: practice draws from this bank by topic.",
    durationMinutes: 32,
  },
  MATH: {
    externalId: "sat-bank-math",
    title: "SAT question bank — Math",
    description:
      "Imported Math questions, filed by skill. Not a sitting: practice draws from this bank by topic.",
    durationMinutes: 35,
  },
};

/* -------------------------------------------------------------------------- */
/* Reading the files                                                           */
/* -------------------------------------------------------------------------- */

interface SectionBank {
  questions: PreparedQuestion[];
  /** Which file each externalId came from, for the duplicate message. */
  sources: Map<string, string>;
}

interface ReadResult {
  banks: Map<Section, SectionBank>;
  rejected: Array<RejectedQuestion & { file: string }>;
  fatal: string[];
  filesRead: number;
}

function readBankFiles(): ReadResult {
  const banks = new Map<Section, SectionBank>();
  const rejected: Array<RejectedQuestion & { file: string }> = [];
  const fatal: string[] = [];

  let files: string[];
  try {
    files = readdirSync(DATA_DIR)
      .filter((name) => name.toLowerCase().endsWith(".json"))
      .sort();
  } catch {
    return {
      banks,
      rejected,
      fatal: [`cannot read ${DATA_DIR}`],
      filesRead: 0,
    };
  }

  if (files.length === 0) fatal.push(`no .json files in ${DATA_DIR}`);

  for (const file of files) {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
    } catch (error) {
      fatal.push(`${file}: not valid JSON (${asMessage(error)})`);
      continue;
    }

    const result = prepareBank(raw);
    if (!result.ok) {
      fatal.push(`${file}: ${result.error}`);
      continue;
    }

    const { section, prepared } = result.bank;
    for (const rejection of result.bank.rejected) {
      rejected.push({ ...rejection, file });
    }

    const bank: SectionBank = banks.get(section) ?? {
      questions: [],
      sources: new Map(),
    };

    for (const question of prepared) {
      const seenIn = bank.sources.get(question.externalId);
      if (seenIn) {
        /*
         * Two files claiming the same id would silently overwrite each other on
         * upsert — the second import would replace the first question and
         * nobody would see that a question had gone missing.
         */
        rejected.push({
          file,
          externalId: question.externalId,
          reason: `duplicate id — already imported from ${seenIn}`,
        });
        continue;
      }

      bank.sources.set(question.externalId, file);
      bank.questions.push(question);
    }

    banks.set(section, bank);
  }

  for (const bank of banks.values()) {
    bank.questions.sort((a, b) => a.order - b.order);
  }

  return { banks, rejected, fatal, filesRead: files.length };
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                     */
/* -------------------------------------------------------------------------- */

interface SkillRow {
  id: string;
  name: string;
  domainName: string;
}

interface WriteTally {
  section: Section;
  created: number;
  updated: number;
  orphans: number;
}

/**
 * Load the taxonomy and refuse to continue if the code in this repository names
 * a skill the database does not have.
 *
 * This is the guard that keeps `lib/taxonomy.ts` honest. Without it a renamed
 * code would import 40 questions with a null `skill_id`, and every screen built
 * on top would show an empty state that looks like "no data yet".
 */
async function loadSkills(prisma: PrismaClient): Promise<Map<string, SkillRow>> {
  const rows = await prisma.skill.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      domain: { select: { name: true } },
    },
  });

  const skills = new Map<string, SkillRow>(
    rows.map((row) => [
      row.code,
      { id: row.id, name: row.name, domainName: row.domain.name },
    ]),
  );

  const missing = SKILL_CODES.filter((code) => !skills.has(code));
  if (missing.length > 0) {
    throw new Error(
      `the database has no skill row for: ${missing.join(", ")}. ` +
        "Either the taxonomy rows were not seeded, or lib/taxonomy.ts names a " +
        "code that no longer exists.",
    );
  }

  return skills;
}

async function importBanks(
  prisma: PrismaClient,
  banks: Map<Section, SectionBank>,
): Promise<{ skillCount: number; tallies: WriteTally[] }> {
  const skills = await loadSkills(prisma);
  const tallies: WriteTally[] = [];

  for (const [section, bank] of banks) {
    const definition = BANK_TESTS[section];

    const test = await prisma.test.upsert({
      where: { externalId: definition.externalId },
      create: {
        externalId: definition.externalId,
        title: definition.title,
        description: definition.description,
        type: section,
        isPublished: false,
        durationMinutes: definition.durationMinutes,
      },
      update: {
        title: definition.title,
        description: definition.description,
        type: section,
        durationMinutes: definition.durationMinutes,
      },
      select: { id: true },
    });

    // Read the ids that already exist so the report can separate "added" from
    // "updated" — `upsert` itself does not say which branch it took.
    const existing = await prisma.question.findMany({
      where: { testId: test.id },
      select: { externalId: true },
    });
    const existingIds = new Set(
      existing
        .map((question) => question.externalId)
        .filter((id): id is string => id !== null),
    );

    let created = 0;
    let updated = 0;

    for (const question of bank.questions) {
      // Guaranteed by `loadSkills`: every code in the vocabulary has a row.
      const skill = skills.get(question.skillCode)!;

      const fields = {
        order: question.order,
        module: "MODULE_1" as const,
        passageText: question.passageText,
        questionText: question.questionText,
        format: question.format,
        options: question.options,
        correctAnswer: question.correctAnswer,
        acceptedAnswers: question.acceptedAnswers,
        skillId: skill.id,
        domain: skill.domainName,
        skill: skill.name,
        sourceTopic: question.sourceTopic,
      };

      await prisma.question.upsert({
        where: {
          testId_externalId: {
            testId: test.id,
            externalId: question.externalId,
          },
        },
        create: {
          testId: test.id,
          externalId: question.externalId,
          ...fields,
        },
        update: fields,
        select: { id: true },
      });

      if (existingIds.has(question.externalId)) updated += 1;
      else created += 1;
    }

    const incoming = new Set(bank.questions.map((q) => q.externalId));
    const orphans = [...existingIds].filter((id) => !incoming.has(id)).length;

    tallies.push({ section, created, updated, orphans });
  }

  return { skillCount: skills.size, tallies };
}

/* -------------------------------------------------------------------------- */
/* Reporting                                                                   */
/* -------------------------------------------------------------------------- */

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function reportParse(result: ReadResult): void {
  console.log(`\nRead ${result.filesRead} file(s) from prisma/data/sat`);

  for (const [section, bank] of result.banks) {
    const overrides = bank.questions.filter(
      (question) => question.skillVia === "override",
    ).length;

    console.log(
      `  ${section.padEnd(8)} ${bank.questions.length} question(s) accepted` +
        (overrides > 0 ? `, ${overrides} filed by per-question override` : ""),
    );
  }

  if (result.rejected.length > 0) {
    console.log(`\nRejected ${result.rejected.length} question(s):`);
    for (const rejection of result.rejected) {
      const id = rejection.externalId ?? "(no id)";
      console.log(`  ✗ ${rejection.file} · ${id}\n      ${rejection.reason}`);
    }
  }

  if (result.fatal.length > 0) {
    console.log(`\nFiles that could not be read:`);
    for (const message of result.fatal) console.log(`  ✗ ${message}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

async function main(): Promise<number> {
  const dryRun = process.argv.includes("--dry-run");

  const result = readBankFiles();
  reportParse(result);

  const accepted = [...result.banks.values()].reduce(
    (total, bank) => total + bank.questions.length,
    0,
  );

  if (result.fatal.length > 0) {
    console.error("\nAborted: fix the files above and run again.");
    return 1;
  }

  if (accepted === 0) {
    console.error("\nAborted: no importable questions.");
    return 1;
  }

  if (dryRun) {
    console.log("\n--dry-run: database not touched.");
    return 0;
  }

  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    console.error(
      "\nDATABASE_URL is not set. Copy .env.example to .env and point it at a " +
        "Postgres instance first, or re-run with --dry-run.",
    );
    return 1;
  }

  printDatabaseBanner("scripts/import-sat-bank.ts");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const { skillCount, tallies } = await importBanks(prisma, result.banks);

    console.log(`\nTaxonomy: ${skillCount} skill(s) read from the database`);
    console.log("\nQuestions:");
    for (const tally of tallies) {
      console.log(
        `  ${tally.section.padEnd(8)} ${tally.created} added, ${tally.updated} updated` +
          (tally.orphans > 0
            ? `, ${tally.orphans} already in the database but absent from the files (left alone)`
            : ""),
      );
    }

    console.log(
      `\nDone: ${accepted} question(s) imported, ${result.rejected.length} rejected.`,
    );
    return 0;
  } catch (error) {
    console.error(`\nImport failed: ${asMessage(error)}`);
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(asMessage(error));
    process.exit(1);
  });
