"use client";

/**
 * Primary navigation for the authenticated app.
 *
 * One component serves both the desktop sidebar and the mobile sheet, so the
 * two can never drift apart. The active item comes from `usePathname()`.
 *
 * The active indicator is a single pill that GSAP slides between items, rather
 * than one pill per link fading in and out. Measuring `offsetTop` against the
 * nav and tweening `y` costs one tween and no layout thrash, and it reads as
 * one object moving — which is the whole point of the effect.
 *
 * The first placement is instant. Animating the pill into position on page load
 * would be motion the visitor did not ask for and cannot connect to an action.
 *
 * The two groups are named for what a student is trying to do, not for what the
 * screens contain.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  GraduationCap,
  House,
  PenLine,
  type LucideIcon,
} from "lucide-react";

import { useT } from "@/components/i18n/lang-provider";
import { DUR, EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  eyebrow: string;
  items: NavItem[];
}

export function AppNav({
  onNavigate,
}: {
  /** Called after a link is clicked — used to close the mobile sheet. */
  onNavigate?: () => void;
}) {
  const { t } = useT();
  const pathname = usePathname();
  const navRef = React.useRef<HTMLElement>(null);
  const pillRef = React.useRef<HTMLSpanElement>(null);

  const sections: NavSection[] = [
    {
      eyebrow: t.app.build,
      items: [
        { href: "/dashboard", label: t.app.today, icon: House },
        { href: "/practice", label: t.app.practice, icon: PenLine },
        { href: "/words", label: t.app.myWords, icon: BookMarked },
      ],
    },
    {
      eyebrow: t.app.apply,
      items: [
        { href: "/universities", label: t.app.universities, icon: GraduationCap },
      ],
    },
  ];

  useGSAP(
    () => {
      const nav = navRef.current;
      const pill = pillRef.current;
      if (!nav || !pill) return;

      const active = nav.querySelector<HTMLElement>('[data-active="true"]');
      if (!active) {
        gsap.set(pill, { autoAlpha: 0 });
        return;
      }

      // `placed` marks the first run, which snaps instead of sliding.
      const isFirstPlacement = pill.dataset.placed !== "true";
      pill.dataset.placed = "true";

      gsap.to(pill, {
        y: active.offsetTop,
        height: active.offsetHeight,
        autoAlpha: 1,
        duration:
          isFirstPlacement || prefersReducedMotion() ? 0 : DUR.fast * 1.6,
        ease: EASE,
      });
    },
    { scope: navRef, dependencies: [pathname, t.app.today] },
  );

  return (
    <nav ref={navRef} className="relative flex flex-col gap-6">
      {/* The travelling indicator. Decorative; the link carries `aria-current`. */}
      <span
        ref={pillRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-midnight-soft"
        style={{ opacity: 0 }}
      />

      {sections.map((section) => (
        <div key={section.eyebrow}>
          <p className="px-3 pb-1.5 text-xs font-semibold text-muted-foreground/80">
            {section.eyebrow}
          </p>

          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              // `/practice` should stay active on `/practice/anything`.
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  data-active={isActive}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "text-midnight"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200",
                      isActive
                        ? "bg-midnight text-lime"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-[17px]" />
                  </span>

                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
