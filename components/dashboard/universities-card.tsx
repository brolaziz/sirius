"use client";

/**
 * Dream universities — the shortlist, as three stacked rows.
 *
 * Each row is a strip of that university's own gradient (derived from its name,
 * see `coverGradient`) with a frosted plate over it carrying the name. It is the
 * same glass-over-image treatment as the cards in the explorer, compressed to a
 * row of about 64px so three of them fit in a bento tile without becoming a
 * table. Rows grow when a long name needs a second line — see the note below.
 *
 * Sorted by deadline, so the row at the top is the one that matters this week.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, GraduationCap } from "lucide-react";

import { PressableCard } from "@/components/motion/pressable";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { coverGradient, toneForAcceptance, TONES } from "@/lib/viz";
import { cn } from "@/lib/utils";
import type { ShortlistedUniversity } from "@/lib/queries/dashboard";

export function UniversitiesCard({
  universities,
  total,
  className,
}: {
  universities: ShortlistedUniversity[];
  total: number;
  className?: string;
}) {
  const { t } = useT();
  const visible = universities.slice(0, 3);
  const hidden = Math.max(0, total - visible.length);

  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-2xl bg-card p-6 shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">
          {t.dash.universities}
        </h2>
        <Link
          href="/universities"
          className="tap-target inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-brand-700"
        >
          {t.dash.universitiesCta}
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <GraduationCap className="size-5" />
          </span>
          <p className="mt-3 max-w-[24ch] text-sm text-muted-foreground">
            {t.dash.universitiesEmpty}
          </p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-2.5">
          {visible.map((university) => {
            const cover = coverGradient(university.name);
            const tone = toneForAcceptance(university.acceptanceRate);
            const location =
              [university.city, university.country].filter(Boolean).join(", ") ||
              "—";

            return (
              <li key={university.id} className="min-w-0">
                <PressableCard>
                  <Link
                    href="/universities"
                    className="relative flex min-h-16 items-center gap-3 overflow-hidden rounded-xl px-3 py-2"
                    style={{
                      backgroundImage: `linear-gradient(115deg, ${cover.from}, ${cover.to})`,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-dots-light opacity-60"
                    />

                    {/*
                      The frosted plate that makes the name readable on any hue.

                      NO MONOGRAM, AND THE NAME GETS TWO LINES.

                      There used to be a 40px initials chip here. It was derived
                      from the name — `monogram()` took its first two initials —
                      so it carried nothing the name did not, while spending 52px
                      of a 286px row at 320px. What that cost was measurable: the
                      name was left with 92px, about 13 characters, and the audit
                      found "Massachusetts Institute of Technology" rendering as
                      "Massachusetts Ins…". The name is the only thing on this row
                      that says which university it is, so it should not be the
                      element that gives way first.

                      Identity is still per-university: the row's gradient is
                      derived from the name by `coverGradient`.

                      `line-clamp-2` rather than `truncate`, and `min-h-16` rather
                      than `h-16`, so a row grows only when a name needs the
                      second line and short names look exactly as they did.
                    */}
                    <span className="relative min-w-0 flex-1 rounded-lg glass-dark px-3 py-1.5">
                      <span className="line-clamp-2 text-sm leading-tight font-bold text-white">
                        {university.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-white/80">
                        {location}
                      </span>
                    </span>

                    {university.acceptanceRate !== null && (
                      <span
                        className={cn(
                          "relative shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tnum",
                          TONES[tone].badge,
                        )}
                      >
                        {(university.acceptanceRate * 100).toFixed(0)}%
                      </span>
                    )}
                  </Link>
                </PressableCard>
              </li>
            );
          })}
        </ul>
      )}

      {hidden > 0 && (
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          {fill(t.dash.moreUniversities, { count: hidden })}
        </p>
      )}
    </section>
  );
}
