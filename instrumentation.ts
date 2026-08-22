/**
 * Next.js startup hook — runs once per server process, before any request.
 *
 * Its whole job today is to say which database this server will talk to, on the
 * first line of `next dev` output rather than in a comment somebody has to go
 * and read. See `lib/db-banner.ts` for why that turned out to matter.
 */

export async function register() {
  /*
   * `register()` runs in the edge runtime as well, where there is no
   * `process.env.DATABASE_URL` worth reading and no database connection to
   * announce. Node only.
   */
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { printDatabaseBanner } = await import("@/lib/db-banner");
  printDatabaseBanner(`next ${process.env.NODE_ENV === "production" ? "start" : "dev"}`);
}
