/**
 * The full-mock entry point, and what to show when the bank cannot fill one.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THE SHORTFALL IS THE LOUD STATE, NOT A FOOTNOTE
 *
 * The bank holds 40 usable questions and a sitting needs 98. The tempting
 * behaviour is to start a mock anyway with whatever exists — the student gets
 * something, nothing looks broken, and the number at the end is a number.
 *
 * That number is the problem. A score from a 40-question sitting is not a
 * Digital SAT score, and a student who takes one learns two false things: what
 * a mock feels like, and where they stand. So when the bank is short this
 * panel says exactly how short, module by module, and does not offer to start.
 *
 * The blueprint above it is correct regardless — 98 questions, 134 minutes of
 * testing, a 10-minute break — so filling the bank turns this on without any
 * of it being rewritten.
 */

import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fill } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/config";
import {
  BREAK_MINUTES,
  MOCK_TESTING_MINUTES,
  MOCK_TOTAL_QUESTIONS,
  type MockAvailability,
} from "@/lib/mock";

export function MockPanel({
  availability,
  mockTestId,
  t,
}: {
  availability: MockAvailability;
  /** The container test a sitting is recorded against; null when none exists. */
  mockTestId: string | null;
  t: Dictionary;
}) {
  const ready = availability.complete && mockTestId !== null;

  return (
    <section className="overflow-hidden rounded-3xl bg-midnight text-white shadow-card">
      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <span className="absolute -top-20 -right-16 size-72 rounded-full bg-brand-400/25 blur-[90px]" />
          <span className="absolute -bottom-24 -left-16 size-72 rounded-full bg-magenta/20 blur-[90px]" />
        </div>

        <div className="relative">
          <h2 className="text-2xl font-extrabold tracking-tightest text-balance sm:text-3xl">
            {t.practice.mockTitle}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            {t.practice.mockBody}
          </p>

          {/* The blueprint, stated whether or not it can be filled today. */}
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 tnum">
            <Clock className="size-3.5" />
            {fill(t.practice.mockShape, {
              questions: MOCK_TOTAL_QUESTIONS,
              minutes: MOCK_TESTING_MINUTES,
              breakMinutes: BREAK_MINUTES,
            })}
          </p>

          {ready ? (
            <Button
              asChild
              size="lg"
              className="group mt-7 h-12 rounded-xl px-6 shadow-glow"
            >
              <Link href={`/simulator/${mockTestId}`}>
                <Play className="size-4" />
                {t.practice.mockStart}
                <ArrowRight className="ml-0.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          ) : (
            <div className="mt-7 rounded-2xl border border-white/15 bg-white/[0.06] p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4 shrink-0 text-amber-300" />
                {t.practice.mockShortTitle}
              </p>

              <p className="mt-2 text-sm leading-relaxed text-white/75">
                {fill(t.practice.mockShortBody, {
                  available: availability.availableTotal,
                  needed: availability.neededTotal,
                  short: availability.shortTotal,
                })}
              </p>

              {/* Module by module, so "what is missing" is a fact and not a mood. */}
              <ul className="mt-4 space-y-1.5">
                {availability.modules.map((module) => (
                  <li
                    key={`${module.section}-${module.module}`}
                    className="flex items-center justify-between gap-4 text-xs"
                  >
                    <span className="min-w-0 text-white/70">
                      {fill(t.practice.mockModuleRow, {
                        section:
                          module.section === "READING"
                            ? t.practice.sectionReading
                            : t.practice.sectionMath,
                        module: module.module === "MODULE_1" ? 1 : 2,
                      })}
                    </span>
                    <span
                      className={
                        module.short === 0
                          ? "shrink-0 font-semibold text-lime tnum"
                          : "shrink-0 font-semibold text-amber-300 tnum"
                      }
                    >
                      {fill(t.practice.mockModuleCount, {
                        available: Math.min(module.available, module.needed),
                        needed: module.needed,
                      })}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs leading-relaxed text-white/60">
                {t.practice.mockShortMeanwhile}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
