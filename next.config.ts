import path from "node:path";

import type { NextConfig } from "next";

import { printDatabaseBanner } from "./lib/db-banner";

/*
 * Name the database before the server says "Ready".
 *
 * `instrumentation.ts` is the documented startup hook and prints this too, but
 * in dev it does not run until the first request compiles — so on its own the
 * endpoint appears only once traffic arrives, which is after the moment
 * somebody would have wanted to see it. This file is evaluated at boot for
 * `dev`, `build` and `start` alike. The banner is idempotent per process, so
 * whichever runs first is the one that prints.
 */
printDatabaseBanner("next.config.ts");

const nextConfig: NextConfig = {
  /*
   * Pin the Turbopack workspace root to this project.
   *
   * Turbopack infers the root by walking up for a lockfile. This project lives
   * under a user directory that contains an unrelated `package-lock.json`, so
   * without this it warns and picks a root outside the repository.
   */
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  images: {
    /*
     * University cover photos. Only Unsplash's image CDN is allowed — an open
     * `**` pattern would let any URL that reaches the database become a request
     * from our own domain.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
