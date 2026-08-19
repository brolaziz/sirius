"use client";

/**
 * Headline reveal.
 *
 * Each word sits in a clipping mask and slides up from below, left to right;
 * once the line has landed, a highlighter stroke sweeps across the emphasised
 * words. It is the effect that makes a hero feel authored rather than styled,
 * and it is cheap — only `transform` and one registered custom property
 * animate.
 *
 * The word spans are built in JSX rather than by SplitText, on purpose: the
 * emphasised words must carry the `marker` class in the server-rendered HTML so
 * the highlight is there for a visitor with JavaScript off or reduced motion
 * on. SplitText is used elsewhere (the hero's sub-headline) where there is no
 * markup to preserve.
 *
 * Accessibility: the whole string is exposed through `aria-label` and the
 * decorative spans are hidden, so a screen reader hears one sentence rather
 * than a list of words.
 */

import * as React from "react";

import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface WordRevealProps {
  /** The line to reveal. Split on whitespace. */
  text: string;
  className?: string;
  /** Seconds to wait before the first word moves. */
  delay?: number;
  /** Render as a different element — headlines should stay semantic. */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /**
   * Words to strike through with the highlighter, matched case-insensitively
   * and ignoring punctuation.
   */
  highlight?: string[];
  /** Highlighter colour. `mint` is the second emphasis in a headline. */
  highlightTone?: "brand" | "mint";
}

export function WordReveal({
  text,
  className,
  delay = 0,
  as: Tag = "h1",
  highlight = [],
  highlightTone = "brand",
}: WordRevealProps) {
  const ref = React.useRef<HTMLElement>(null);

  const words = React.useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  const highlightSet = React.useMemo(
    () => new Set(highlight.map((word) => word.toLowerCase())),
    [highlight],
  );

  const isHighlighted = (word: string) =>
    highlightSet.has(word.toLowerCase().replace(/[^a-z']/gi, ""));

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const root = ref.current;
      if (!root) return;

      const wordEls = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll("[data-word]"),
      );
      const markerEls = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll("[data-marker]"),
      );

      const timeline = gsap.timeline({ delay });

      timeline.from(wordEls, {
        yPercent: 118,
        duration: 0.85,
        ease: "power4.out",
        stagger: 0.05,
      });

      if (markerEls.length > 0) {
        timeline.fromTo(
          markerEls,
          { "--marker-scale": 0 },
          {
            "--marker-scale": 1,
            duration: 0.55,
            ease: EASE,
            stagger: 0.12,
          },
          "-=0.35",
        );
      }
    },
    { scope: ref, dependencies: [text, delay] },
  );

  return (
    <Tag
      // A single ref type covers every element this can render as.
      ref={ref as React.Ref<never>}
      className={className}
      aria-label={text}
    >
      <span aria-hidden="true">
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            /*
             * `overflow-hidden` is the mask the word slides out of. The span
             * must be inline-flex for the clip to apply, and the bottom padding
             * leaves room for descenders (g, y, p) so they are not shaved off.
             */
            className="inline-flex overflow-hidden pb-[0.12em] align-bottom"
          >
            <span
              data-word
              className={cn(
                "inline-block",
                isHighlighted(word) &&
                  (highlightTone === "mint" ? "marker-mint" : "marker"),
              )}
              {...(isHighlighted(word) ? { "data-marker": true } : {})}
            >
              {word}
            </span>
            {index < words.length - 1 ? (
              <span className="inline-block">&nbsp;</span>
            ) : null}
          </span>
        ))}
      </span>
    </Tag>
  );
}
