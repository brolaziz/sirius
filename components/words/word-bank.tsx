"use client";

/**
 * Word bank — the words a student saved while reading passages.
 *
 * Translations are resolved from the static dictionary at render time rather
 * than stored alongside the saved word. That way, improving an entry in
 * `data/vocabulary.json` improves it everywhere at once, instead of leaving
 * stale copies in every student's word bank.
 */

import * as React from "react";
import { BookMarked, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { removeSavedWord } from "@/lib/actions/words";
import {
  DUR,
  EASE,
  STAGGER_TIGHT,
  gsap,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/gsap";
import type { VocabularyEntry } from "@/lib/vocabulary";

export interface SavedWordView {
  word: string;
  /** Null when the saved word is no longer in the dictionary. */
  entry: VocabularyEntry | null;
}

export function WordBank({ words }: { words: SavedWordView[] }) {
  const { t } = useT();
  const listRef = React.useRef<HTMLUListElement>(null);
  const [query, setQuery] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const [optimisticWords, removeOptimistically] = React.useOptimistic(
    words,
    (current: SavedWordView[], removed: string) =>
      current.filter((item) => item.word !== removed),
  );

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return optimisticWords;

    return optimisticWords.filter((item) =>
      [item.word, item.entry?.translation ?? "", item.entry?.explanation ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [optimisticWords, query]);

  /*
   * Cascade the cards whenever the search narrows the list. Keyed on the words
   * themselves so a removal re-runs it too, which covers the gap left by
   * dropping the exit animation: the list visibly re-settles instead of a card
   * silently vanishing.
   */
  const visibleKey = visible.map((item) => item.word).join("|");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const cards = listRef.current?.querySelectorAll("[data-word-card]");
      if (!cards || cards.length === 0) return;

      gsap.fromTo(
        cards,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: DUR.base,
          ease: EASE,
          stagger: STAGGER_TIGHT,
          overwrite: "auto",
        },
      );
    },
    { scope: listRef, dependencies: [visibleKey] },
  );

  function handleRemove(word: string) {
    startTransition(async () => {
      removeOptimistically(word);
      const result = await removeSavedWord(word);
      if (!result.ok) {
        toast.error(result.error ?? t.words.removeFailed);
      }
    });
  }

  if (optimisticWords.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <BookMarked className="size-5" />
        </span>
        <h2 className="mt-5 text-lg font-bold">{t.words.emptyTitle}</h2>
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t.words.emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.words.searchPlaceholder}
          className="h-11 rounded-xl pl-10"
          aria-label={t.words.searchLabel}
        />
      </div>

      <p className="text-xs text-muted-foreground tnum">
        {fill(t.words.counted, {
          shown: visible.length,
          total: optimisticWords.length,
        })}
      </p>

      <ul ref={listRef} className="grid gap-4 sm:grid-cols-2">
          {visible.map((item) => (
            <li
              key={item.word}
              data-word-card
              className="rounded-2xl bg-card p-5 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-base font-bold">{item.word}</h3>
                    {item.entry?.partOfSpeech && (
                      <span className="text-[11px] text-muted-foreground italic">
                        {item.entry.partOfSpeech}
                      </span>
                    )}
                  </div>

                  {item.entry ? (
                    <>
                      <p className="mt-1 text-sm font-medium text-primary">
                        {item.entry.translation}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {item.entry.explanationUz}
                      </p>
                    </>
                  ) : (
                    <Badge variant="secondary" className="mt-2">
                      {t.words.notInDictionary}
                    </Badge>
                  )}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.word)}
                      disabled={isPending}
                      aria-label={fill(t.words.removeNamed, { word: item.word })}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t.words.remove}</TooltipContent>
                </Tooltip>
              </div>

              {item.entry?.example && (
                <p className="mt-3 border-l-2 border-brand-200 pl-2.5 text-xs leading-relaxed text-muted-foreground italic">
                  {item.entry.example}
                </p>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
