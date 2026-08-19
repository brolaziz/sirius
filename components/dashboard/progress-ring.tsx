"use client";

/**
 * Circular progress gauge.
 *
 * Used where a number needs a sense of "how far along" at a glance — progress
 * toward a target score, or a university's acceptance rate — and there is no
 * room for a full-width bar.
 *
 * Two stacked SVG circles rotated a quarter turn so the arc starts at twelve
 * o'clock. GSAP draws the arc by tweening `strokeDashoffset`, one of the few
 * non-transform properties that is cheap to animate: SVG geometry does not
 * trigger page layout.
 *
 * The gauge is decorative — every caller also prints the number — so it is
 * hidden from assistive technology.
 */

import * as React from "react";

import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** 0–100. Values outside the range are clamped. */
  value: number;
  /** Diameter in pixels. */
  size?: number;
  /** Stroke width in pixels. */
  thickness?: number;
  /** Any CSS colour; defaults to the accent. Pass a `--color-viz-*` token. */
  color?: string;
  /** Rendered in the middle of the ring. */
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  size = 64,
  thickness = 6,
  color = "var(--color-primary)",
  children,
  className,
}: ProgressRingProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        ref.current?.querySelector("[data-arc]") ?? null,
        { strokeDashoffset: circumference },
        {
          strokeDashoffset: offset,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 92%",
            once: true,
          },
        },
      );
    },
    { scope: ref, dependencies: [offset, circumference] },
  );

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-muted"
        />
        <circle
          data-arc
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      {children && (
        <span className="absolute inset-0 flex items-center justify-center">
          {children}
        </span>
      )}
    </div>
  );
}
