/**
 * One line, printed once per process, naming the database this run will use.
 *
 * WHY THIS EXISTS
 * A comment in `.env` claimed the connection string was a local database while
 * it pointed at hosted Neon. An audit run then created accounts and fixture
 * rows against shared data, and nothing on screen contradicted the comment at
 * any point. The fix is not a better comment: it is to make the fact visible on
 * every start, from the URL itself, where it cannot drift.
 *
 * WHAT IT PRINTS AND WHAT IT REFUSES TO PRINT
 * The endpoint id — `ep-restless-cell-axrhiuf3` — because that is what
 * distinguishes a Neon branch from production; "connected" would say nothing.
 * Never the user, never the password: this line is designed to be safe in a CI
 * log and in a screen share, so it is built from the host and path only.
 *
 * This is not a guard. It stops nothing. It exists so that the answer to "which
 * database am I on" is on screen rather than in a file somebody has to read.
 * The guards are in `DATABASE.md`, deferred deliberately.
 */

export interface DatabaseIdentity {
  /**
   * Neon endpoint id, e.g. `ep-restless-cell-axrhiuf3`, with the `-pooler`
   * suffix removed so a pooled and a direct connection to the same branch read
   * as the same place. Null when the host is not a Neon endpoint.
   */
  endpointId: string | null;
  host: string;
  database: string;
  /** The connection goes through Neon's connection pooler. */
  pooled: boolean;
  /**
   * `DATABASE_ENV`, once it exists. Null today: declaring the environment is
   * the deferred first layer in `DATABASE.md`, and this prints `unset` rather
   * than guessing — a guess is what got us here.
   */
  env: string | null;
}

/**
 * Read the identity out of a connection string without connecting to anything.
 *
 * Returns null when the string cannot be parsed, which is a real case worth
 * surfacing loudly: a stray character after the closing quote in `.env` makes
 * dotenv hand over the quotes as part of the value, and every connection then
 * fails with an error that names neither the file nor the line.
 */
export function describeDatabase(
  connectionString: string | undefined = process.env.DATABASE_URL,
): DatabaseIdentity | null {
  if (!connectionString) return null;

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return null;
  }

  const host = url.host;
  const firstLabel = url.hostname.split(".")[0] ?? "";
  const pooled = firstLabel.endsWith("-pooler");
  const isNeonEndpoint = firstLabel.startsWith("ep-");

  return {
    endpointId: isNeonEndpoint
      ? firstLabel.replace(/-pooler$/, "")
      : null,
    host,
    database: url.pathname.replace(/^\//, "") || "(none)",
    pooled,
    env: process.env.DATABASE_ENV ?? null,
  };
}

/** The line itself, so it can be tested without capturing stdout. */
export function databaseBanner(
  context: string,
  connectionString: string | undefined = process.env.DATABASE_URL,
): string {
  if (!connectionString) {
    return `[db] DATABASE_URL is not set · ${context}`;
  }

  const identity = describeDatabase(connectionString);

  if (!identity) {
    return (
      `[db] DATABASE_URL could not be parsed — nothing will connect · ${context}\n` +
      "      Check .env for stray quotes or characters after the end of the line."
    );
  }

  const place = identity.endpointId
    ? `${identity.endpointId}${identity.pooled ? " (pooled)" : ""}`
    : identity.host;

  return `[db] ${place} · ${identity.database} · env: ${identity.env ?? "unset"} · ${context}`;
}

/*
 * Printed once per process — and the flag lives on `globalThis`, not in module
 * scope, because module scope is not once per process here.
 *
 * Next bundles the server's startup hook and the application's own modules
 * separately, so both get their own copy of this file and a module-level
 * boolean suppresses nothing: the first dev run printed the line twice. A
 * symbol on the global object is shared by every bundle in the process, which
 * is the lifetime this is actually about.
 */
const PRINTED = Symbol.for("sirius.db-banner-printed");

type BannerGlobal = typeof globalThis & { [PRINTED]?: boolean };

export function printDatabaseBanner(context: string): void {
  const scope = globalThis as BannerGlobal;
  if (scope[PRINTED]) return;
  scope[PRINTED] = true;
  console.log(databaseBanner(context));
}
