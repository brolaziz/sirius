/**
 * Reported admissions outcomes for one university — one square per decision.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHAT THIS COMPONENT REFUSES TO DO
 *
 * It never draws a square Sirius does not have. The grid other admissions sites
 * show is built from thousands of self-reported results collected over years;
 * we have none of that yet, so the empty state says exactly that instead of
 * filling the space with plausible-looking colour.
 *
 * When a square *is* demonstration data — a row shipped with the repository so
 * the layout can be reviewed — the panel says so in the open, next to the
 * numbers rather than in a footnote. A made-up outcome rendered identically to
 * a real one is the most misleading thing this product could put on a screen.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * A server component: the grid is static, and a hover title is enough for
 * "1480, accepted, 2025". Making it interactive would ship a client bundle for
 * a tooltip.
 */

import { Grid2x2, Info } from "lucide-react";

import { fill } from "@/lib/i18n/config";
import {
  sortOutcomes,
  summariseAdmissions,
  type AdmissionsOutcome,
} from "@/lib/universities";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/config";
import type { ApplicationStatus } from "@/lib/generated/prisma/enums";

export interface HeatmapOutcome extends AdmissionsOutcome {
  id: string;
  year: number | null;
  gpaUnweighted: number | null;
}

const SQUARE_TONE: Record<ApplicationStatus, string> = {
  ACCEPTED: "bg-viz-emerald",
  REJECTED: "bg-viz-rose",
  WAITLISTED: "bg-viz-amber",
};

export function AdmissionsHeatmap({
  outcomes,
  myScore,
  t,
}: {
  outcomes: HeatmapOutcome[];
  myScore: number | null;
  t: Dictionary;
}) {
  const summary = summariseAdmissions(outcomes);

  if (summary.total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Grid2x2 className="size-5" />
        </span>
        <h3 className="mt-4 text-base font-semibold">{t.uni.outcomesEmpty}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t.uni.outcomesEmptyBody}
        </p>
      </div>
    );
  }

  const sorted = sortOutcomes(outcomes);

  return (
    <div className="rounded-2xl bg-card p-6 shadow-card sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold tracking-tight">
            {t.uni.outcomesTitle}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {fill(t.uni.outcomesCount, { count: summary.total })}
            {summary.acceptanceRate !== null &&
              ` · ${fill(t.uni.outcomesAccepted, {
                count: Math.round(summary.acceptanceRate * 100),
              })}`}
          </p>
        </div>

        {summary.hasSample && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-viz-amber-soft px-2.5 py-1.5 text-xs font-medium text-viz-amber">
            <Info className="size-3.5" />
            {summary.allSample ? t.uni.sampleAll : t.uni.sampleSome}
          </span>
        )}
      </div>

      {/* The grid. Sorted by score, so the greens gather where the bar is. */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {sorted.map((outcome) => (
          <span
            key={outcome.id}
            title={outcomeLabel(outcome, t)}
            aria-label={outcomeLabel(outcome, t)}
            className={cn(
              "size-4 rounded-sm",
              SQUARE_TONE[outcome.status],
              // A demonstration square is drawn hollow, so it reads as a
              // placeholder even to somebody who never sees the badge above.
              outcome.isSample && "opacity-40 ring-1 ring-inset ring-foreground/30",
            )}
          />
        ))}
      </div>

      {/* Legend */}
      <ul className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <Legend tone={SQUARE_TONE.ACCEPTED} label={t.uni.accepted} count={summary.accepted} />
        <Legend tone={SQUARE_TONE.WAITLISTED} label={t.uni.waitlisted} count={summary.waitlisted} />
        <Legend tone={SQUARE_TONE.REJECTED} label={t.uni.rejected} count={summary.rejected} />
      </ul>

      {myScore !== null && (
        <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
          {fill(t.uni.outcomesYours, { score: myScore })}
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {t.uni.outcomesDisclaimer}
      </p>
    </div>
  );
}

function Legend({
  tone,
  label,
  count,
}: {
  tone: string;
  label: string;
  count: number;
}) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className={cn("size-3 rounded-sm", tone)} />
      {label}
      <span className="tabular-nums">{count}</span>
    </li>
  );
}

function outcomeLabel(outcome: HeatmapOutcome, t: Dictionary): string {
  const status =
    outcome.status === "ACCEPTED"
      ? t.uni.accepted
      : outcome.status === "REJECTED"
        ? t.uni.rejected
        : t.uni.waitlisted;

  const parts = [status];
  if (outcome.satScore !== null) parts.push(`SAT ${outcome.satScore}`);
  if (outcome.gpaUnweighted !== null) parts.push(`GPA ${outcome.gpaUnweighted}`);
  if (outcome.year !== null) parts.push(String(outcome.year));

  return parts.join(" · ");
}
