"use client";

/**
 * The review bar.
 *
 * Fixed to the top of the design-system page with one job: tell you which of
 * the three directions you are looking at, and let you jump between them to
 * compare the same component in two skins.
 *
 * Deliberately neutral — near-black on white, 12px type, no colour of its own.
 * It is the gallery wall, not an exhibit; giving it a personality would
 * contaminate every judgement made on this page.
 *
 * The active direction is tracked with an `IntersectionObserver` keyed to the
 * middle of the viewport rather than a scroll handler, so it costs nothing per
 * frame.
 */

import * as React from "react";

import { DIRECTIONS } from "@/components/design-system/specs";
import { cn } from "@/lib/utils";

export function DirectionNav() {
  const [active, setActive] = React.useState<string>(DIRECTIONS[0].id);

  React.useEffect(() => {
    const sections = DIRECTIONS.map((direction) =>
      document.getElementById(`dir-${direction.id}`),
    ).filter((node): node is HTMLElement => node !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id.replace("dir-", ""));
          }
        }
      },
      // A 1px band across the middle of the viewport: whichever section crosses
      // it is the one being read.
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-6 px-5">
        <div className="flex items-baseline gap-3">
          <span className="text-[13px] font-semibold tracking-tight text-neutral-900">
            Sirius
          </span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
            Design directions
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {DIRECTIONS.map((direction) => {
            const isActive = active === direction.id;
            return (
              <a
                key={direction.id}
                href={`#dir-${direction.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex items-baseline gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    isActive ? "text-white/60" : "text-neutral-400",
                  )}
                >
                  {direction.index}
                </span>
                {direction.name}
              </a>
            );
          })}

          <a
            href="#compare"
            className="ml-2 rounded-md border border-neutral-200 px-3 py-1.5 text-[13px] text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
          >
            Compare
          </a>
        </nav>
      </div>
    </header>
  );
}
