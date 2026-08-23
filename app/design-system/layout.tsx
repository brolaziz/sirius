/**
 * Design-system route shell.
 *
 * Sits outside the `(app)` and `(marketing)` groups, so it inherits only the
 * root layout: no sidebar, no marketing header, no auth. This is a review
 * surface, not product.
 *
 * DEVELOPMENT ONLY — see the guard below.
 *
 * The six faces below are the display/body/data pairings for the three
 * directions. They are requested here rather than in the root layout so the
 * product's own pages never pay for them.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  Instrument_Sans,
  Inter_Tight,
  JetBrains_Mono,
  Space_Grotesk,
} from "next/font/google";

import "./design-system.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Design directions",
  description:
    "Three competing visual directions for Sirius, each shown with the same " +
    "fifteen product components.",
  robots: { index: false, follow: false },
};

export default function DesignSystemLayout({ children }: LayoutProps<"/design-system">) {
  /*
   * NOT REACHABLE IN PRODUCTION.
   *
   * This route was publicly reachable on the live site: it is not in
   * `PROTECTED_PREFIXES`, and `noindex` asks search engines not to list it
   * rather than stopping anyone who has the URL. It is three abandoned
   * direction explorations and a spec panel — scaffolding, not unfinished
   * product — and a tap-target audit found 54 failures in it, which is fine for
   * a review surface and not fine for something a student can open.
   *
   * The guard is here rather than in `proxy.ts` on purpose. `proxy.ts` only
   * checks that a session cookie exists — its own comment says it "is not a
   * security boundary" — so listing this route there would still let every
   * signed-in student read it. The question is not who may see it; it is that
   * it should not exist outside development for anyone.
   *
   * This removes the surface, not the bundle: the direction components are
   * still compiled. Excluding them from the build is a separate change.
   */
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div
      className={`${interTight.variable} ${plexMono.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${bricolage.variable} ${instrumentSans.variable}`}
    >
      {children}
    </div>
  );
}
