"use client";

/**
 * The marketing site's top bar.
 *
 * Client-side because it reacts to scroll position and owns the mobile menu.
 * Auth state arrives as a prop from the server component above, so the right
 * buttons render in the first paint with no signed-in/signed-out flicker.
 *
 * The bar starts transparent over the hero and gains a frosted plate, a
 * hairline and the spectrum rule once you scroll. A passive scroll listener
 * flips one boolean at the threshold, so the component re-renders once rather
 * than on every frame.
 *
 * The language switch lives here because it changes how the entire page reads,
 * and burying it in a footer would be a bad joke on the visitor who needs it.
 */

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Pressable } from "@/components/motion/pressable";
import { LangSwitch } from "@/components/i18n/lang-switch";
import { useT } from "@/components/i18n/lang-provider";
import { cn } from "@/lib/utils";

export function StickyHeader({ isSignedIn }: { isSignedIn: boolean }) {
  const { t } = useT();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when the viewport grows past the breakpoint, so the
  // panel cannot be left open behind the desktop layout.
  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const handleChange = () => {
      if (query.matches) setIsMenuOpen(false);
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const navLinks = [
    { href: "#features", label: t.nav.features },
    { href: "#dictionary", label: t.nav.dictionary },
    { href: "#journey", label: t.nav.journey },
  ];

  return (
    <header
      /*
       * SOLID, NOT FROSTED.
       *
       * This was `glass` once scrolled and `bg-transparent` before that. Both
       * let the page show through: `glass` is 72% background, and transparent
       * is all of it. On a phone the hero heading passed straight under the nav
       * labels and neither was readable. The Uzbek labels are longer
       * ("Imkoniyatlar / Lug'at / Yo'l xaritasi") so they collided across more
       * of the width.
       *
       * Same colour token and same height — `glass` resolves to `--background`
       * at 72%, so this is that colour at 100%. The `glass` utility itself is
       * untouched: the app shell's sidebar is built on blurring the spectrum
       * blobs behind it, and flattening the utility would take that with it.
       */
      className={cn(
        "sticky top-0 z-50 w-full bg-background transition-all duration-300",
        isScrolled && "border-b border-border",
      )}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="tap-target rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t.nav.home}
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LangSwitch />

          <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

          {isSignedIn ? (
            <Pressable>
              <Button asChild size="lg" className="h-10 rounded-lg px-5">
                <Link href="/dashboard">{t.nav.dashboard}</Link>
              </Button>
            </Pressable>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-10 rounded-lg px-4"
              >
                <Link href="/sign-in">{t.nav.signIn}</Link>
              </Button>
              <Pressable>
                <Button
                  asChild
                  size="lg"
                  className="h-10 rounded-lg px-5 shadow-glow"
                >
                  <Link href="/sign-up">{t.nav.getStarted}</Link>
                </Button>
              </Pressable>
            </>
          )}
        </div>

        {/* Mobile trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <LangSwitch />
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="tap-target inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* The spectrum hairline, drawn only once the bar has a background. */}
      <div
        aria-hidden="true"
        className={cn(
          "h-px w-full bg-spectrum transition-opacity duration-300",
          isScrolled ? "opacity-100" : "opacity-0",
        )}
      />

      {/*
       * Mobile panel. The open/closed animation is the CSS grid-rows trick:
       * animating `grid-template-rows` from 0fr to 1fr slides a panel of
       * unknown height with no JS measurement and no fixed max-height that
       * would clip a longer menu later.
       */}
      <div
        id="mobile-nav"
        className={cn(
          // Solid for the same reason as the header above it: an open menu with
          // the page visible through it is two sets of words in one space.
          "grid overflow-hidden bg-background transition-[grid-template-rows,opacity] duration-300 ease-out md:hidden",
          isMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <nav className="flex flex-col gap-1 px-4 pt-2 pb-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {isSignedIn ? (
                <Button asChild size="lg" className="h-11 w-full rounded-lg">
                  <Link href="/dashboard">{t.nav.dashboard}</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-11 w-full rounded-lg"
                  >
                    <Link href="/sign-in">{t.nav.signIn}</Link>
                  </Button>
                  <Button asChild size="lg" className="h-11 w-full rounded-lg">
                    <Link href="/sign-up">{t.nav.getStarted}</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
