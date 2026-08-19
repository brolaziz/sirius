/**
 * Prisma client singleton.
 *
 * Two things here are specific to Prisma 7 and worth knowing before you edit:
 *
 *  1. `PrismaClient` comes from the generated output (`lib/generated/prisma`),
 *     not from `@prisma/client`. Run `npx prisma generate` after schema edits.
 *  2. A driver adapter is mandatory. We use `@prisma/adapter-pg`, which talks to
 *     Postgres over the `pg` driver — there is no bundled query engine binary.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THE POOL IS SIZED THE WAY IT IS  (fixes Postgres error 08P01)
 *
 * `npx prisma dev` is not a real Postgres server: it is PGlite — Postgres
 * compiled to WebAssembly, running inside one Node process — with a TCP shim in
 * front of it. That shim cannot safely serve several connections at once, and
 * when it tries, the wire protocol gets crossed and Postgres reports:
 *
 *     08P01  bind message supplies 2 parameters,
 *            but prepared statement "" requires 0
 *
 * which is one query's Bind arriving against another query's Parse. Measured on
 * this project, twelve parallel queries against `prisma dev`:
 *
 *     pool max = 10  →  fails on the first round
 *     pool max = 1   →  survives 60 parallel queries, repeatedly
 *
 * A pool of one does not mean one query at a time for the *user* — `pg` queues
 * them and they still run back to back on a single connection, which is exactly
 * what the shim can handle. It is the driver-adapter equivalent of the
 * `?connection_limit=1` you would append to a `DATABASE_URL` behind PgBouncer
 * in transaction mode, and it is needed for the same reason.
 *
 * On a real Postgres (Neon, Supabase, RDS, a local `postgres` service) raise it:
 *
 *     DATABASE_POOL_MAX=10
 *
 * The app went from two queries per request to a dozen when Auth.js arrived —
 * session lookup, user row, roadmap count, dashboard batch — which is why this
 * only started biting after that migration.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Instantiation is **lazy**. Sirius should be runnable — landing page, sign-in,
 * design review — before anyone provisions a database, so a missing
 * `DATABASE_URL` must not crash the process at import time. The client is built
 * on first property access instead, which means a missing connection string
 * only fails the request that actually touches the database.
 */

import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

/** True when a usable `DATABASE_URL` is present in the environment. */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  // `prisma init` writes a placeholder URL; treat it as "not configured" so the
  // UI shows setup guidance instead of a connection error.
  if (url.includes("johndoe:randompassword")) return false;
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

/**
 * How many connections the pool may open.
 *
 * One by default — see the note above. `DATABASE_POOL_MAX` raises it for a real
 * Postgres server.
 */
function poolSize(): number {
  const configured = Number(process.env.DATABASE_POOL_MAX);
  return Number.isInteger(configured) && configured > 0 ? configured : 1;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env, point it at a " +
        "Postgres instance, then run `npx prisma db push`.",
    );
  }

  const pool = new pg.Pool({
    connectionString,
    max: poolSize(),
    // `prisma dev` drops idle connections; keepalives stop pg handing out one
    // that the server has already closed.
    keepAlive: true,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  /*
   * MUST NOT BE OMITTED.
   *
   * `pg.Pool` is an EventEmitter, and an 'error' event with no listener is an
   * *unhandled* error event — which in Node terminates the process. When the
   * dev database drops an idle connection that turns into the Next dev server
   * dying and restarting, and the browser reloading the page, about once a
   * second. Swallowing it here is correct: the pool has already discarded the
   * broken connection, and the next query gets a fresh one.
   */
  pool.on("error", (error) => {
    console.warn(`[prisma] idle connection dropped: ${error.message}`);
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Cache the instance on `globalThis` in development. Next.js reloads modules on
 * every edit, and without this each reload would open a fresh connection pool
 * until Postgres refuses new clients.
 */
const globalForPrisma = globalThis as unknown as {
  __siriusPrisma?: PrismaClient;
};

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.__siriusPrisma) {
    globalForPrisma.__siriusPrisma = createPrismaClient();
  }
  return globalForPrisma.__siriusPrisma;
}

/**
 * The shared Prisma client.
 *
 * A `Proxy` defers construction to the first property access (`prisma.user`,
 * `prisma.$transaction`, …) so importing this module is always side-effect free.
 *
 * Note `Reflect.get(client, property)` — deliberately *without* passing the
 * proxy as the receiver. Prisma's model delegates are lazily-built getters that
 * read internal state through `this`; handing them the proxy as `this` sends
 * every internal lookup back through this trap and re-enters the client while
 * it is mid-construction. Binding methods to the real client is what keeps
 * `prisma.user.findMany()` and `prisma.$transaction()` behaving normally.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(_target, property) {
    return property in getPrismaClient();
  },
});
