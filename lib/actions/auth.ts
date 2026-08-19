"use server";

/**
 * Sign-in and sign-out, as Server Actions.
 *
 * Auth.js v5 exposes `signIn`/`signOut` as server-side functions, which is why
 * these live here rather than in a client component calling `next-auth/react`:
 * the App Router pattern needs no `<SessionProvider>` in the tree, and the
 * OAuth redirect is issued by the server instead of being assembled in the
 * browser.
 *
 * Both throw a redirect on success — that is how `redirect()` works in Next —
 * so nothing after the call runs. Anything wrapped around these has to let the
 * `NEXT_REDIRECT` error through.
 */

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";

/**
 * Start the Google flow.
 *
 * `redirectTo` is where the user lands after Google sends them back. It is
 * validated as a same-origin path: an open redirect here would let a phishing
 * link bounce someone from our domain to theirs immediately after signing in.
 */
export async function signInWithGoogle(redirectTo?: string): Promise<void> {
  const safeTarget =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  try {
    await signIn("google", { redirectTo: safeTarget });
  } catch (error) {
    /*
     * `signIn` signals success by throwing a redirect, so only a real
     * `AuthError` is a failure. Anything else — including that redirect — has
     * to be rethrown untouched.
     */
    if (error instanceof AuthError) {
      redirect(`/sign-in?error=${encodeURIComponent(error.type)}`);
    }
    throw error;
  }
}

/** End the session and return to the landing page. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
