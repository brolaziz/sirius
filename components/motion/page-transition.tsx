"use client";

/**
 * Route transition.
 *
 * Replays a short rise-and-fade whenever the pathname changes, so moving
 * between pages feels like the app answering rather than the screen blinking.
 *
 * Enter-only, on purpose: the App Router unmounts the outgoing page before the
 * incoming one commits, so an exit animation has nothing left to animate.
 * Faking one means holding stale UI on screen and delaying every navigation.
 *
 * `ScrollTrigger.refresh()` runs after the entrance because the new page has a
 * different height, and every reveal below the fold measured against the old
 * one.
 */

import * as React from "react";
import { usePathname } from "next/navigation";

import {
  DUR,
  EASE,
  ScrollTrigger,
  gsap,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/gsap";

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: DUR.base,
          ease: EASE,
          onComplete: () => ScrollTrigger.refresh(),
        },
      );
    },
    { scope: ref, dependencies: [pathname] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
