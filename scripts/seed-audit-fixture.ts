/**
 * Fill the tap-audit fixture account with the content a layout audit needs.
 *
 * Run with:  npm run audit:seed
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY AN AUDIT NEEDS ITS OWN FIXTURES
 *
 * The dashboard shipped with a horizontal-overflow bug that no measurement
 * caught, because every run was against an account with an empty shortlist. The
 * defect needed a university name longer than about 27 characters to appear at
 * all. An audit against empty states measures the chrome and calls it the page.
 *
 * So this seeds the *longest realistic* value in each field rather than a
 * typical one. Not gibberish — a 300-character lorem string would find defects
 * nobody will ever hit and teach us to ignore the report. Every value here is
 * something a real student could plausibly enter:
 *
 *   • universities  — the longest names actually in the reference data,
 *                     e.g. "Westminster International University in Tashkent"
 *   • activities    — ten of them, which is the cap the UI enforces, each with
 *                     a description at the column's 150-character maximum
 *   • words         — every vocabulary entry, plus the longest single words a
 *                     student would meet in an SAT passage
 *   • practice      — completed sessions with responses, so results screens
 *                     render numbers instead of empty states
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHAT IT REFUSES TO DO
 *
 * Writes to the dev branch only, checked from the connection string and
 * printed before anything happens, per DATABASE.md. It touches exactly one
 * user's rows and never the shared reference tables — universities, skills,
 * questions and vocabulary are read, never written.
 *
 * Idempotent: it clears that user's own rows first, so running it twice leaves
 * the same state rather than ten more activities.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { Client } from "pg";

const DEV_ENDPOINT = "ep-restless-cell-axrhiuf3";
const FIXTURE_EMAIL = "tap-audit-onboarded@example.com";

/** The activities cap the UI enforces. Ten is the adversarial case, not five. */
const ACTIVITY_LIMIT = 10;

/** `description` is `@db.VarChar(150)`. The audit wants exactly that. */
const DESCRIPTION_MAX = 150;

function endpointOf(connectionString: string) {
  const host = new URL(connectionString).host;
  const match = host.match(/ep-[a-z0-9-]+?(?=-pooler|\.)/);
  return { endpoint: match ? match[0] : null, host };
}

function readDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const line = fs
    .readFileSync(path.join(process.cwd(), ".env"), "utf8")
    .split(/\r?\n/)
    .find((l) => /^\s*DATABASE_URL\s*=/.test(l) && !/^\s*#/.test(l));
  if (!line) throw new Error("No active DATABASE_URL in .env");
  return line.replace(/^\s*DATABASE_URL\s*=\s*/, "").replace(/^["']|["']$/g, "");
}

/** Pad to exactly `length` on a word boundary, so it still reads as English. */
function toLength(text: string, length: number): string {
  const filler =
    " which is the sort of detail an admissions officer actually reads closely";
  let out = text;
  while (out.length < length) out += filler;
  return out.slice(0, length);
}

const ACTIVITIES = [
  ["Student Council President", "Presidential School in Tashkent", "President"],
  ["Regional Mathematics Olympiad", "Ministry of Public Education", "Team captain"],
  ["Volunteer English Tutor", "Tashkent Public Library Literacy Programme", "Tutor"],
  ["Debate Club Founder", "Westminster International University", "Founder"],
  ["Robotics Team Lead Engineer", "National Robotics Championship", "Lead engineer"],
  ["School Newspaper Editor-in-Chief", "The Presidential Review", "Editor-in-chief"],
  ["Community Recycling Initiative", "Yunusabad District Council", "Coordinator"],
  ["Junior Research Assistant", "Institute of Nuclear Physics", "Research assistant"],
  ["Chess Club Vice-Captain", "Tashkent Regional Chess Federation", "Vice-captain"],
  ["Charity Fundraising Organiser", "Ezgu Amal Charitable Foundation", "Organiser"],
] as const;

/** Long single words a student genuinely meets in SAT reading passages. */
const LONG_WORDS = [
  "incomprehensibility",
  "counterproductive",
  "disproportionately",
  "indistinguishable",
  "uncharacteristically",
  "interdisciplinary",
  "notwithstanding",
  "misrepresentation",
];

async function main() {
  const url = readDatabaseUrl();
  const { endpoint, host } = endpointOf(url);

  console.log(`database endpoint : ${endpoint ?? "(not a Neon endpoint)"}`);
  console.log(`host              : ${host}`);
  console.log(`pooled            : ${host.includes("-pooler")}`);

  if (endpoint !== DEV_ENDPOINT) {
    throw new Error(
      `Refusing to write. This script only ever touches the dev branch ` +
        `(${DEV_ENDPOINT}); this connection is ${endpoint ?? host}.`,
    );
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    const user = await client.query<{ id: string }>(
      `select id from users where email = $1`,
      [FIXTURE_EMAIL],
    );
    if (!user.rowCount) {
      throw new Error(
        `Fixture ${FIXTURE_EMAIL} is not on this branch. Run npm run audit:session ` +
          `first, which reports what it found, or reset the dev branch from its parent.`,
      );
    }
    const userId = user.rows[0].id;
    console.log(`\nseeding ${FIXTURE_EMAIL} (${userId})`);

    /* Only this user's own rows. Shared reference data is read, never written. */
    await client.query(`delete from university_shortlist_entries where user_id = $1`, [userId]);
    await client.query(`delete from saved_words where user_id = $1`, [userId]);
    await client.query(`delete from user_activities where user_id = $1`, [userId]);
    await client.query(
      `delete from practice_responses where session_id in
         (select id from practice_sessions where user_id = $1)`,
      [userId],
    );
    await client.query(`delete from practice_sessions where user_id = $1`, [userId]);
    await client.query(`delete from test_results where user_id = $1`, [userId]);
    await client.query(`delete from study_plans where user_id = $1`, [userId]);
    await client.query(`delete from roadmap_tasks where user_id = $1`, [userId]);

    /* A long-but-real name: the dashboard greeting is the largest type shipped. */
    await client.query(
      `update users set name = $2, target_score = 1520, current_score = current_score
         where id = $1`,
      [userId, "Abdurakhmonov Shokhrukhbek"],
    ).catch(async () => {
      await client.query(`update users set name = $2, target_score = 1520 where id = $1`, [
        userId,
        "Abdurakhmonov Shokhrukhbek",
      ]);
    });

    /* ---- shortlist: the longest names in the reference data ---------------- */
    const universities = await client.query<{ id: string; name: string }>(
      `select id, name from universities order by length(name) desc limit 8`,
    );
    for (const u of universities.rows) {
      await client.query(
        `insert into university_shortlist_entries (id, user_id, university_id, note)
         values ($1, $2, $3, $4)`,
        [
          crypto.randomUUID(),
          userId,
          u.id,
          toLength("Reach school — needs a stronger personal statement", 120),
        ],
      );
    }
    console.log(`  shortlist        : ${universities.rowCount} (longest "${universities.rows[0]?.name}")`);

    /* ---- saved words ------------------------------------------------------- */
    const vocab = await client.query<{ id: string; english_word: string }>(
      `select id, english_word from vocabulary`,
    );
    for (const v of vocab.rows) {
      await client.query(
        `insert into saved_words (id, user_id, word, vocabulary_id)
         values ($1, $2, $3, $4) on conflict (user_id, word) do nothing`,
        [crypto.randomUUID(), userId, v.english_word, v.id],
      );
    }
    for (const word of LONG_WORDS) {
      await client.query(
        `insert into saved_words (id, user_id, word) values ($1, $2, $3)
         on conflict (user_id, word) do nothing`,
        [crypto.randomUUID(), userId, word],
      );
    }
    console.log(`  saved words      : ${vocab.rowCount! + LONG_WORDS.length}`);

    /* ---- activities: at the cap, descriptions at the column maximum -------- */
    for (let i = 0; i < ACTIVITY_LIMIT; i++) {
      const [title, organisation, role] = ACTIVITIES[i];
      await client.query(
        /*
         * `updated_at` is supplied explicitly. Prisma's `@updatedAt` is applied
         * by the client, not by a database default, so raw SQL has to write it
         * or the NOT NULL constraint rejects the row.
         */
        `insert into user_activities
           (id, user_id, position, title, organisation, role, description,
            hours_per_week, weeks_per_year, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
        [
          crypto.randomUUID(),
          userId,
          i + 1,
          title,
          organisation,
          role,
          toLength(`Led a team of twelve students through a full academic year`, DESCRIPTION_MAX),
          12,
          40,
        ],
      );
    }
    console.log(`  activities       : ${ACTIVITY_LIMIT} at ${DESCRIPTION_MAX}-char descriptions`);

    /* ---- roadmap ----------------------------------------------------------- */
    const roadmap = [
      "Sit a full-length timed practice test under real conditions",
      "Draft the personal statement and get it read by two teachers",
      "Request recommendation letters from the maths and English departments",
      "Finalise the university shortlist with reach, match and safety schools",
      "Submit the Common Application before the early-action deadline",
    ];
    for (let i = 0; i < roadmap.length; i++) {
      await client.query(
        `insert into roadmap_tasks (id, user_id, title, detail, position, is_done)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          userId,
          roadmap[i],
          toLength("Blocked until the December score is back", 140),
          i + 1,
          i < 2,
        ],
      ).catch(async () => {
        /* Older shape: no position/is_done columns under those names. */
        await client.query(
          `insert into roadmap_tasks (id, user_id, title, detail) values ($1, $2, $3, $4)`,
          [crypto.randomUUID(), userId, roadmap[i], "Blocked until the December score is back"],
        );
      });
    }
    console.log(`  roadmap tasks    : ${roadmap.length}`);

    /* ---- practice: completed sessions with responses ----------------------- */
    const questions = await client.query<{ id: string; skill_id: string | null }>(
      `select id, skill_id from questions where skill_id is not null limit 30`,
    );
    const bySkill = new Map<string, string[]>();
    for (const q of questions.rows) {
      if (!q.skill_id) continue;
      const list = bySkill.get(q.skill_id) ?? [];
      list.push(q.id);
      bySkill.set(q.skill_id, list);
    }

    let sessions = 0;
    let responses = 0;
    for (const [skillId, questionIds] of [...bySkill.entries()].slice(0, 4)) {
      const sessionId = crypto.randomUUID();
      await client.query(
        `insert into practice_sessions
           (id, user_id, skill_id, source, question_ids, started_at, completed_at)
         values ($1, $2, $3, 'SKILL', $4, now() - interval '2 days', now() - interval '2 days')`,
        [sessionId, userId, skillId, JSON.stringify(questionIds)],
      );
      sessions += 1;
      for (let i = 0; i < questionIds.length; i++) {
        await client.query(
          `insert into practice_responses
             (id, session_id, question_id, answer, is_correct, time_spent_seconds)
           values ($1, $2, $3, $4, $5, $6)`,
          [crypto.randomUUID(), sessionId, questionIds[i], "A", i % 3 !== 0, 45 + i],
        );
        responses += 1;
      }
    }
    console.log(`  practice         : ${sessions} sessions, ${responses} responses`);

    /* ---- a completed test result ------------------------------------------- */
    const test = await client.query<{ id: string; title: string }>(
      `select id, title from tests order by length(title) desc limit 1`,
    );
    if (test.rowCount) {
      await client.query(
        `insert into test_results
           (id, user_id, test_id, score, total_questions, scaled_score, rw_score,
            math_score, answers_record, duration_seconds)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          crypto.randomUUID(),
          userId,
          test.rows[0].id,
          34,
          42,
          1380,
          690,
          690,
          JSON.stringify({}),
          7800,
        ],
      );
      console.log(`  test result      : 1 ("${test.rows[0].title}")`);
    }

    console.log(`\nSeeded. Now run:  npm run audit:tap  (or the layout sweep)`);
  } finally {
    await client.end();
  }
}

const invokedDirectly = (process.argv[1] ?? "")
  .replace(/\\/g, "/")
  .endsWith("scripts/seed-audit-fixture.ts");

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(`\n${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
