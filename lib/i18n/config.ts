/**
 * Language constants shared by both runtimes.
 *
 * Kept apart from `lib/i18n/index.ts` because that file imports `next/headers`,
 * which is server-only: a client component pulling in `Lang` would drag the
 * whole server module into the browser bundle and fail the build. Types and
 * constants live here; anything that reads a request lives there.
 */

import { DICTIONARIES, type Dictionary } from "@/lib/i18n/dictionaries";

export type Lang = "uz" | "en";

export const LANG_COOKIE = "sirius-lang";
export const DEFAULT_LANG: Lang = "uz";
/** One year, in seconds. */
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLang(value: unknown): value is Lang {
  return value === "uz" || value === "en";
}

/** The dictionary for a language. Falls back to Uzbek. */
export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang] ?? DICTIONARIES.uz;
}

/**
 * Fill `{name}` placeholders in a dictionary string.
 *
 * `fill(t.dictionary.hintOff, { count: 12 })` → "12 ta so'zni ochish uchun…".
 * Unknown placeholders are left alone rather than replaced with "undefined", so
 * a typo shows up as `{cout}` on screen instead of silently disappearing.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export type { Dictionary };
