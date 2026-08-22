/**
 * Vitest configuration.
 *
 * `npm run check` (`scripts/check-domain.ts`) stays exactly as it is — it is a
 * dependency-free smoke test of the two things whose bugs are quietest, and it
 * runs anywhere. Vitest is for the logic added from the question bank onwards,
 * where table-driven cases and per-case failure output are worth a test runner.
 *
 * The alias mirrors `tsconfig.json`'s `@/*` so tests import modules by the same
 * specifier the application uses; without it every test would have to reach
 * into the tree with `../../`.
 */

import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: root }],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
