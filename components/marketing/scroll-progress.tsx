"use client";

/**
 * A 2px reading-progress line across the top of the landing page.
 *
 * ScrollTrigger with `scrub: 0.3` drives `scaleX` directly from scroll
 * position, so the line tracks the page instead of easing toward it — but the
 * fractional scrub smooths the jitter of a trackpad. One transform, no React
 * state, nothing recalculated per frame.
 *
 * Purely decorative: it duplicates information the scrollbar already carries,
 * so it is hidden from assistive technology.
 */

import * as React from "react";

import { ScrollTrigger, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

export function ScrollProgress() {
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        ref.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
          },
        },
      );

      /*
       * Fonts land after first paint and change the page height, which would
       * otherwise leave the bar mapped to a document that no longer exists.
       */
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: ref },
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
    >
      <div
        ref={ref}
        className="h-full origin-left bg-primary"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
