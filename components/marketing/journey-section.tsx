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

export function JourneySection() {
  const { t } = useT();
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.from(ref.current?.querySelectorAll("[data-stage]") ?? [], {
        opacity: 0,
        x: 48,
        duration: DUR.base,
        ease: EASE,
        stagger: STAGGER,
        scrollTrigger: revealTrigger(ref.current),
      });

      // The rule that connects the stages draws itself downward.
      gsap.from(ref.current?.querySelector("[data-stage-rail]") ?? null, {
        scaleY: 0,
        transformOrigin: "top center",
        duration: DUR.slow,
        ease: EASE,
        scrollTrigger: revealTrigger(ref.current),
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
