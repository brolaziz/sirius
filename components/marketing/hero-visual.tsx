"use client";

/**
 * The product shot in the hero.
 *
 * A faithful-but-simplified mock of the simulator: Bluebook's split screen on
 * the left, the question pane on the right, and the bilingual dictionary open
 * over a highlighted word. It is a static composition — not the live simulator —
 * chosen so the landing page stays fast and needs no test data to render.
 *
 * The floating translation card breathes with a slow, small loop. It is the one
 * looping animation on the page; everything else animates once and settles.
 */

import * as React from "react";
import { Check, Clock, Languages } from "lucide-react";

import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/** A greyed-out line of text, used to suggest prose without rendering it. */
function SkeletonLine({ width }: { width: string }) {
  return (
    <div
      className="h-2.5 rounded-full bg-foreground/[0.07]"
      style={{ width }}
    />
  );
}

const MOCK_OPTIONS = [
  { label: "A", text: "It is easily reversed by natural processes.", selected: false },
  { label: "B", text: "It persists far longer than once assumed.", selected: true },
  { label: "C", text: "It affects only coastal ecosystems.", selected: false },
  { label: "D", text: "It has no measurable effect on marine life.", selected: false },
];

export function HeroVisual() {
  const ref = React.useRef<HTMLDivElement>(null);

  /*
   * The translation card arrives late — after the visitor has had a second to
   * read the passage — and then breathes. It is the only looping animation on
   * the landing page; everything else animates once and settles.
   */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const card = ref.current?.querySelector("[data-float-card]");
      if (!card) return;

      gsap
        .timeline({ delay: 1.3 })
        .from(card, { opacity: 0, y: 10, scale: 0.97, duration: 0.5, ease: EASE })
        .to(card, {
          y: -5,
          duration: 2.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      {/* Ambient glow under the window, for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-x-8 -bottom-8 h-28 rounded-[50%] bg-brand-500/20 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-2xl bg-card shadow-float">
        {/* Simulator top bar */}
        <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-foreground">
              Section 1, Module 1
            </span>
            <span className="hidden rounded-md bg-background px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border sm:inline">
              Reading &amp; Writing
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-xs font-medium tnum ring-1 ring-border">
              <Clock className="size-3.5 text-muted-foreground" />
              28:14
            </span>
            {/* The bilingual toggle, shown in its ON state */}
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200">
              <Languages className="size-3.5" />
              <span className="hidden sm:inline">UZ</span>
              <span className="relative inline-flex h-3 w-5 items-center rounded-full bg-primary">
                <span className="absolute right-0.5 size-2 rounded-full bg-white" />
              </span>
            </span>
          </div>
        </div>

        {/* Split panes */}
        <div className="grid gap-0 sm:grid-cols-2">
          {/* Left: passage */}
          <div className="relative border-b border-border p-5 sm:border-r sm:border-b-0 sm:p-6">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Passage
            </p>

            <div className="mt-4 space-y-3">
              <SkeletonLine width="100%" />
              <SkeletonLine width="94%" />

              {/* The line containing the highlighted dictionary term */}
              <p className="text-sm leading-relaxed text-foreground/80">
                Plastic debris has become{" "}
                <span className="dict-term font-medium text-brand-900">
                  ubiquitous
                </span>{" "}
                in the ocean.
              </p>

              <SkeletonLine width="97%" />
              <SkeletonLine width="88%" />
              <SkeletonLine width="92%" />
              <SkeletonLine width="60%" />
            </div>

            {/* Floating translation card */}
            <div
              data-float-card
              className="absolute right-4 bottom-4 left-4 rounded-xl bg-popover p-3.5 shadow-float sm:left-auto sm:w-64"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">ubiquitous</span>
                <span className="text-[11px] text-muted-foreground">adj.</span>
              </div>
              <p className="mt-1 text-sm font-medium text-primary">
                hamma yerda mavjud
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Bir vaqtning o&apos;zida hamma joyda uchraydigan; juda keng
                tarqalgan.
              </p>
            </div>
          </div>

          {/* Right: question */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-6 items-center justify-center rounded-md bg-foreground text-[11px] font-semibold text-background">
                7
              </span>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Question
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed font-medium">
              Which choice best states the main idea of the passage?
            </p>

            <div className="mt-4 space-y-2">
              {MOCK_OPTIONS.map((option) => (
                <div
                  key={option.label}
                  className={
                    option.selected
                      ? "flex items-start gap-2.5 rounded-lg border border-primary bg-brand-50/70 p-2.5 ring-1 ring-primary/20"
                      : "flex items-start gap-2.5 rounded-lg border border-border p-2.5"
                  }
                >
                  <span
                    className={
                      option.selected
                        ? "mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
                        : "mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-muted-foreground ring-1 ring-border"
                    }
                  >
                    {option.selected ? (
                      <Check className="size-3" />
                    ) : (
                      option.label
                    )}
                  </span>
                  <span className="text-xs leading-relaxed text-foreground/80">
                    {option.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
