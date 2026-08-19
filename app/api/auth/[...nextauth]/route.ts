/**
 * The Auth.js route handler.
 *
 * Every OAuth endpoint — `/api/auth/signin`, `/callback/google`, `/signout`,
 * `/session`, `/csrf` — is served from this one catch-all. The handlers come
 * from the config in `auth.ts`, so there is nothing to configure here.
 *
 * Node runtime, not edge: the Prisma adapter opens a TCP connection to
 * Postgres, which the edge runtime cannot do.
 */

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
