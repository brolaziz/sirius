/**
 * Auth.js (NextAuth v5) — the single source of truth for identity.
 *
 * Google is the only provider. Sirius asks for an email and a name; asking a
 * seventeen-year-old to invent another password, then handling reset flows for
 * it, is work that buys nothing.
 *
 * DATABASE SESSIONS, NOT JWTs
 * `strategy: "database"` means the session lives in the `sessions` table and
 * the cookie only carries an opaque token. Signing out therefore really ends
 * the session server-side, and a revoked account stops working on the next
 * request rather than whenever a JWT happens to expire. The cost is one query
 * per `auth()` call, which is fine for an app that already reads the database
 * on every authenticated page.
 *
 * WHERE THIS RUNS
 * Next 16's Proxy runs on the Node.js runtime, so there is no need for the
 * split "edge-safe config + full config" dance Auth.js documents for edge
 * middleware. Even so, `proxy.ts` deliberately does *not* import this module:
 * it runs on every request including prefetches, and the guidance in the Next
 * docs is to keep it to a cookie check and leave real authorisation to the
 * routes. See the comment in `proxy.ts`.
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

/**
 * True when Google OAuth is actually configured.
 *
 * Sirius is meant to be runnable — landing page, design review, database
 * setup — before anyone registers an OAuth client, so the sign-in page checks
 * this and explains what is missing instead of throwing a provider error at a
 * visitor.
 */
export function isGoogleConfigured(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  /*
   * `PrismaAdapter` takes our lazy client proxy. Nothing is constructed until
   * the adapter actually reads a table, which keeps importing this module free
   * of side effects.
   */
  adapter: PrismaAdapter(prisma),

  session: { strategy: "database" },

  providers: [
    Google({
      /*
       * `allowDangerousEmailAccountLinking` is deliberately left off. Google
       * verifies the email it returns, but turning this on would let a second
       * provider added later claim an existing account by asserting the same
       * address.
       */
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],

  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  callbacks: {
    /**
     * Put the user id on the session.
     *
     * With the database strategy Auth.js hands the callback the full user row,
     * but the default session shape only carries name/email/image. Everything
     * server-side keys off `session.user.id`, so it has to be copied across.
     */
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
