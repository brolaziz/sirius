"use client";

/**
 * Application readiness — the dashboard's anchor tile.
 *
 * Sirius is an admissions platform, so the number that leads the page is not a
 * test score: it is how much of the application actually exists. Five stages,
 * each computed from real rows the student has (or has not) created — nothing
 * here is a placeholder or a guess.
 *
 * The ring is the headline and the list is the explanation, which is the only
 * arrangement that makes a percentage useful: "62%" alone invites the question
 * "of what?", and the answer has to be one glance away.
 *
 * Every step is a link, because a checklist that tells you what is missing and
 * then makes you go find it is just a scoreboard.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export interface ReadinessStep {
  id: "target" | "test" | "shortlist" | "words" | "roadmap";
  done: boolean;
  href: string;
}

export function ReadinessCard({
  steps,
  className,
}: {
  steps: ReadinessStep[];
  className?: string;
}) {
  const { t } = useT();

  const done = steps.filter((step) => step.done).length;
  const percent = steps.length > 0 ? (done / steps.length) * 100 : 0;

  /*
   * The ring turns from magenta to lime as the profile fills up. Colour is
   * carrying the same information as the number, on purpose: this tile is
   * scanned, not read.
   */
  const tone =
    percent >= 80
      ? "var(--color-lime-ink)"
      : percent >= 40
        ? "var(--color-brand-500)"
        : "var(--color-magenta-ink)";

  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-2xl bg-card p-6 shadow-card sm:p-8",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight">{t.dash.readiness}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {fill(t.dash.readinessHint, { done, total: steps.length })}
          </p>
        </div>

        <ProgressRing value={percent} size={92} thickness={9} color={tone}>
          <span
            className="text-xl font-extrabold tracking-tightest tnum"
            style={{ color: tone }}
          >
            <AnimatedNumber value={Math.round(percent)} suffix="%" />
          </span>
        </ProgressRing>
      </div>

      <ul className="mt-7 grid gap-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "group flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors duration-200",
                step.done ? "bg-lime-soft/60" : "hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
                  step.done
                    ? "bg-lime-ink text-white"
                    : "border-2 border-dashed border-border",
                )}
              >
                {step.done && <Check className="size-3.5" strokeWidth={3} />}
              </span>

              <span
                className={cn(
                  "min-w-0 flex-1 text-sm",
                  step.done
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {t.dash.readinessSteps[step.id]}
              </span>

              {!step.done && (
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
