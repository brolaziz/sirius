"use client";

/**
 * The dashboard's bento field.
 *
 * A 12-column grid whose tiles cascade in when the page mounts — the dashboard
 * must never appear all at once. The cascade is short (about 0.7s end to end)
 * because this is a page a student opens every day: long enough to read as
 * choreography the first time, short enough that it never feels like waiting.
 *
 * The stagger is `from: "start"` in DOM order rather than grid position, so the
 * anchor tile lands first and the eye is led through the layout in the order
 * the page argues its case.
 *
 * Items animate, the grid does not: a transform on the container would move the
 * whole layout and fight the sticky header above it.
 *
 * Both elements carry `suppressHydrationWarning`. The dashboard is the most
 * div-dense screen in the product, which makes it the one browser security
 * extensions rewrite most — Bitdefender adds `bis_skin_checked="1"` to block
 * elements as it scans them, and React reports every one as a mismatch. The
 * flag only covers the element it is on, so it is applied to the two wrappers
 * the extension reaches before the tiles themselves.
 */

import * as React from "react";

import { DUR, EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export function BentoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const items = ref.current?.querySelectorAll(":scope > [data-bento-item]");
      if (!items || items.length === 0) return;

      gsap.from(items, {
        opacity: 0,
        y: 36,
        scale: 0.97,
        duration: DUR.base,
        ease: EASE,
        stagger: 0.075,
      });
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-12 lg:auto-rows-min",
        className,
      )}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

/**
 * One tile. Pass the column span through `className`
 * (`"sm:col-span-6 lg:col-span-4"`); the wrapper only handles presence in the
 * cascade and full-height stretch, so a tall neighbour does not leave a short
 * tile floating.
 */
export function BentoItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-bento-item
      className={cn("min-w-0 [&>*]:h-full", className)}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}
