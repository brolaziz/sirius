/**
 * Design-system route shell.
 *
 * Sits outside the `(app)` and `(marketing)` groups, so it inherits only the
 * root layout: no sidebar, no marketing header, no auth. `proxy.ts` does not
 * list `/design-system` as protected, so it is reachable while signed out —
 * this is a review surface, not product.
 *
 * The six faces below are the display/body/data pairings for the three
 * directions. They are requested here rather than in the root layout so the
 * product's own pages never pay for them.
 */

import type { Metadata } from "next";
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
  return (
    <div
      className={`${interTight.variable} ${plexMono.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${bricolage.variable} ${instrumentSans.variable}`}
    >
      {children}
    </div>
  );
}
