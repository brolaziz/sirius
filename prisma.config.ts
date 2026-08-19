/**
 * Prisma CLI configuration.
 *
 * New in Prisma 7: the datasource URL lives here rather than in
 * `schema.prisma`, and `.env` is not read automatically — hence the explicit
 * `dotenv/config` import at the top.
 */

import "dotenv/config";
import { defineConfig } from "prisma/config";

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
