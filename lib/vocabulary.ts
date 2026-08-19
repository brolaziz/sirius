/**
 * Bilingual dictionary — lookup and passage tokenisation.
 *
 * `data/vocabulary.json` is imported statically, so the dictionary is bundled
 * with the app: a lookup is a `Map.get`, with no network request and no
 * database round-trip. That is what makes the tooltip feel instant while a
 * student is mid-passage.
 *
 * The tokeniser deliberately returns structured data rather than an HTML
 * string. Passage text arrives from an imported JSON payload — untrusted input
 * as far as the renderer is concerned — so it must never reach
 * `dangerouslySetInnerHTML`. React escapes every token for us instead.
 */

import vocabularyData from "@/data/vocabulary.json";

/** A single dictionary entry, English headword to Uzbek. */
export interface VocabularyEntry {
  /** The headword, lower-case. */
  word: string;
  partOfSpeech: string;
  /** Uzbek translation — the primary payload of the tooltip. */
  translation: string;
  /** Short English gloss. */
  explanation: string;
  /** Uzbek-language explanation. */
  explanationUz: string;
  /** A sentence showing the word in use. */
  example: string;
  /**
   * Inflections that resolve to this entry (plurals, -ed/-ing, British
   * spellings). Always includes the headword itself.
   */
  forms: string[];
}

const entries = vocabularyData.entries as VocabularyEntry[];

/**
 * Every surface form mapped to its entry: `"scrutinized" -> scrutinize`.
 * Built once at module load.
 */
const formIndex: ReadonlyMap<string, VocabularyEntry> = (() => {
  const index = new Map<string, VocabularyEntry>();
  for (const entry of entries) {
    for (const form of entry.forms) {
      index.set(form.toLowerCase(), entry);
    }
    // Defend against an entry whose `forms` omits its own headword.
    index.set(entry.word.toLowerCase(), entry);
  }
  return index;
})();

/** All entries, alphabetised — used by the word-bank page. */
export const vocabularyEntries: readonly VocabularyEntry[] = [...entries].sort(
  (a, b) => a.word.localeCompare(b.word),
);

/** How many headwords the dictionary holds. */
export const vocabularySize = entries.length;

/**
 * Normalise a token to its dictionary key: lower-case, and drop a possessive
 * suffix (`paradigm's` -> `paradigm`) plus any surrounding curly quotes.
 */
function normaliseToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[‘’']s$/, "")
    .replace(/^[‘’']+|[‘’']+$/g, "");
}

/**
 * Look up a single word. Accepts any inflection listed in the dictionary and is
 * case- and possessive-insensitive.
 */
export function lookupWord(raw: string): VocabularyEntry | undefined {
  return formIndex.get(normaliseToken(raw));
}

/** A run of passage text: either plain prose or a matched dictionary term. */
export type PassageToken =
  | { kind: "text"; value: string }
  | { kind: "term"; value: string; entry: VocabularyEntry };

/**
 * Matches a word: a letter, then letters, apostrophes or internal hyphens.
 * Unicode apostrophes are included so curly-quoted text still matches.
 */
const WORD_PATTERN = /[A-Za-z][A-Za-z‘’'-]*/g;

/**
 * Split passage text into tokens, marking every word that has a dictionary
 * entry.
 *
 * Whitespace and punctuation are preserved verbatim in `text` tokens, so
 * joining every `value` back together reproduces the input exactly.
 */
export function tokenizePassage(text: string): PassageToken[] {
  const tokens: PassageToken[] = [];
  let lastIndex = 0;

  // `matchAll` needs the global flag, which `WORD_PATTERN` has; using it here
  // (rather than `exec` in a loop) avoids sharing mutable `lastIndex` state
  // across calls.
  for (const match of text.matchAll(WORD_PATTERN)) {
    const word = match[0];
    const start = match.index;

    const entry = formIndex.get(normaliseToken(word));
    if (!entry) continue;

    if (start > lastIndex) {
      tokens.push({ kind: "text", value: text.slice(lastIndex, start) });
    }
    tokens.push({ kind: "term", value: word, entry });
    lastIndex = start + word.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Split raw passage text into paragraphs on blank lines, trimming empties.
 * Falls back to a single paragraph when the text has no blank lines.
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * Count how many distinct dictionary terms appear in a passage. Used to show
 * "12 words available" style affordances before the student turns the
 * dictionary on.
 */
export function countTermsInPassage(text: string): number {
  const seen = new Set<string>();
  for (const match of text.matchAll(WORD_PATTERN)) {
    const entry = formIndex.get(normaliseToken(match[0]));
    if (entry) seen.add(entry.word);
  }
  return seen.size;
}
