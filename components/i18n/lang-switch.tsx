"use client";

/**
 * UZ / EN switch.
 *
 * A two-item segmented control rather than a dropdown: there are exactly two
 * languages, and hiding one of them behind a click to save 40px would be a bad
 * trade on the one control that decides whether a visitor can read the site.
 *
 * The active pill slides between the two halves with GSAP. While the server
 * re-renders in the new language the control dims slightly, so a slow
 * connection still feels like it responded.
 */

import * as React from "react";

import { DUR, EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { useT } from "@/components/i18n/lang-provider";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n/config";

const OPTIONS: Array<{ value: Lang; label: string }> = [
  { value: "uz", label: "UZ" },
  { value: "en", label: "EN" },
];

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang, isSwitching, t } = useT();
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const pill = ref.current?.querySelector("[data-lang-pill]");
      if (!pill) return;

      const index = OPTIONS.findIndex((option) => option.value === lang);

      gsap.to(pill, {
        xPercent: index * 100,
        duration: prefersReducedMotion() ? 0 : DUR.fast,
        ease: EASE,
      });
    },
    { scope: ref, dependencies: [lang] },
  );

  return (
    <div
      ref={ref}
      role="group"
      aria-label={t.lang.label}
      className={cn(
        "relative inline-flex h-9 items-center rounded-full bg-midnight-soft p-1",
        isSwitching && "opacity-70",
        className,
      )}
    >
      {/* The travelling pill. Half the track wide, so `xPercent: 100` lands it
          exactly over the second option regardless of the control's width. */}
      <span
        data-lang-pill
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-midnight"
      />

      {OPTIONS.map((option) => {
        const isActive = option.value === lang;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLang(option.value)}
            aria-pressed={isActive}
            className={cn(
              "relative z-10 w-11 text-xs font-bold transition-colors duration-200",
              isActive ? "text-white" : "text-midnight/70 hover:text-midnight",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
