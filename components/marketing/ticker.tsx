"use client";

/**
 * The ticker strip.
 *
 * A single line of the things Sirius actually does, sliding past forever. It
 * sits between the hero and the feature grid to break the vertical rhythm of
 * stacked sections — and because a landing page that never moves once you stop
 * scrolling feels like a PDF.
 *
 * The loop is seamless because the list is rendered twice and the track is
 * animated exactly -50%: at the end of the tween the second copy sits precisely
 * where the first one started, so the jump back is invisible. `ease: "none"` is
 * what keeps a marquee from looking like it is breathing.
 *
 * It slows to a stop under the pointer, so anything you want to read is
 * readable. With reduced motion it does not move at all and the strip simply
 * scrolls horizontally like any overflowing row.
 *
 * The whole thing is decorative — every item repeats a claim made elsewhere in
 * real text — so it is hidden from screen readers rather than read out twice.
 */

import * as React from "react";

import { SiriusStar } from "@/components/brand/logo";
import { useT } from "@/components/i18n/lang-provider";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * The four chip skins, cycled by index.
 *
 * Every item gets a different hue so the strip reads as a spectrum in motion
 * rather than a blue banner. Text sits on the pure hue in midnight ink, which
 * is the only way pure cyan and lime are legible.
 */
const CHIP_TONES = [
  "bg-magenta text-white",
  "bg-cyan text-midnight",
  "bg-lime text-midnight",
  "bg-midnight text-white",
];

export function Ticker() {
  const { t } = useT();
  const items = t.ticker.items;
  const ref = React.useRef<HTMLDivElement>(null);
  const tween = React.useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      tween.current = gsap.to("[data-ticker-track]", {
        xPercent: -50,
        duration: 34,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: ref, dependencies: [items] },
  );

  const slow = () => tween.current && gsap.to(tween.current, { timeScale: 0.15, duration: 0.4 });
  const resume = () => tween.current && gsap.to(tween.current, { timeScale: 1, duration: 0.6 });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="overflow-hidden border-y border-border bg-white py-4"
      onPointerEnter={slow}
      onPointerLeave={resume}
    >
      <div data-ticker-track className="flex w-max items-center gap-4 px-4">
        {/* Rendered twice — see the note above about the seamless wrap. */}
        {[...items, ...items].map((item, index) => (
          <span key={index} className="flex shrink-0 items-center gap-4">
            <span
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap",
                CHIP_TONES[index % CHIP_TONES.length],
              )}
            >
              {item}
            </span>
            <SiriusStar className="size-3 shrink-0 text-midnight/30" />
          </span>
        ))}
      </div>
    </div>
  );
}
