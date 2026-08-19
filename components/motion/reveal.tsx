"use client";

/**
 * Reveal primitives, powered by GSAP + ScrollTrigger.
 *
 * `Reveal` brings one block in. `StaggerGroup` + `StaggerItem` cascade a set of
 * siblings, so a grid assembles itself instead of popping in whole.
 *
 * Two things make this safe in the App Router:
 *   • `useGSAP` scopes every tween to the component's own ref and reverts it on
 *     unmount, so navigating away can never leave a half-finished tween or a
 *     stale ScrollTrigger behind.
 *   • Selectors run through the scope, so a `StaggerGroup` inside another one
 *     only ever animates its own children (`:scope >`).
 *
 * Reduced motion is honoured by skipping the animation entirely — content is
 * rendered in its final position and never touched.
 */

import * as React from "react";

import {
  DUR,
  EASE,
  RISE_FROM,
  RISE_TO,
  STAGGER,
  STAGGER_TIGHT,
  gsap,
  prefersReducedMotion,
  revealTrigger,
  useGSAP,
} from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait before animating. Use to sequence sibling blocks. */
  delay?: number;
  /** Animate on mount instead of on scroll — for above-the-fold content. */
  immediate?: boolean;
  /** Vertical travel in px. Smaller for tight layouts. */
  distance?: number;
}

export function Reveal({
  children,
  className,
  delay = 0,
  immediate = false,
  distance = 20,
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        ref.current,
        { ...RISE_FROM, y: distance },
        {
          ...RISE_TO,
          duration: DUR.base,
          ease: EASE,
          delay,
          ...(immediate ? {} : { scrollTrigger: revealTrigger(ref.current) }),
        },
      );
    },
    { scope: ref, dependencies: [delay, immediate, distance] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  /** `tight` suits dense lists; `default` suits cards and sections. */
  pace?: "default" | "tight";
  immediate?: boolean;
  delay?: number;
}

/**
 * Parent of a cascade. Every direct `StaggerItem` child animates in sequence.
 *
 * The group animates its children rather than itself, so the grid's own layout
 * (columns, gaps) is never touched by a transform.
 */
export function StaggerGroup({
  children,
  className,
  pace = "default",
  immediate = false,
  delay = 0,
}: StaggerGroupProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const items = gsap.utils.toArray<HTMLElement>(
        ref.current?.querySelectorAll(":scope > [data-stagger-item]") ?? [],
      );
      if (items.length === 0) return;

      gsap.fromTo(items, RISE_FROM, {
        ...RISE_TO,
        duration: DUR.base,
        ease: EASE,
        delay,
        stagger: pace === "tight" ? STAGGER_TIGHT : STAGGER,
        ...(immediate ? {} : { scrollTrigger: revealTrigger(ref.current) }),
      });
    },
    { scope: ref, dependencies: [pace, immediate, delay] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** A child of `StaggerGroup`. Its timing comes from the parent. */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-stagger-item className={cn(className)}>
      {children}
    </div>
  );
}
