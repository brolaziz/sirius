"use client";

/**
 * "From year eleven to the acceptance letter" — the admissions journey.
 *
 * Two columns: the argument and the four numbers that define the process on the
 * left, the four stages as a numbered timeline on the right. The numbering is
 * load-bearing here rather than decorative — an application genuinely is a
 * sequence, and the whole pitch is that Sirius knows which step you are on.
 *
 * The stages slide in from the right on scroll, one after another, so the
 * timeline assembles in the order you would walk it.
 */

import * as React from "react";

import { Reveal } from "@/components/motion/reveal";
import { useT } from "@/components/i18n/lang-provider";
import {
  DUR,
  EASE,
  STAGGER,
  gsap,
  prefersReducedMotion,
  revealTrigger,
  useGSAP,
} from "@/lib/gsap";
import { cn } from "@/lib/utils";

/** One hue per stage, walking the spectrum down the timeline. */
const STAGE_TONES = [
  "bg-magenta text-white",
  "bg-cyan text-midnight",
  "bg-lime text-midnight",
  "bg-midnight text-lime",
];

const STAT_TONES = [
  "text-magenta-ink",
  "text-cyan-ink",
  "text-lime-ink",
  "text-midnight",
];

/**
 * The viewport width at which the page margin can absorb the stages' 48px
 * slide-in: the content column is `max-w-6xl` (1152px), so 1152 + 2 × 48.
 */
const SLIDE_FITS_MIN = 1248;
const SLIDE_FITS = `(min-width: ${SLIDE_FITS_MIN}px)`;

/**
 * The stage timeline: the cards slide in one after another, and the rule that
 * connects them draws itself downward.
 *
 * `distance` is the only thing that varies by viewport — see the note in the
 * component.
 *
 * WHY `fromTo` + `immediateRender: false` AND NOT `from`
 *
 * A `from()` tween writes its start values the moment it is built and holds
 * them until its ScrollTrigger fires. That made the *resting* state of this
 * section `opacity: 0` and `x: distance` — so the layout was only correct if an
 * animation ran, and any reason for the trigger not to fire left the stages
 * permanently invisible and shifted right. That is what shipped, and it is what
 * the owner saw on a real phone.
 *
 * `fromTo` alone does not fix it: GSAP renders `from()` *and* `fromTo()`
 * immediately unless told otherwise (ScrollTrigger.js: "any from() or fromTo()
 * tweens should render immediately (well, unless they have immediateRender:
 * false)"). `immediateRender: false` is the part that matters. The settled
 * state is now the default, the offset is applied only when the tween actually
 * starts, and a trigger that never fires costs an animation rather than the
 * page.
 *
 * `invalidateOnRefresh` re-reads the start and end values whenever ScrollTrigger
 * recalculates, so a reveal that was measured against a pre-font, pre-SplitText
 * layout does not animate to stale coordinates. It is safe *here* because both
 * ends are explicit; it is applied per-trigger rather than in `revealTrigger`
 * for that reason — see the note there.
 */
function buildTimeline(root: HTMLDivElement | null, distance: number) {
  gsap.fromTo(
    root?.querySelectorAll("[data-stage]") ?? [],
    { opacity: 0, x: distance },
    {
      opacity: 1,
      x: 0,
      duration: DUR.base,
      ease: EASE,
      stagger: STAGGER,
      immediateRender: false,
      scrollTrigger: { ...revealTrigger(root), invalidateOnRefresh: true },
    },
  );

  gsap.fromTo(
    root?.querySelector("[data-stage-rail]") ?? null,
    { scaleY: 0 },
    {
      scaleY: 1,
      transformOrigin: "top center",
      duration: DUR.slow,
      ease: EASE,
      immediateRender: false,
      scrollTrigger: { ...revealTrigger(root), invalidateOnRefresh: true },
    },
  );
}

export function JourneySection() {
  const { t } = useT();
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      /*
       * WHY THE SLIDE-IN DISTANCE IS A MEDIA QUERY
       *
       * The stages animate *from* 48px to the right, which means 48px to the
       * right is where they sit until their ScrollTrigger fires. On a wide
       * screen that overhang lands in the page margin and nobody sees it. On a
       * phone there is no margin to land in: the column is the viewport minus
       * 16px of padding, so the resting state pushed the document 32px wide and
       * the whole landing page scrolled sideways.
       *
       * The offset is the bug, not the animation — so it is sized to the space
       * that actually exists rather than removed. `SLIDE_FITS` is the width at
       * which the margin can absorb the full 48px: the content column is
       * `max-w-6xl` (1152px), so 1152 + 2 × 48 = 1248. At or above that, the
       * animation is exactly what it has always been; below it, the offset
       * drops to 16px, which is the narrowest gutter the layout ever has
       * (`px-4`) and therefore never overflows at any width.
       *
       * `gsap.matchMedia` rather than reading `window.matchMedia` once: it
       * re-runs the animation for the new breakpoint if the window crosses it,
       * and reverts itself with the surrounding `useGSAP` scope.
       */
      const media = gsap.matchMedia();

      media.add(SLIDE_FITS, () => {
        buildTimeline(ref.current, 48);
      });

      media.add(`(max-width: ${SLIDE_FITS_MIN - 0.02}px)`, () => {
        buildTimeline(ref.current, 16);
      });
    },
    { scope: ref, dependencies: [t.journey.heading] },
  );

  return (
    <section
      id="journey"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8 lg:py-section"
    >
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="sticker bg-midnight text-lime">
            {t.journey.badge}
          </span>

          <h2 className="mt-6 text-4xl leading-[1.05] font-extrabold tracking-tightest text-balance sm:text-5xl">
            {t.journey.heading}
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
            {t.journey.body}
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7">
            {t.journey.stats.map((stat, index) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span
                    className={cn(
                      "block text-3xl font-extrabold tracking-tightest tnum",
                      STAT_TONES[index % STAT_TONES.length],
                    )}
                  >
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div ref={ref} className="relative">
          {/* The spine the stages hang off. Sits behind the numbered chips. */}
          <span
            data-stage-rail
            aria-hidden="true"
            className="absolute top-6 bottom-6 left-[22px] w-px bg-border"
          />

          <ol className="relative grid gap-4">
            {t.journey.steps.map((step, index) => (
              <li
                key={step.title}
                data-stage
                className="flex gap-4 rounded-2xl bg-card p-5 shadow-soft transition-[box-shadow,transform] duration-300 hover:translate-x-1.5 hover:shadow-lift"
              >
                <span
                  className={cn(
                    "inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-extrabold tnum",
                    STAGE_TONES[index % STAGE_TONES.length],
                  )}
                >
                  {index + 1}
                </span>

                <div className="min-w-0">
                  <h3 className="text-base font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
