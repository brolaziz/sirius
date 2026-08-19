"use client";

/**
 * Count-up number.
 *
 * GSAP tweens a plain object and writes the formatted result straight to the
 * DOM node, so the count costs zero React re-renders — one commit, then
 * imperative text updates.
 *
 * It starts when the number scrolls into view rather than on mount: a metric
 * that finished counting before you looked at it might as well have been
 * static.
 *
 * The final value is server-rendered, so the number is correct in the HTML, in
 * a screenshot, and for anyone who prefers reduced motion.
 */

import * as React from "react";

import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

interface AnimatedNumberProps {
  value: number;
  /** Seconds. */
  duration?: number;
  /** Decimal places to show. */
  decimals?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1.2,
  decimals = 0,
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const ref = React.useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const node = ref.current;
      if (!node || prefersReducedMotion()) return;

      const counter = { value: 0 };

      /*
       * Zero the node now, not when the tween fires. The server rendered the
       * final value (correct for no-JS and for screenshots), so without this
       * the number would sit at its final figure until it scrolled into range
       * and then visibly snap back to zero to start counting.
       */
      node.textContent = `${(0).toFixed(decimals)}${suffix}`;

      gsap.to(counter, {
        value,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          node.textContent = `${counter.value.toFixed(decimals)}${suffix}`;
        },
        scrollTrigger: {
          trigger: node,
          start: "top 92%",
          once: true,
        },
      });
    },
    { scope: ref, dependencies: [value, duration, decimals, suffix] },
  );

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
