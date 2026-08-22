/**
 * Prisma CLI configuration.
 *
 * New in Prisma 7: the datasource URL lives here rather than in
 * `schema.prisma`, and `.env` is not read automatically — hence the explicit
 * `dotenv/config` import at the top.
 */

import "dotenv/config";
import { defineConfig } from "prisma/config";

import { printDatabaseBanner } from "./lib/db-banner";

/*
 * Every `prisma` command loads this file — `db push`, `migrate`, `studio`,
 * `generate` — so printing here covers the CLI surface that can rewrite a
 * schema or drop data, which is the surface where being on the wrong endpoint
 * costs the most.
 */
printDatabaseBanner("prisma cli");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Runs after `prisma migrate reset` / `migrate dev`, and via `npm run db:seed`.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
