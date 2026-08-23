/**
 * Profile — the account, and the numbers the whole app is measured against.
 *
 * Two cards, in the order a student would ask about them: who Sirius thinks
 * they are, then what they are aiming at. Only the target score is editable
 * here. The current score and the exam date are onboarding's answers and have
 * no editor yet, so they are shown as read-only rows with a line saying where
 * they come from — a disabled input that looks editable is a worse answer than
 * a value with an explanation.
 *
 * The name and the email are Google's. There is nothing to edit: changing them
 * means changing the Google account, and a field here that silently disagreed
 * with the one the student signs in with would be a trap.
 */

import type { Metadata } from "next";

import { TargetScoreForm } from "@/components/profile/target-score-form";
import { DatabaseSetupBanner } from "@/components/dashboard/database-setup-banner";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/config";

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

        <TargetScoreForm
          targetScore={user?.targetScore ?? null}
          currentScore={user?.currentScore ?? null}
        />

        <dl className="mt-7 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          <Row
            label={t.onboarding.currentLabel}
            value={user?.currentScore === null || user?.currentScore === undefined
              ? null
              : String(user.currentScore)}
            empty={t.profile.notSet}
            numeric
          />
          <Row
            label={t.onboarding.dateLabel}
            value={
              user?.targetExamDate ? formatDate(user.targetExamDate, lang) : null
            }
            empty={t.profile.notSet}
            numeric
          />
        </dl>

        <p className="mt-5 text-xs text-muted-foreground">
          {t.profile.lockedNote}
        </p>
      </section>
    </div>
  );
}

/** One read-only fact. `<dt>`/`<dd>`, because that is what these rows are. */
function Row({
  label,
  value,
  empty,
  numeric = false,
}: {
  label: string;
  value: string | null;
  empty: string;
  numeric?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/50 px-4 py-3">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd
        className={
          value === null
            ? "mt-1 truncate text-sm text-muted-foreground"
            : numeric
              ? "mt-1 truncate text-sm font-bold tnum"
              : "mt-1 truncate text-sm font-bold"
        }
      >
        {value ?? empty}
      </dd>
    </div>
  );
}

/**
 * The exam date, in the interface language. UTC because the column stores the
 * midnight the student picked on a calendar, not an instant — see the note in
 * `lib/validation/onboarding.ts`.
 */
function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "uz" ? "uz-UZ" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
