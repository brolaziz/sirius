/**
 * The motion language, in GSAP.
 *
 * Everything that moves in Sirius takes its easing and timing from this file,
 * so the whole product moves with one personality instead of each component
 * inventing a curve.
 *
 * Three rules keep it at 60fps and worth watching:
 *   1. Animate `opacity` and `transform` only. Both are composited; animating
 *      width/top/height/box-shadow forces layout every frame.
 *   2. Entrances run 0.9–1.3s over 30–40px. An earlier pass used 0.25–0.6s over
 *      16px and the result was invisible on a fast machine — motion you cannot
 *      register is worse than none, because you pay for it and see nothing.
 *   3. Loops are allowed, but each one has to earn its place: the ticker, the
 *      floating card, the headline gradient. Nothing else repeats.
 *
 * Plugins are registered once, on the client. `useGSAP` is registered too so
 * every animation is scoped to a ref and reverted automatically on unmount —
 * that is what makes GSAP safe with React's strict-mode double effects and with
 * the App Router remounting a page on navigation.
 *
 * All plugins used here ship free with GSAP 3.13+.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

  gsap.defaults({
    ease: "power3.out",
    duration: 0.9,
  });

  /*
   * Anchor ScrollTrigger's measurements to the top of the viewport. Without
   * this, mobile browsers recalculate every trigger when the URL bar hides,
   * which makes reveals fire at visibly different points as you scroll.
   */
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };

/* -------------------------------------------------------------------------- */
/* Timing                                                                     */
/* -------------------------------------------------------------------------- */

/** Decisive out-curve. Things arrive fast and settle softly. */
export const EASE = "power3.out";

/** Gentler version, for large surfaces that would feel snappy if rushed. */
export const EASE_SOFT = "power2.out";

/** A small overshoot. Use on things that appear, never on things that move. */
export const EASE_POP = "back.out(1.7)";

/** Symmetric, for anything that both enters and leaves. */
export const EASE_INOUT = "power2.inOut";

export const DUR = {
  /** Hovers, taps, toggles. Long enough to see, short enough to feel instant. */
  fast: 0.35,
  /** The workhorse entrance. */
  base: 0.9,
  /** Hero pieces and full-width panels. */
  slow: 1.3,
} as const;

/** The cascade step for lists and grids. */
export const STAGGER = 0.11;

/** A tighter cascade for dense lists (navigator tiles, table rows). */
export const STAGGER_TIGHT = 0.05;

/* -------------------------------------------------------------------------- */
/* Shared shapes                                                              */
/* -------------------------------------------------------------------------- */

/** The rise-and-fade every card, section and list item enters with. */
export const RISE_FROM = { opacity: 0, y: 34 } as const;
export const RISE_TO = { opacity: 1, y: 0 } as const;

/**
 * Where a scroll-triggered reveal fires: when the element's top reaches 88% of
 * the viewport height, i.e. just after it appears from the bottom edge.
 */
export const SCROLL_START = "top 88%";

/**
 * Standard ScrollTrigger config for a one-shot reveal.
 *
 * WHAT EVERY CALLER OF THIS OWES IT
 *
 * `invalidateOnRefresh` re-reads a tween's start and end values whenever
 * ScrollTrigger recalculates, so a reveal first measured against a pre-font,
 * pre-`SplitText` layout does not animate to stale coordinates. That is only
 * safe when both ends are *stated*. On a `from()` tween that has already
 * rendered its start values, `invalidate()` re-reads the current DOM as the
 * animation's end state — and before the trigger fires, the current DOM **is**
 * the start state, so the tween would animate to `opacity: 0` and stay there.
 *
 * So the flag lives here, and the contract it assumes is:
 *
 *   pair this with `gsap.fromTo()` and `immediateRender: false`, never
 *   `gsap.from()`.
 *
 * That is not a style preference. A tween gated behind a scroll trigger must
 * not write its start values before the trigger fires, because a trigger that
 * never fires then leaves the content permanently invisible — which is exactly
 * what shipped on the landing page. The settled state is what the DOM must show
 * when the tween never runs; the animation is the conditional part. See the long
 * note in `components/marketing/journey-section.tsx`.
 */
export function revealTrigger(trigger: Element | null) {
  return {
    trigger: trigger ?? undefined,
    start: SCROLL_START,
    once: true,
    invalidateOnRefresh: true,
  } as const;
}

/* -------------------------------------------------------------------------- */
/* Preferences                                                                */
/* -------------------------------------------------------------------------- */

/**
 * True when this visit should not animate.
 *
 * The app's own setting wins over the OS: `data-motion` on <html> is written
 * before first paint by the inline script in `MotionProvider`, and holds
 * "full", "reduced" or "system". Only "system" defers to the media query.
 *
 * Read this and skip the animation entirely rather than shortening it — a fast
 * slide is still a slide, and the point is to not move.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;

  const preference = document.documentElement.dataset.motion;
  if (preference === "full") return false;
  if (preference === "reduced") return true;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
