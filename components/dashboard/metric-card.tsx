"use client";

/**
 * A single metric tile in the bento grid.
 *
 * Shows a value with a count-up, a label, an optional coloured badge carrying
 * the *judgement* of the number (on track, short of target, …) and either a
 * progress bar or a circular gauge.
 *
 * When `value` is null the tile renders an honest empty state instead of a
 * zero — "no score yet" is information; "0" is a lie.
 *
 * ABOUT THE HOVER
 * Pass `href` and the tile becomes a link: it scales, lifts and deepens its
 * shadow, because it now goes somewhere. Without `href` it stays still. Making
 * a static tile scale would teach the hand that everything on this page is
 * clickable, and then the one tile that really is clickable stops standing out.
 * Every metric here has a natural destination, so in practice they all pass one.
 */

import * as React from "react";
import Link from "next/link";

import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { PressableCard } from "@/components/motion/pressable";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TONES, type Tone } from "@/lib/viz";

interface MetricCardProps {
  /**
   * The icon as a rendered **element** (`<Trophy />`), not a component
   * reference (`Trophy`).
   *
   * This card is a Client Component and the dashboard that renders it is a
   * Server Component. Function props cannot cross that boundary — passing the
   * component itself fails the build with "Functions cannot be passed directly
   * to Client Components". Elements serialise fine. Sizing is applied by the
   * wrapper below, so call sites pass a bare icon.
   */
  icon: React.ReactNode;
  label: string;
  /** Null renders `emptyText` instead of a number. */
  value: number | null;
  emptyText?: string;
  suffix?: string;
  decimals?: number;
  /** Small caption under the value. */
  hint?: string;
  /** 0–100. Renders a progress bar when provided. */
  progress?: number;
  /** 0–100. Renders a circular gauge in place of the icon chip. */
  gauge?: number;
  /** Colours the icon chip and the gauge. */
  tone?: Tone;
  /** A short verdict on the number — "180 to target", "on track". */
  badge?: { label: string; tone: Tone };
  /** Where the tile goes when clicked. Omit for a static tile. */
  href?: string;
  className?: string;
}

export function MetricCard({
  icon,
  label,
  value,
  emptyText = "—",
  suffix = "",
  decimals = 0,
  hint,
  progress,
  gauge,
  tone = "brand",
  badge,
  href,
  className,
}: MetricCardProps) {
  const toneClasses = TONES[tone];

  /*
   * `className` is applied by the caller to the outermost element only — which
   * is the link wrapper when there is an href, and this div otherwise. Putting
   * it on both would apply grid spans twice and break the bento layout.
   */
  const body = (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-2xl bg-card p-6 shadow-card transition-shadow duration-300",
        href ? "hover:shadow-card-hover" : className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>

        {typeof gauge === "number" && value !== null ? (
          <ProgressRing
            value={gauge}
            size={48}
            thickness={5}
            color={toneClasses.cssVar}
          >
            <span className={cn("[&_svg]:size-4", toneClasses.text)}>
              {icon}
            </span>
          </ProgressRing>
        ) : (
          <span
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5",
              toneClasses.chip,
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="mt-9">
        {value === null ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <p className="text-[2.75rem] leading-none font-extrabold tracking-tightest tnum">
              <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
            </p>

            {badge && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
                  TONES[badge.tone].badge,
                )}
              >
                {badge.label}
              </span>
            )}
          </div>
        )}

        {hint && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}

        {typeof progress === "number" && value !== null && (
          <Progress
            value={Math.min(100, Math.max(0, progress))}
            className="mt-5 h-2"
          />
        )}
      </div>
    </div>
  );

  if (!href) return body;

  return (
    <PressableCard className={className}>
      <Link href={href} className="block h-full">
        {body}
      </Link>
    </PressableCard>
  );
}
