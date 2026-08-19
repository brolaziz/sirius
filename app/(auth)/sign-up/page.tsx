/**
 * Sign-up.
 *
 * The same action as sign-in — Auth.js creates the account on the first Google
 * callback — with the framing a first-time visitor arrived expecting. Keeping
 * the route means every "Get started" link in the marketing site still lands
 * somewhere that makes sense.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { isGoogleConfigured } from "@/auth";
import { readSession } from "@/lib/user";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start your Sirius profile with Google.",
};

export default async function SignUpPage({
  searchParams,
}: PageProps<"/sign-up">) {
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
      mode="sign-up"
      callbackUrl={callbackUrl}
      hasError={Boolean(params.error)}
      isConfigured={isGoogleConfigured()}
    />
  );
}
