/**
 * Dashboard — the app's home.
 *
 * A true bento field: a 12-column grid where tiles take different widths *and*
 * heights, so the eye is pulled through a composition rather than scanning a
 * uniform table of cards. The reading order is the argument Sirius makes about
 * admissions:
 *
 *   application readiness   ← the anchor: 5 columns, two rows tall
 *   dream universities      ← 4 columns
 *   next deadline           ← 3 columns, the only dark tile on the page
 *   the SAT metrics         ← a row of four
 *   next steps · mock test  ← 7 + 5
 *
 * The SAT sits in the middle of that list rather than at the top, which is the
 * repositioning expressed as a layout decision: the application is the product,
 * the test is one input to it.
 *
 * Every number is real. "Application readiness" is computed from rows the
 * student has actually created — a target score, a completed test, three saved
 * universities, twenty saved words, half the plan — not from a pretend profile.
 * Each tile still degrades on its own: no database, no tests imported or no
 * results yet each produce an honest empty state rather than a zero.
 */

import type { Metadata } from "next";
import { BookMarked, GraduationCap, Percent, Trophy } from "lucide-react";

import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StartTestCard } from "@/components/dashboard/start-test-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RoadmapCard } from "@/components/dashboard/roadmap-card";
import {
  ReadinessCard,
  type ReadinessStep,
} from "@/components/dashboard/readiness-card";
import { UniversitiesCard } from "@/components/dashboard/universities-card";
import { DeadlineCard } from "@/components/dashboard/deadline-card";
import { BentoGrid, BentoItem } from "@/components/dashboard/bento-grid";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getDictionary, getLang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/config";
import { displayName } from "@/lib/user";
import type { Tone } from "@/lib/viz";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const t = getDictionary(await getLang());

  const target = data.user?.targetScore ?? null;
  const best = data.bestScaledScore;

  // Progress toward the target, capped at 100 so overshooting does not overflow.
  const targetProgress =
    target && best ? Math.min(100, (best / target) * 100) : undefined;

  const roadmapDone = data.roadmapTasks.filter((task) => task.isDone).length;

  /*
   * The five stages of a real application, each answered by rows that either
   * exist or do not. Deliberately unweighted: a student who has done four of
   * these is four fifths of the way through the setup, and pretending the essay
   * is worth 40% would be inventing a rubric we do not have.
   */
  const readinessSteps: ReadinessStep[] = [
    { id: "target", done: target !== null, href: "/dashboard" },
    { id: "test", done: data.testsTaken > 0, href: "/practice" },
    { id: "shortlist", done: data.shortlistCount >= 3, href: "/universities" },
    { id: "words", done: data.savedWordCount >= 20, href: "/words" },
    {
      id: "roadmap",
      done:
        data.roadmapTasks.length > 0 &&
        roadmapDone >= data.roadmapTasks.length / 2,
      href: "/dashboard",
    },
  ];

  const scoreBadge: { label: string; tone: Tone } | undefined =
    target && best
      ? best >= target
        ? { label: t.dash.targetMet, tone: "emerald" }
        : {
            label: fill(t.dash.pointsToGo, { count: target - best }),
            tone: "amber",
          }
      : undefined;

  const accuracyPercent =
    data.averageAccuracy === null ? null : data.averageAccuracy * 100;

  const accuracyBadge: { label: string; tone: Tone } | undefined =
    accuracyPercent === null
      ? undefined
      : accuracyPercent >= 75
        ? { label: t.dash.strong, tone: "emerald" }
        : accuracyPercent >= 55
          ? { label: t.dash.building, tone: "amber" }
          : { label: t.dash.needsWork, tone: "rose" };

  /** The soonest deadline among the shortlist, if any university lists one. */
  const nextDeadline =
    data.shortlisted.find(
      (university) => university.applicationDeadline !== null,
    ) ?? null;

  return (
    <div
      className="mx-auto max-w-7xl space-y-10 sm:space-y-12"
      suppressHydrationWarning
    >
      <WelcomeBanner
        name={displayName(data.user)}
        targetScore={target}
        canEdit={data.databaseReady}
      />

      <BentoGrid>
        <BentoItem className="sm:col-span-12 lg:col-span-5 lg:row-span-2">
          <ReadinessCard steps={readinessSteps} />
        </BentoItem>

        <BentoItem className="sm:col-span-7 lg:col-span-4">
          <UniversitiesCard
            universities={data.shortlisted}
            total={data.shortlistCount}
          />
        </BentoItem>

        <BentoItem className="sm:col-span-5 lg:col-span-3">
          <DeadlineCard university={nextDeadline} />
        </BentoItem>

        <BentoItem className="sm:col-span-6 lg:col-span-4">
          <MetricCard
            icon={<Trophy />}
            label={t.dash.bestScore}
            value={best}
            emptyText={t.dash.bestScoreEmpty}
            hint={target ? fill(t.dash.targetSet, { score: target }) : undefined}
            gauge={targetProgress}
            tone={best && target && best >= target ? "emerald" : "brand"}
            badge={scoreBadge}
            href="/practice"
          />
        </BentoItem>

        <BentoItem className="sm:col-span-6 lg:col-span-3">
          <MetricCard
            icon={<Percent />}
            label={t.dash.accuracy}
            value={accuracyPercent}
            decimals={0}
            suffix="%"
            emptyText={t.dash.accuracyEmpty}
            hint={t.dash.accuracyHint}
            gauge={accuracyPercent ?? undefined}
            tone={accuracyBadge?.tone ?? "brand"}
            badge={accuracyBadge}
            href="/practice"
          />
        </BentoItem>

        <BentoItem className="sm:col-span-6 lg:col-span-4">
          <MetricCard
            icon={<BookMarked />}
            label={t.dash.words}
            value={data.savedWordCount}
            tone="violet"
            hint={t.dash.wordsHint}
            href="/words"
          />
        </BentoItem>

        <BentoItem className="sm:col-span-6 lg:col-span-3">
          <MetricCard
            icon={<GraduationCap />}
            label={t.dash.shortlistCount}
            value={data.shortlistCount}
            tone="sky"
            hint={t.dash.shortlistHint}
            href="/universities"
          />
        </BentoItem>

        <BentoItem className="sm:col-span-12 lg:col-span-7">
          <RoadmapCard tasks={data.roadmapTasks} />
        </BentoItem>

        <BentoItem className="sm:col-span-12 lg:col-span-5">
          <StartTestCard test={data.featuredTest} className="min-h-64" />
        </BentoItem>

        {data.latestResult && (
          <BentoItem className="sm:col-span-12">
            <div className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.dash.lastResult}
                  </p>
                  <p className="mt-2 text-xl font-bold tracking-tight">
                    {data.latestResult.test.title}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-viz-violet-soft px-6 py-4">
                    <p className="text-xs font-semibold text-viz-violet">
                      {t.dash.raw}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-viz-violet tnum">
                      {data.latestResult.score}/
                      {data.latestResult.totalQuestions}
                    </p>
                  </div>
                  <div className="rounded-xl bg-brand-50 px-6 py-4">
                    <p className="text-xs font-semibold text-brand-700">
                      {t.dash.estimated}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-brand-700 tnum">
                      {data.latestResult.scaledScore ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </BentoItem>
        )}
      </BentoGrid>
    </div>
  );
}
