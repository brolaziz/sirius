import path from "node:path";

import type { NextConfig } from "next";

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
