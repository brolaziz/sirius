/**
 * Request interceptor.
 *
 * FILE NAME: this is `proxy.ts`, not `middleware.ts`. As of Next.js 16,
 * Middleware was renamed to Proxy; the behaviour is unchanged.
 *
 * WHAT THIS IS AND IS NOT
 * This layer exists for **user experience**: it turns an unauthenticated visit
 * to `/dashboard` into a redirect to `/sign-in` with a return URL, instead of a
 * bare 404 or an empty page.
 *
 * It is *not* the authorisation boundary, and it deliberately does not import
 * `auth.ts`. Proxy runs on every request, including prefetches, and the Next
 * documentation is explicit that it should stay an optimistic cookie check
 * rather than hitting the database. Reading the session properly here would
 * mean a Postgres round trip for every prefetched link on the page.
 *
 * So this only asks "is there a session cookie at all?". A forged or expired
 * cookie gets past it and is then rejected by the real guard, which is
 * resource-based and lives next to the data:
 *   • `app/(app)/layout.tsx`  — `requireUser()` for every page in the group
 *   • `app/simulator/[testId]/page.tsx` — `requireUser()`
 *   • `lib/actions/*`         — every Server Action re-checks the session and
 *                               scopes its query by `userId`
 *   • `app/api/tests/import`  — bearer-token check
 *
 * A path listed here being wrong degrades the redirect, not the security.
 */

import { NextResponse, type NextRequest } from "next/server";

/**
 * Path prefixes that should bounce signed-out visitors to sign-in.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/practice",
  "/simulator",
  "/universities",
  "/words",
] as const;

/**
 * The names Auth.js gives its session cookie. The `__Secure-` variant is used
 * whenever the site is served over HTTPS, so both have to be checked.
 */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value,
  );

  if (hasSession) return NextResponse.next();

  const signIn = new URL("/sign-in", request.url);
  // Bring them back to where they were headed once they are through.
  signIn.searchParams.set("callbackUrl", pathname);

  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next.js internals, static files and the auth
     * endpoints themselves — redirecting `/api/auth/*` would break sign-in.
     */
    "/((?!api|_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
