"use client";

/**
 * Dream universities — the shortlist, as three stacked rows.
 *
 * Each row is a strip of that university's own gradient (derived from its name,
 * see `coverGradient`) with a frosted plate over it carrying the name. It is the
 * same glass-over-image treatment as the cards in the explorer, compressed to a
 * 64px row so three of them fit in a bento tile without becoming a table.
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

/** Up to two initials, skipping the small words in a name. */
function monogram(name: string): string {
  const skip = new Set(["of", "the", "and", "at", "for", "de", "du"]);
  return name
    .split(/\s+/)
    .filter((word) => word.length > 0 && !skip.has(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

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
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-brand-700"
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
              <li key={university.id}>
                <PressableCard>
                  <Link
                    href="/universities"
                    className="relative flex h-16 items-center gap-3 overflow-hidden rounded-xl px-3"
                    style={{
                      backgroundImage: `linear-gradient(115deg, ${cover.from}, ${cover.to})`,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-dots-light opacity-60"
                    />

                    <span className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg glass-dark text-sm font-extrabold text-white">
                      {monogram(university.name)}
                    </span>

                    {/* The frosted plate that makes the name readable on any hue. */}
                    <span className="relative min-w-0 flex-1 rounded-lg glass-dark px-3 py-1.5">
                      <span className="block truncate text-sm font-bold text-white">
                        {university.name}
                      </span>
                      <span className="block truncate text-[11px] text-white/80">
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
