"use client";

/**
 * Language context for client components.
 *
 * The dictionary is chosen on the server and passed down as a prop, so the
 * first paint is already in the right language — there is no flash of English
 * before Uzbek loads, which is the failure mode of client-only i18n.
 *
 * Switching writes the cookie and calls `router.refresh()`. That re-runs the
 * server components with the new cookie and streams the swapped strings in,
 * without a full page load and without losing scroll position.
 */

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  DEFAULT_LANG,
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  type Dictionary,
  type Lang,
} from "@/lib/i18n/config";

interface LangContextValue {
  lang: Lang;
  t: Dictionary;
  setLang: (next: Lang) => void;
  isSwitching: boolean;
}

const LangContext = React.createContext<LangContextValue | null>(null);

export function LangProvider({
  lang,
  dictionary,
  children,
}: {
  lang: Lang;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSwitching, startTransition] = React.useTransition();

  const setLang = React.useCallback(
    (next: Lang) => {
      // `SameSite=Lax` so the language survives a normal link into the site.
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; SameSite=Lax`;
      document.documentElement.lang = next;
      startTransition(() => router.refresh());
    },
    [router],
  );

  const value = React.useMemo<LangContextValue>(
    () => ({ lang, t: dictionary, setLang, isSwitching }),
    [lang, dictionary, setLang, isSwitching],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/**
 * The dictionary, plus the current language and the switcher.
 *
 * Throws outside a provider rather than falling back silently: a component
 * rendering Uzbek strings on an English page is a bug worth failing loudly for.
 */
export function useT(): LangContextValue {
  const context = React.useContext(LangContext);
  if (!context) {
    throw new Error("useT must be used inside <LangProvider>");
  }
  return context;
}

export { DEFAULT_LANG };
