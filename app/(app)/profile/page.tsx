/**
 * Profile — the account, and the numbers the whole app is measured against.
 *
 * Preparation settings rebuild the study plan without overwriting past plans.
 *
 * The name and the email are Google's. There is nothing to edit: changing them
 * means changing the Google account, and a field here that silently disagreed
 * with the one the student signs in with would be a trap.
 */

import type { Metadata } from "next";

import { StudyPreferencesForm } from "@/components/profile/study-preferences-form";
import { DatabaseSetupBanner } from "@/components/dashboard/database-setup-banner";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";


export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const userId = await requireUserId();
  const lang = await getLang();
  const t = getDictionary(lang);

  const databaseReady = isDatabaseConfigured();

  const user = databaseReady
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          targetScore: true,
          weeklyStudyMinutes: true,
          currentScore: true,
          targetExamDate: true,
        },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t.profile.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl leading-[1.02] font-extrabold tracking-tightest text-balance sm:text-5xl">
          {t.profile.title}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {t.profile.body}
        </p>
      </div>

      {!databaseReady && <DatabaseSetupBanner />}

      <section className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <h2 className="text-xl font-bold tracking-tight">
          {t.profile.accountHeading}
        </h2>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <Row label={t.profile.name} value={user?.name ?? null} empty={t.profile.notSet} />
          <Row
            label={t.profile.email}
            value={user?.email ?? null}
            empty={t.profile.notSet}
          />
        </dl>

        <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
          {t.profile.accountNote}
        </p>
      </section>

      <section className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <h2 className="text-xl font-bold tracking-tight">
          {t.profile.satHeading}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t.profile.planNote}
        </p>

        <StudyPreferencesForm key={JSON.stringify([user?.currentScore, user?.targetScore, user?.targetExamDate, user?.weeklyStudyMinutes])} initial={{
          currentScore: user?.currentScore ?? null, targetScore: user?.targetScore ?? null,
          examDate: user?.targetExamDate?.toISOString().slice(0, 10) ?? "", weeklyStudyMinutes: user?.weeklyStudyMinutes ?? 300,
        }} />
      </section>
    </div>
  );
}

function Row({ label, value, empty }: { label: string; value: string | null; empty: string }) {
  return <div className="min-w-0 rounded-xl bg-muted/50 px-4 py-3">
    <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-words text-sm font-bold">{value ?? empty}</dd>
  </div>;
}
