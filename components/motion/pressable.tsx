"use client";

/**
 * Press feedback, in GSAP.
 *
 * One place answers "how does a thing respond when you touch it", so every
 * button, tile and card in Sirius responds the same way:
 *
 *   • `Pressable`     — wraps a control. Grows 2% under the pointer, presses to
 *                       98% under the finger.
 *   • `PressableCard` — wraps a clickable surface: the same press plus a small
 *                       rise, so a card reads as liftable.
 *
 * `gsap.quickTo` builds the tween once and then just feeds it new values, which
 * is what keeps a hover from allocating on every pointer event. Pointer
 * handlers cover mouse, touch and pen in one path, and `pointercancel` puts the
 * element back if a scroll steals the gesture mid-press.
 *
 * Reduced motion removes the transform entirely rather than shortening it.
 */

import * as React from "react";

import { DUR, EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type QuickTo = ReturnType<typeof gsap.quickTo>;

interface PressableProps {
  children: React.ReactNode;
  className?: string;
  /** Turn the press off for disabled controls, without unmounting anything. */
  disabled?: boolean;
}

function usePress(disabled: boolean, lift: number) {
  const ref = React.useRef<HTMLDivElement>(null);
  const scaleTo = React.useRef<QuickTo | null>(null);
  const yTo = React.useRef<QuickTo | null>(null);

  useGSAP(
    () => {
      if (disabled || prefersReducedMotion()) {
        scaleTo.current = null;
        yTo.current = null;
        return;
      }

      const options = { duration: DUR.fast, ease: EASE };
      scaleTo.current = gsap.quickTo(ref.current, "scale", options);
      yTo.current = gsap.quickTo(ref.current, "y", options);
    },
    { scope: ref, dependencies: [disabled, lift] },
  );

  const set = React.useCallback((scale: number, y: number) => {
    scaleTo.current?.(scale);
    yTo.current?.(y);
  }, []);

  return {
    ref,
    handlers: {
      onPointerEnter: () => set(1.02, -lift),
      onPointerLeave: () => set(1, 0),
      onPointerDown: () => set(0.98, 0),
      onPointerUp: () => set(1.02, -lift),
      onPointerCancel: () => set(1, 0),
    },
  };
}

export function Pressable({
  children,
  className,
  disabled = false,
}: PressableProps) {
  const { ref, handlers } = usePress(disabled, 0);

  return (
    <div ref={ref} className={cn("inline-flex", className)} {...handlers}>
      {children}
    </div>
  );
}

export function PressableCard({
  children,
  className,
  disabled = false,
}: PressableProps) {
  const { ref, handlers } = usePress(disabled, 4);

  return (
    <div ref={ref} className={cn("h-full", className)} {...handlers}>
      {children}
    </div>
  );
}

/**
 * A control that leans toward the pointer.
 *
 * The gsap.com move: as the cursor crosses the button's neighbourhood the
 * element follows it by a fraction of the distance, then springs back when the
 * pointer leaves. `strength` is that fraction — 0.3 is playful, above 0.5 the
 * button starts to feel like it is running away.
 *
 * Pointer-only by design: on touch there is no hover state to lean into, and
 * `(hover: hover)` keeps phones from paying for a listener they cannot use.
 */
export function MagneticButton({
  children,
  className,
  disabled = false,
  strength = 0.32,
}: PressableProps & { strength?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const xTo = React.useRef<QuickTo | null>(null);
  const yTo = React.useRef<QuickTo | null>(null);
  const scaleTo = React.useRef<QuickTo | null>(null);

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) return;

      if (
        disabled ||
        prefersReducedMotion() ||
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches
      ) {
        return;
      }

      const options = { duration: 0.5, ease: "power3.out" };
      xTo.current = gsap.quickTo(node, "x", options);
      yTo.current = gsap.quickTo(node, "y", options);
      scaleTo.current = gsap.quickTo(node, "scale", {
        duration: DUR.fast,
        ease: EASE,
      });

      const onMove = (event: PointerEvent) => {
        const bounds = node.getBoundingClientRect();
        const offsetX = event.clientX - (bounds.left + bounds.width / 2);
        const offsetY = event.clientY - (bounds.top + bounds.height / 2);
        xTo.current?.(offsetX * strength);
        yTo.current?.(offsetY * strength);
      };

      const onEnter = () => scaleTo.current?.(1.04);
      const onLeave = () => {
        xTo.current?.(0);
        yTo.current?.(0);
        scaleTo.current?.(1);
      };

      node.addEventListener("pointermove", onMove);
      node.addEventListener("pointerenter", onEnter);
      node.addEventListener("pointerleave", onLeave);

      return () => {
        node.removeEventListener("pointermove", onMove);
        node.removeEventListener("pointerenter", onEnter);
        node.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: ref, dependencies: [disabled, strength] },
  );

  return (
    <div ref={ref} className={cn("inline-flex", className)}>
      {children}
    </div>
  );
}
