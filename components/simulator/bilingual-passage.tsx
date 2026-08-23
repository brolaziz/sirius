"use client";

/**
 * The bilingual reading passage — Sirius's killer feature.
 *
 * Renders passage prose and, when the dictionary is switched on, wraps every
 * word that has a dictionary entry in a popover showing its Uzbek translation.
 *
 * Design decisions worth keeping:
 *
 *  • **No `dangerouslySetInnerHTML`.** Passage text is imported from external
 *    JSON, so it is untrusted. `tokenizePassage` returns structured tokens and
 *    React escapes each one.
 *
 *  • **Static dictionary.** Lookups hit an in-memory `Map` built from
 *    `data/vocabulary.json` at build time, so the translation is on screen in
 *    the same frame as the tap. Nothing is fetched.
 *
 *  • **One popover, hover *and* tap.** Hover alone would strand phone users;
 *    tap alone would feel sluggish on a laptop. We open on hover only where the
 *    device actually supports hovering (`(hover: hover)`), and on click or
 *    keyboard everywhere.
 *
 *  • **Terms stay inline.** Each trigger is `display: inline` so a highlighted
 *    word can break across lines like any other word — a passage must still read
 *    like prose.
 */

import * as React from "react";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/lang-provider";
import {
  splitParagraphs,
  tokenizePassage,
  type VocabularyEntry,
} from "@/lib/vocabulary";

interface BilingualPassageProps {
  /** Raw passage text. Blank lines separate paragraphs. */
  text: string;
  /** Whether the dictionary highlighting is active. */
  enabled: boolean;
  title?: string | null;
  className?: string;
  /**
   * When provided, the popover offers "Save to word bank". Omit it (as the
   * marketing demo does) and the action is hidden.
   */
  onSaveWord?: (word: string) => Promise<void> | void;
}

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

/**
 * True on devices that can actually hover (mouse/trackpad, not touch).
 *
 * Implemented with `useSyncExternalStore` rather than `useState` + `useEffect`.
 * `matchMedia` is an external store, and subscribing to it properly avoids the
 * cascading extra render that setting state inside an effect would cause — on
 * first paint the value is already correct rather than flipping from `false`.
 */
function useHoverCapable(): boolean {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    const query = window.matchMedia(HOVER_QUERY);
    query.addEventListener("change", onStoreChange);
    return () => query.removeEventListener("change", onStoreChange);
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(HOVER_QUERY).matches,
    // Server snapshot: assume touch, so the popover stays tap-driven until the
    // client confirms otherwise. Hydration then upgrades it.
    () => false,
  );
}

/** The card shown inside the popover. */
function TranslationCard({
  entry,
  surfaceForm,
  onSaveWord,
}: {
  entry: VocabularyEntry;
  surfaceForm: string;
  onSaveWord?: (word: string) => Promise<void> | void;
}) {
  const { t } = useT();
  const [state, setState] = React.useState<"idle" | "saving" | "saved">("idle");

  async function handleSave() {
    if (state !== "idle" || !onSaveWord) return;
    setState("saving");
    try {
      await onSaveWord(entry.word);
      setState("saved");
    } catch {
      // Surfacing a toast here would cover the passage; reverting the button is
      // enough signal to retry.
      setState("idle");
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{entry.word}</p>
          {/* Show the inflected form only when it differs from the headword. */}
          {surfaceForm.toLowerCase() !== entry.word.toLowerCase() && (
            <p className="text-[11px] text-muted-foreground">
              as written: {surfaceForm}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground italic">
          {entry.partOfSpeech}
        </span>
      </div>

      {/* The translation is the reason the student tapped — give it prominence. */}
      <p className="text-sm leading-snug font-medium text-primary">
        {entry.translation}
      </p>

      <div className="space-y-1.5 border-t border-border pt-2">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {entry.explanationUz}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground/80">
          {entry.explanation}
        </p>
      </div>

      {entry.example && (
        <p className="border-l-2 border-brand-200 pl-2.5 text-xs leading-relaxed text-muted-foreground italic">
          {entry.example}
        </p>
      )}

      {onSaveWord && (
        <button
          type="button"
          onClick={handleSave}
          disabled={state !== "idle"}
          className={cn(
            "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
            state === "saved"
              ? "bg-brand-50 text-brand-800"
              : "bg-muted text-foreground hover:bg-brand-50 hover:text-brand-800",
          )}
        >
          {state === "saving" && <Loader2 className="size-3.5 animate-spin" />}
          {state === "saved" && <Check className="size-3.5" />}
          {state === "idle" && <BookmarkPlus className="size-3.5" />}
          {state === "saved" ? t.simulator.savedWord : t.simulator.saveWord}
        </button>
      )}
    </div>
  );
}

/** A single highlighted term and its popover. */
function DictionaryTerm({
  surfaceForm,
  entry,
  hoverCapable,
  onSaveWord,
}: {
  surfaceForm: string;
  entry: VocabularyEntry;
  hoverCapable: boolean;
  onSaveWord?: (word: string) => Promise<void> | void;
}) {
  const [open, setOpen] = React.useState(false);
  // Delay closing so the pointer can travel from the word into the card without
  // the card vanishing under it.
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = React.useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }, [cancelClose]);

  React.useEffect(() => cancelClose, [cancelClose]);

  const hoverHandlers = hoverCapable
    ? {
        onMouseEnter: () => {
          cancelClose();
          setOpen(true);
        },
        onMouseLeave: scheduleClose,
      }
    : {};

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // `inline` (not inline-block) so the word wraps like normal prose.
          className="dict-term inline appearance-none bg-none text-left font-[inherit] text-[inherit]"
          aria-label={`${surfaceForm} — Uzbek: ${entry.translation}`}
          {...hoverHandlers}
        >
          {surfaceForm}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        className="w-72"
        // Keep the card open while the pointer is inside it.
        onMouseEnter={hoverCapable ? cancelClose : undefined}
        onMouseLeave={hoverCapable ? scheduleClose : undefined}
        // Hovering should not steal focus from the passage.
        onOpenAutoFocus={(event) => {
          if (hoverCapable) event.preventDefault();
        }}
      >
        <TranslationCard
          entry={entry}
          surfaceForm={surfaceForm}
          onSaveWord={onSaveWord}
        />
      </PopoverContent>
    </Popover>
  );
}

export function BilingualPassage({
  text,
  enabled,
  title,
  className,
  onSaveWord,
}: BilingualPassageProps) {
  const hoverCapable = useHoverCapable();

  const paragraphs = React.useMemo(() => splitParagraphs(text), [text]);

  // Tokenising is cheap, but it runs on every keystroke of a parent's state
  // (answer selection, timer ticks) without this memo.
  const tokenised = React.useMemo(
    () => (enabled ? paragraphs.map(tokenizePassage) : null),
    [enabled, paragraphs],
  );

  return (
    <div className={cn("passage-prose", className)}>
      {title && (
        <p className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </p>
      )}

      {paragraphs.map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex}>
          {tokenised
            ? tokenised[paragraphIndex].map((token, tokenIndex) =>
                token.kind === "term" ? (
                  <DictionaryTerm
                    key={tokenIndex}
                    surfaceForm={token.value}
                    entry={token.entry}
                    hoverCapable={hoverCapable}
                    onSaveWord={onSaveWord}
                  />
                ) : (
                  <React.Fragment key={tokenIndex}>{token.value}</React.Fragment>
                ),
              )
            : paragraph}
        </p>
      ))}
    </div>
  );
}
