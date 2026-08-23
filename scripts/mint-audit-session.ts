/**
 * Mint the sessions `npm run audit:tap` needs, and collect the ids its dynamic
 * routes need.
 *
 * Run with:  npm run audit:session
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS IS A SEPARATE COMMAND
 *
 * It writes to the database. `npm run audit:tap` only reads a browser, so it
 * stays safe to run at any time; this one is the step you have to ask for. The
 * split is deliberate — an audit that quietly creates rows is how the previous
 * pass ended up writing fixture accounts into shared data while a comment in
 * `.env` claimed the connection was local.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHAT IT REFUSES TO DO
 *
 * It prints the endpoint before touching anything, per `DATABASE.md`, and then
 * refuses outright unless that endpoint is the dev branch. Production and the
 * preview branch are not "be careful" cases here, they are "stop" cases: there
 * is no version of this script that should ever create a live session on an
 * account somebody is using.
 *
 * It also insists on a `tap-audit*` fixture rather than taking the first
 * onboarded account it finds. The first draft of this sorted users by email and
 * selected a real person's Google account, which an audit should never be
 * driving.
 *
 * Sessions are written with a short expiry and `npm run audit:tap` deletes them
 * when it finishes, so a normal run leaves nothing behind.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { Client } from "pg";

/** The only endpoint this script will write to. */
const DEV_ENDPOINT = "ep-restless-cell-axrhiuf3";

/** Where the tokens and ids land for `audit-tap-targets.run.ts` to pick up. */
export const SESSION_FILE = path.join(process.cwd(), ".audit-session.json");

export interface AuditSession {
  endpoint: string;
  tokens: { onboarded: string; new: string };
  ids: { universityId: string | null; testId: string | null };
  userIds: string[];
  expires: string;
}

/**
 * The endpoint id from a connection string, `-pooler` removed so a pooled and a
 * direct connection to the same branch read as the same place.
 *
 * Deliberately built from the host alone — never the user, never the password —
 * so the line it prints is safe in a CI log and in a screen share.
 */
function endpointOf(connectionString: string): { endpoint: string | null; host: string } {
  const host = new URL(connectionString).host;
  const match = host.match(/ep-[a-z0-9-]+?(?=-pooler|\.)/);
  return { endpoint: match ? match[0] : null, host };
}

function readDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = path.join(process.cwd(), ".env");
  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((l) => /^\s*DATABASE_URL\s*=/.test(l) && !/^\s*#/.test(l));

  if (!line) throw new Error("No active DATABASE_URL in .env");
  return line.replace(/^\s*DATABASE_URL\s*=\s*/, "").replace(/^["']|["']$/g, "");
}

export async function mintAuditSessions(): Promise<AuditSession> {
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
    const fixtures = await client.query<{
      id: string;
      email: string;
      onboarded: boolean;
    }>(
      `select id, email, onboarding_completed_at is not null as onboarded
         from users
        where email like 'tap-audit%'`,
    );

    const onboarded = fixtures.rows.find((r) => r.onboarded);
    const fresh = fixtures.rows.find((r) => !r.onboarded);

    if (!onboarded || !fresh) {
      throw new Error(
        "The tap-audit fixtures are missing from the dev branch. Expected one " +
          "account with onboarding complete and one without; found: " +
          (fixtures.rows.map((r) => `${r.email} (onboarded=${r.onboarded})`).join(", ") ||
            "none") +
          ". Recreate them, or reset the dev branch from its parent.",
      );
    }

    console.log(`\nonboarded fixture : ${onboarded.email}`);
    console.log(`new-user fixture  : ${fresh.email}`);

    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const mint = async (userId: string) => {
      const token = `${crypto.randomUUID()}.${crypto.randomBytes(16).toString("hex")}`;
      await client.query(
        `insert into sessions (id, session_token, user_id, expires)
         values ($1, $2, $3, $4)`,
        [crypto.randomUUID(), token, userId, expires],
      );
      return token;
    };

    const tokens = {
      onboarded: await mint(onboarded.id),
      new: await mint(fresh.id),
    };

    /*
     * Ids for the dynamic routes, read rather than hard-coded so the surface
     * list survives the dev branch being reset from its parent.
     */
    const university = await client.query<{ id: string }>(
      `select id from universities order by name limit 1`,
    );
    const test = await client.query<{ id: string }>(
      `select id from tests order by title limit 1`,
    );

    const session: AuditSession = {
      endpoint: DEV_ENDPOINT,
      tokens,
      ids: {
        universityId: university.rows[0]?.id ?? null,
        testId: test.rows[0]?.id ?? null,
      },
      userIds: [onboarded.id, fresh.id],
      expires: expires.toISOString(),
    };

    fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
    console.log(`\nsessions minted, expiring ${expires.toISOString()}`);
    console.log(`written to .audit-session.json (gitignored)`);
    if (!session.ids.universityId) console.log("WARNING: no universities on this branch");
    if (!session.ids.testId) console.log("WARNING: no tests on this branch");
    console.log(`\nNow run:  npm run audit:tap`);

    return session;
  } finally {
    await client.end();
  }
}

/** Delete the sessions this script created. Called by the runner when it exits. */
export async function revokeAuditSessions(): Promise<number> {
  if (!fs.existsSync(SESSION_FILE)) return 0;

  const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8")) as AuditSession;
  const url = readDatabaseUrl();
  const { endpoint } = endpointOf(url);
  if (endpoint !== DEV_ENDPOINT) return 0;

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const result = await client.query(
      `delete from sessions where session_token = any($1::text[])`,
      [[session.tokens.onboarded, session.tokens.new]],
    );
    fs.rmSync(SESSION_FILE, { force: true });
    return result.rowCount ?? 0;
  } finally {
    await client.end();
  }
}

const invokedDirectly = (process.argv[1] ?? "")
  .replace(/\\/g, "/")
  .endsWith("scripts/mint-audit-session.ts");

if (invokedDirectly) {
  mintAuditSessions().catch((error: unknown) => {
    console.error(`\n${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
