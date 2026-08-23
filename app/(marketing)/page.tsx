/**
 * Landing page — the public front door.
 *
 * The order is the argument: what Sirius is (hero), proof it is a platform and
 * not a test-prep site (ticker, the six pillars), then one of those pillars
 * shown close up and playable (the SAT toolkit's dictionary), how the process
 * actually runs (the journey), and the ask (CTA). Each section owns its own
 * scroll animation, so the page reads as one continuous reveal.
 *
 * The dictionary sits directly under the six pillars on purpose: it is the
 * demonstration of the SAT pillar, and reading it anywhere else in the order
 * would make it look like a claim of its own.
 */

import type { Metadata } from "next";

import { Hero } from "@/components/marketing/hero";
import { Ticker } from "@/components/marketing/ticker";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { DictionaryDemo } from "@/components/marketing/dictionary-demo";
import { JourneySection } from "@/components/marketing/journey-section";
import { CtaBand } from "@/components/marketing/cta-band";

export const metadata: Metadata = {
  title: "Sirius — Digital SAT prep & university admissions",
  description:
    "Practise the real Digital SAT, tap any English word to see it in Uzbek, " +
    "and keep every university deadline in one place. Free to start.",
};

export default function LandingPage() {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <Ticker />
      <FeatureGrid />
      <DictionaryDemo />
      <JourneySection />
      <CtaBand />
    </>
  );
}
