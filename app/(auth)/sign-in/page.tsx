/**
 * Sign-in.
 *
 * A plain route now — Clerk needed an optional catch-all (`[[...sign-in]]`) for
 * its sub-routes, Auth.js serves every OAuth step from `/api/auth/*` instead.
 *
 * Anyone who already has a session is sent on rather than shown a sign-in form
 * they do not need.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { isGoogleConfigured } from "@/auth";
import { readSession } from "@/lib/user";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Sirius with Google.",
};

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  /*
   * Only send an *actually* signed-in visitor to the dashboard. If the session
   * cannot be read — a database blip — fall through and render the sign-in
   * panel instead. Redirecting on an unknown state is the other half of the
   * bounce that `readSession` exists to stop: the dashboard would send them
   * here, and here would send them straight back.
   */
  const state = await readSession();
  if (state.status === "signed-in") redirect("/dashboard");

  const params = await searchParams;
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

  return (
    <AuthPanel
      mode="sign-in"
      callbackUrl={callbackUrl}
      hasError={Boolean(params.error)}
      isConfigured={isGoogleConfigured()}
    />
  );
}
