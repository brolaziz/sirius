/**
 * The weekly study plan.
 *
 * Everything on this page comes out of `lib/study-plan.ts` and was written down
 * when the plan was generated — nothing here recomputes anything. That is what
 * makes the page honest: a student who moves their exam date sees the old plan,
 * with the old assumptions printed on it, until they rebuild it.
 *
 * The projection is labelled as an estimate everywhere it appears. It is a
 * model's answer, not a promise, and a number this consequential has to say so.
 */

import type { Metadata } from "next";
import { CalendarDays, Gauge, Target, TrendingUp } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { RegeneratePlanButton } from "@/components/plan/regenerate-plan-button";
import { StartPracticeButton } from "@/components/practice/start-practice-button";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/config";
import {
  getCurrentStudyPlan,
  type PlanTaskView,
  type PlanWeekView,
  type StudyPlanView,
} from "@/lib/queries/study-plan";
import type { Dictionary, Lang } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Plan",
};

export default async function PlanPage() {
  const databaseReady = isDatabaseConfigured();
  const userId = databaseReady ? await getCurrentUserId() : null;
  const lang = await getLang();
  const t = getDictionary(lang);

  const plan = userId ? await getCurrentStudyPlan(userId) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t.plan.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl leading-[1.02] font-extrabold tracking-tightest text-balance sm:text-5xl lg:text-6xl">
          {t.plan.title}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {t.plan.body}
        </p>
      </div>

      {plan === null ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <CalendarDays className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold">{t.plan.empty}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t.plan.emptyBody}
          </p>
          <div className="mt-6 flex justify-center">
            <RegeneratePlanButton variant="default" className="shadow-glow" />
          </div>
        </div>
      ) : (
        <PlanBody plan={plan} lang={lang} t={t} />
      )}
    </div>
  );
}

function PlanBody({
  plan,
  lang,
  t,
}: {
  plan: StudyPlanView;
  lang: Lang;
  t: Dictionary;
}) {
  const current =
    plan.weeks.find((week) => week.week === plan.currentWeek) ?? null;

  return (
    <>
      {/* Summary */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Target />}
          label={t.plan.target}
          value={plan.targetScore}
          tone="brand"
        />

        <MetricCard
          icon={<TrendingUp />}
          label={t.plan.projected}
          value={plan.projectedScore}
          emptyText={t.plan.projectedUnknown}
          hint={
            plan.projectedScore === null
              ? t.plan.projectedUnknownNote
              : t.plan.projectedNote
          }
          tone={plan.onTrack ? "emerald" : "amber"}
          badge={
            plan.projectedScore === null
              ? undefined
              : {
                  label: plan.onTrack ? t.plan.onTrack : t.plan.offTrack,
                  tone: plan.onTrack ? "emerald" : "rose",
                }
          }
        />

        <Tile
          icon={<CalendarDays className="size-5" />}
          label={t.plan.examDate}
          value={formatDate(plan.examDate, lang, { long: true })}
          hint={fill(t.plan.weeksLeft, { count: plan.weeksRemaining })}
        />

        <Tile
          icon={<Gauge className="size-5" />}
          label={t.plan.weeklyLoadLabel}
          value={fill(t.plan.questionsCount, { count: plan.weeklyQuestions })}
          hint={fill(t.plan.weeksLeft, { count: plan.weekCount })}
        />
      </section>

      {/* Honest caveats, when they apply. */}
      {(!plan.onTrack || plan.bankLimited) && (
        <section className="space-y-3">
          {!plan.onTrack && plan.shortfallMinutesPerWeek > 0 && (
            <Note tone="amber">
              {fill(t.plan.shortfall, { count: plan.shortfallMinutesPerWeek })}
            </Note>
          )}
          {plan.bankLimited && <Note tone="muted">{t.plan.bankLimited}</Note>}
        </section>
      )}

      {/* This week */}
      {current && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t.plan.thisWeek}
          </h2>

          <div className="mt-5 rounded-2xl bg-card p-6 shadow-card sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-xl font-bold tracking-tight">
                {fill(t.plan.weekLabel, { n: current.week })}
              </h3>
              <p className="text-sm text-muted-foreground tnum">
                {fill(t.plan.due, {
                  date: formatDate(current.dueDate, lang),
                })}{" "}
                · {fill(t.plan.questionsCount, { count: current.questions })}
              </p>
            </div>

            <ul className="mt-5 space-y-2.5">
              {current.tasks.map((task) => (
                <li key={task.id}>
                  <TaskRow task={task} lang={lang} t={t} />
                </li>
              ))}
            </ul>

          </div>
        </section>
      )}

      {/* Every week */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t.plan.allWeeks}
          </h2>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-muted-foreground sm:block">
              {t.plan.regenerateHint}
            </p>
            <RegeneratePlanButton />
          </div>
        </div>

        <StaggerGroup immediate className="mt-5 grid gap-4 lg:grid-cols-2">
          {plan.weeks.map((week) => (
            <StaggerItem key={week.week}>
              <WeekCard
                week={week}
                isCurrent={week.week === current?.week}
                lang={lang}
                t={t}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

function WeekCard({
  week,
  isCurrent,
  lang,
  t,
}: {
  week: PlanWeekView;
  isCurrent: boolean;
  lang: Lang;
  t: Dictionary;
}) {
  return (
    <article
      className={
        isCurrent
          ? "h-full rounded-2xl bg-card p-6 shadow-card ring-1 ring-primary/40"
          : "h-full rounded-2xl bg-card p-6 shadow-card"
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold tracking-tight">
          {fill(t.plan.weekLabel, { n: week.week })}
        </h3>
        <p className="text-xs text-muted-foreground tnum">
          {formatDate(week.startDate, lang)} — {formatDate(week.dueDate, lang)}
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {week.tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="min-w-0 truncate">{skillName(task, lang)}</span>
            <span className="shrink-0 text-xs text-muted-foreground tnum">
              {fill(t.plan.questionsCount, { count: task.targetQuestions })}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function TaskRow({
  task,
  lang,
  t,
}: {
  task: PlanTaskView;
  lang: Lang;
  t: Dictionary;
}) {
  const done = Math.min(task.completedQuestions, task.targetQuestions);
  const percent =
    task.targetQuestions > 0 ? (done / task.targetQuestions) * 100 : 0;

  return (
    <div className="rounded-xl border border-border px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {skillName(task, lang)}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {task.domainName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="text-xs text-muted-foreground tnum">
            {done > 0
              ? `${done} / ${task.targetQuestions}`
              : fill(t.plan.questionsCount, { count: task.targetQuestions })}
          </p>
          <StartPracticeButton planTaskId={task.id} variant="outline" size="sm" />
        </div>
      </div>

      {done > 0 && (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-viz-emerald"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl bg-card p-6 shadow-card">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-primary">
        {icon}
      </span>

      <div className="mt-6">
        <p className="text-2xl font-extrabold tracking-tightest">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function Note({
  tone,
  children,
}: {
  tone: "amber" | "muted";
  children: React.ReactNode;
}) {
  return (
    <p
      className={
        tone === "amber"
          ? "rounded-xl bg-viz-amber-soft px-4 py-3 text-sm text-viz-amber"
          : "rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground"
      }
    >
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Skill names are stored in both languages on the taxonomy rows, so this picks
 * rather than translates. An Uzbek name that was never written falls back to
 * the English one — a missing translation should show the skill, not a blank.
 */
function skillName(task: PlanTaskView, lang: Lang): string {
  if (lang === "uz" && task.skillNameUz) return task.skillNameUz;
  return task.skillName;
}

function formatDate(
  date: Date,
  lang: Lang,
  options?: { long?: boolean },
): string {
  return new Intl.DateTimeFormat(lang === "uz" ? "uz-UZ" : "en-GB", {
    day: "numeric",
    month: options?.long ? "long" : "short",
    timeZone: "UTC",
  }).format(date);
}
