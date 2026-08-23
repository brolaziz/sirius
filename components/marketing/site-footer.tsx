"use client";

/**
 * Marketing footer.
 *
 * Also the second home of the language switch: someone who reaches the bottom
 * of the page in the wrong language should not have to scroll back up to fix
 * it.
 */

import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { LangSwitch } from "@/components/i18n/lang-switch";
import { useT } from "@/components/i18n/lang-provider";

export function SiteFooter() {
  const { t } = useT();

  const sections = [
    {
      heading: t.footer.product,
      links: [
        { label: t.app.universities, href: "#features" },
        { label: t.nav.journey, href: "#journey" },
      ],
    },
    {
      heading: t.footer.account,
      links: [
        { label: t.nav.getStarted, href: "/sign-up" },
        { label: t.nav.signIn, href: "/sign-in" },
        { label: t.nav.dashboard, href: "/dashboard" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t.footer.tagline}
            </p>

            <div className="mt-6">
              <LangSwitch />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-16">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-sm font-bold text-foreground">
                  {section.heading}
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        // `tap-row`, not `tap-target`: six 17px links 10px
                        // apart cannot reach 44 invisibly without overlapping
                        // each other, so on touch the rows take real height.
                        className="tap-row text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* The spectrum, as a hairline signature across the bottom. */}
        <div
          aria-hidden="true"
          className="mt-10 h-0.5 w-full rounded-full bg-spectrum"
        />

        <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Sirius. {t.footer.rights}
          </p>
          <p>{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
