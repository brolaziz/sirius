"use client";

/**
 * Landing hero.
 *
 * One GSAP timeline runs the whole opening, which is what makes it read as a
 * single authored moment rather than five components that each happen to fade
 * in. The order is the order the eye should travel:
 *
 *   0.0s  four coloured shapes scale up behind the headline
 *   0.2s  the badge
 *   0.3s  the headline, word by word, out of a clipping mask
 *   0.9s  the sub-headline, word by word via SplitText
 *   1.2s  the buttons, then the small print
 *   1.3s  the product shot rises in
 *
 * After the load sequence, three things keep moving: the headline's gradient
 * slides forever (CSS), the shapes drift on scroll (ScrollTrigger scrub), and
 * the primary button leans toward the pointer (MagneticButton).
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WordReveal } from "@/components/motion/word-reveal";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { MagneticButton, Pressable } from "@/components/motion/pressable";
import { useT } from "@/components/i18n/lang-provider";
import {
  DUR,
  EASE,
  EASE_POP,
  SplitText,
  gsap,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/gsap";

/**
 * The four shapes behind the headline, one per spectrum hue.
 *
 * Blurred, low-opacity and huge: at this size they read as coloured light
 * rather than as circles, which is what keeps a white page from looking empty
 * without putting a picture on it.
 */
const SHAPES = [
  { className: "bg-magenta", style: { top: "-6%", left: "4%", width: 340, height: 340 }, depth: 90 },
  { className: "bg-cyan", style: { top: "12%", right: "2%", width: 300, height: 300 }, depth: -120 },
  { className: "bg-lime", style: { top: "48%", left: "-4%", width: 260, height: 260 }, depth: 140 },
  { className: "bg-brand-400", style: { top: "36%", right: "12%", width: 220, height: 220 }, depth: -70 },
];

export function Hero() {
  const { t } = useT();
  const ref = React.useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const root = ref.current;
      if (!root) return;

      /*
       * SplitText is safe on the sub-headline because it is plain text with no
       * markup to preserve. (The headline keeps its own hand-built spans — the
       * highlighted words have to carry their class in the server HTML.)
       */
      const sub = root.querySelector<HTMLElement>("[data-hero-sub]");
      const split = sub ? SplitText.create(sub, { type: "words" }) : null;

      const timeline = gsap.timeline();

      timeline
        .from("[data-hero-shape]", {
          scale: 0,
          opacity: 0,
          duration: 1.4,
          ease: EASE_POP,
          stagger: 0.12,
        })
        .from(
          "[data-hero-badge]",
          { opacity: 0, y: 16, duration: DUR.base, ease: EASE },
          0.2,
        )
        .from(
          split ? split.words : "[data-hero-sub]",
          { opacity: 0, y: 18, duration: 0.7, ease: EASE, stagger: 0.018 },
          0.9,
        )
        .from(
          "[data-hero-cta]",
          { opacity: 0, y: 22, duration: DUR.base, ease: EASE, stagger: 0.12 },
          1.2,
        )
        .from(
          "[data-hero-note]",
          { opacity: 0, duration: DUR.base, ease: EASE },
          1.45,
        )
        .from(
          "[data-hero-visual]",
          { opacity: 0, y: 70, scale: 0.97, duration: DUR.slow, ease: EASE },
          1.3,
        );

      /*
       * Parallax. Each shape moves a different distance as the page scrolls,
       * which is the whole trick: identical speeds read as one flat layer.
       */
      gsap.utils
        .toArray<HTMLElement>(root.querySelectorAll("[data-hero-shape]"))
        .forEach((shape) => {
          gsap.to(shape, {
            y: Number(shape.dataset.depth ?? 0),
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        });

      return () => {
        // SplitText rewrites the DOM; revert puts the original text back.
        split?.revert();
      };
    },
    { scope: ref, dependencies: [t.hero.headline] },
  );

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {SHAPES.map((shape, index) => (
          <span
            key={index}
            data-hero-shape
            data-depth={shape.depth}
            style={shape.style}
            className={`absolute rounded-full opacity-25 blur-[90px] ${shape.className}`}
          />
        ))}

        <div className="absolute inset-0 bg-dots [mask-image:linear-gradient(to_bottom,black,transparent_62%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div data-hero-badge>
            <span className="sticker bg-lime text-midnight">
              <Sparkles className="size-3.5" />
              {t.hero.badge}
            </span>
          </div>

          <WordReveal
            as="h1"
            text={t.hero.headline}
            highlight={t.hero.highlight}
            delay={0.3}
            className="mt-7 text-4xl leading-[1.05] font-extrabold tracking-tightest text-balance sm:text-5xl lg:text-6xl"
          />

          <p
            data-hero-sub
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty"
          >
            {t.hero.body}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div data-hero-cta className="w-full sm:w-auto">
              <MagneticButton className="w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="group h-12 w-full rounded-lg px-7 text-base font-semibold shadow-glow sm:w-auto"
                >
                  <Link href="/sign-up">
                    {t.hero.ctaPrimary}
                    <ArrowRight className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </MagneticButton>
            </div>

            <div data-hero-cta className="w-full sm:w-auto">
              <Pressable className="w-full sm:w-auto">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 w-full rounded-lg bg-card px-7 text-base font-semibold sm:w-auto"
                >
                  <Link href="/sign-in">{t.hero.ctaSecondary}</Link>
                </Button>
              </Pressable>
            </div>
          </div>

          <p data-hero-note className="mt-5 text-sm text-muted-foreground">
            {t.hero.note}
          </p>
        </div>

        <div data-hero-visual className="mt-16 sm:mt-20">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
