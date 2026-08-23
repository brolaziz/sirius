/**
 * Onboarding — the five questions a new account answers first.
 *
 * Deliberately outside the `(app)` group, for the same reason the simulator is:
 * that layout redirects anyone who has not finished onboarding *to here*, so
 * rendering this page inside it would be a redirect loop. It also means the
 * page has to run its own auth check.
 *
 * The shell is stripped back to a logo. There is no sidebar because there is
 * nowhere else to go yet, and nothing to navigate to that would make sense
 * before these answers exist.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BackgroundWash } from "@/components/brand/background-wash";
import { Logo } from "@/components/brand/logo";
import { LangSwitch } from "@/components/i18n/lang-switch";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getOnboardingState } from "@/lib/queries/study-plan";
import { requireUserId } from "@/lib/user";

export const metadata: Metadata = {
  title: "Get started",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const userId = await requireUserId();
  const state = await getOnboardingState(userId);

  // Finished already — nothing to ask, and re-asking would look like a bug.
  if (state.completed) redirect("/dashboard");

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface">
      {/* The same light the app shell paints, so the two do not feel like different products. */}
      <BackgroundWash />

      <header className="flex items-center justify-between px-4 py-6 sm:px-8">
        <Link
          href="/dashboard"
          /*
           * `tap-target-y`: the mark paints 75x28, so only the height is
           * short. The lang switch sits at the other end of a
           * `justify-between` header and the flow below starts well clear of
           * it, so the 8px this adds above and below reaches nothing else.
           */
          className="tap-target-y inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>
        <LangSwitch />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 sm:px-8">
        <OnboardingFlow initial={state} />
      </main>
    </div>
  );
}
