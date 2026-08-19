/**
 * Word bank page.
 *
 * Saved words come from Postgres; their translations are resolved from the
 * static dictionary. Below the bank, the full dictionary is browsable so a
 * student can revise even before they have saved anything.
 */

import type { Metadata } from "next";

import { WordBank, type SavedWordView } from "@/components/words/word-bank";
import { Badge } from "@/components/ui/badge";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { lookupWord, vocabularyEntries } from "@/lib/vocabulary";
import { getDictionary, getLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "My words",
};

export default async function WordsPage() {
  const databaseReady = isDatabaseConfigured();
  const userId = databaseReady ? await getCurrentUserId() : null;
  const t = getDictionary(await getLang());

  const savedWords =
    databaseReady && userId
      ? await prisma.savedWord.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { word: true },
        })
      : [];

  const words: SavedWordView[] = savedWords.map((row) => ({
    word: row.word,
    entry: lookupWord(row.word) ?? null,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-14">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t.pages.wordsEyebrow}
        </p>
        <h1 className="mt-2 text-4xl leading-[1.02] font-extrabold tracking-tightest text-balance sm:text-5xl lg:text-6xl">
          {t.pages.wordsTitle}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {t.pages.wordsBody}
        </p>
      </div>

      <WordBank words={words} />

      {/* Full dictionary */}
      <section>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t.pages.wordsDictionary}
          </h2>
          <Badge variant="secondary" className="tnum">
            {vocabularyEntries.length}
          </Badge>
        </div>

        <ul className="mt-5 divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-card">
          {vocabularyEntries.map((entry) => (
            <li
              key={entry.word}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1 p-5"
            >
              <span className="w-32 shrink-0 font-medium">{entry.word}</span>
              <span className="text-sm font-medium text-primary">
                {entry.translation}
              </span>
              <span className="w-full text-xs leading-relaxed text-muted-foreground sm:w-auto sm:flex-1">
                {entry.explanation}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
