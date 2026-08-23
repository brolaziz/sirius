"use client";

/**
 * The six pillars of the platform: universities, essays, extracurriculars,
 * portfolio, deadlines, and the SAT toolkit.
 *
 * Six rather than three on purpose. Sirius is an admissions platform, and a
 * three-card grid with the SAT in it reads as a test-prep site with extras —
 * the count itself is the argument that the application is the product.
 *
 * Each card owns one hue from the spectrum, so the pillars are told apart by
 * colour before they are read. The hue appears three times per card: the icon
 * chip, the bullet dots, and the glow the card picks up on hover. Text stays in
 * ink; a card that turns fully magenta is a poster, not an interface.
 *
 * Entrance is a scroll-triggered cascade with a slight rotation, so the cards
 * deal in like cards rather than sliding in like drawers.
 */

import * as React from "react";
import {
  CalendarCheck,
  FolderOpen,
  GraduationCap,
  Languages,
  PenLine,
  Trophy,
  type LucideIcon,
} from "lucide-react";

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

/** One icon per pillar, in dictionary order. */
const ICONS: LucideIcon[] = [
  GraduationCap,
  PenLine,
  Trophy,
  FolderOpen,
  CalendarCheck,
  Languages,
];

/**
 * The resting tilt of every feature card, in degrees.
 *
 * All six get the same angle rather than alternating — the cards read as one
 * stack of paper set down slightly askew, not as a zigzag.
 *
 * This is design, and it lives in the markup as an inline `rotate` so it
 * survives with JavaScript disabled: the entrance animation ends here rather
 * than establishing it. The constant is the single source — the style below and
 * the tween's end value both read it, so they cannot drift apart.
 */
const CARD_TILT = -2;

const TONES = [
  {
    chip: "bg-magenta text-white",
    dot: "bg-magenta",
    glow: "group-hover:glow-magenta",
  },
  {
    chip: "bg-cyan text-midnight",
    dot: "bg-cyan-ink",
    glow: "group-hover:glow-cyan",
  },
  {
    chip: "bg-lime text-midnight",
    dot: "bg-lime-ink",
    glow: "group-hover:glow-lime",
  },
  {
    chip: "bg-midnight text-lime",
    dot: "bg-midnight",
    glow: "group-hover:glow-brand",
  },
  {
    chip: "bg-brand-500 text-white",
    dot: "bg-brand-500",
    glow: "group-hover:glow-brand",
  },
  {
    chip: "bg-magenta-soft text-magenta-ink",
    dot: "bg-magenta-ink",
    glow: "group-hover:glow-magenta",
  },
];

export function FeatureGrid() {
  const { t } = useT();
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      /*
       * `fromTo` with `immediateRender: false` rather than `from` — the cards
       * must be on screen when the tween never runs. See the long note in
       * `journey-section.tsx` for why `from` made the start state the resting
       * state, and why `fromTo` alone does not fix it.
       *
       * The tween ends at `CARD_TILT`, not at zero. An earlier version ended at
       * a literal 0 and flattened the cards, because it assumed the settled
       * state had no rotation. The end value and the markup now read the same
       * constant, which is the `progress-ring.tsx` pattern: the animation
       * finishes where the CSS already is, rather than at a number someone
       * guessed.
       */
      gsap.fromTo(
        ref.current?.querySelectorAll("[data-feature-card]") ?? [],
        { opacity: 0, y: 60, rotate: CARD_TILT - 2 },
        {
          opacity: 1,
          y: 0,
          rotate: CARD_TILT,
          duration: DUR.slow,
          ease: EASE,
          stagger: STAGGER,
          immediateRender: false,
          scrollTrigger: revealTrigger(ref.current),
        },
      );
    },
    { scope: ref, dependencies: [t.features.heading] },
  );

  return (
    <section
      id="features"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8 lg:py-section"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl leading-[1.05] font-extrabold tracking-tightest text-balance sm:text-5xl">
          {t.features.heading}
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
          {t.features.body}
        </p>
      </Reveal>

      <div ref={ref} className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {t.features.items.map((feature, index) => {
          const Icon = ICONS[index] ?? GraduationCap;
          const tone = TONES[index % TONES.length];

          return (
            <article
              key={feature.title}
              data-feature-card
              style={{ rotate: `${CARD_TILT}deg` }}
              className={cn(
                "group h-full rounded-2xl bg-card p-7 shadow-soft transition-[box-shadow,transform] duration-300 hover:-translate-y-1.5",
                tone.glow,
              )}
            >
              <span
                className={cn(
                  "inline-flex size-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6",
                  tone.chip,
                )}
              >
                <Icon className="size-5" />
              </span>

              <h3 className="mt-6 text-xl font-bold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
                {feature.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-center gap-2.5 text-sm text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-2 shrink-0 rounded-full", tone.dot)}
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
