"use client";

/**
 * Interactive dictionary demo on the landing page.
 *
 * This section renders the **real** `BilingualPassage` and `DictionaryToggle`
 * components the simulator uses — not a mock-up. A visitor can flip the switch
 * and tap a word before signing up, and what they try is exactly what they get.
 *
 * `onSaveWord` is deliberately omitted, so the popover hides its "save to word
 * bank" action for anonymous visitors.
 */

import * as React from "react";
import { MousePointerClick } from "lucide-react";

import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { BilingualPassage } from "@/components/simulator/bilingual-passage";
import { DictionaryToggle } from "@/components/simulator/dictionary-toggle";
import { Reveal } from "@/components/motion/reveal";
import { countTermsInPassage, vocabularySize } from "@/lib/vocabulary";

/**
 * A short passage written in the register of a Digital SAT science text, using
 * words that exist in `data/vocabulary.json` so the demo actually lights up.
 */
const DEMO_PASSAGE = `For most of the twentieth century, ecologists treated coral reefs as resilient systems: bleached colonies recovered, and the reef returned to something close to its former state. That paradigm has not survived contact with the last two decades of data. When researchers began to scrutinize long-term monitoring records, the empirical picture that emerged was far less forgiving. Reefs still recover, but the interval between bleaching events has narrowed until recovery is rarely complete.

The evidence is not without nuance. A tenuous correlation between water temperature and coral mortality became, with better instruments, a robust one — yet the same records show reefs whose recovery defies the trend. Plastic debris, now ubiquitous in the ocean, complicates the analysis further. Ecologists remain ambivalent about which factor dominates, and their meticulous disagreement is itself a sign of a field taking its own uncertainty seriously.`;

export function DictionaryDemo() {
  const { t } = useT();
  const [dictionaryEnabled, setDictionaryEnabled] = React.useState(false);

  const termCount = React.useMemo(
    () => countTermsInPassage(DEMO_PASSAGE),
    [],
  );

  return (
    <section
      id="dictionary"
      className="relative scroll-mt-20 overflow-hidden border-y border-border bg-surface py-24 lg:py-section"
    >
      {/* The star field, faded from the top edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-dots-fine [mask-image:linear-gradient(to_bottom,black,transparent_60%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="sticker bg-magenta text-white">
            {t.dictionary.badge}
          </span>
          <h2 className="mt-6 text-4xl leading-[1.05] font-extrabold tracking-tightest text-balance sm:text-5xl">
            {t.dictionary.heading}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
            {t.dictionary.body}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-14">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-card shadow-float">
            {/* Demo control bar, mirroring the simulator header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MousePointerClick className="size-3.5" />
                <span>
                  {dictionaryEnabled
                    ? t.dictionary.hintOn
                    : fill(t.dictionary.hintOff, { count: termCount })}
                </span>
              </div>

              <DictionaryToggle
                enabled={dictionaryEnabled}
                onChange={setDictionaryEnabled}
                termCount={termCount}
              />
            </div>

            <div className="p-5 sm:p-8">
              <BilingualPassage
                text={DEMO_PASSAGE}
                enabled={dictionaryEnabled}
                title="Adapted for demonstration · Science"
              />
            </div>

            <div className="border-t border-border bg-muted/40 px-5 py-3 text-center text-xs text-muted-foreground">
              {fill(t.dictionary.footer, { count: vocabularySize })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
