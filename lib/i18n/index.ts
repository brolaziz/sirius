/**
 * Language selection, server side.
 *
 * Uzbek is the default and always wins on a first visit — no `Accept-Language`
 * sniffing. A student in Tashkent whose browser was installed in English would
 * otherwise land on the English site, which is exactly the case this product
 * exists to fix. The choice, once made, lives in a cookie so the server can
 * render the right language in the first byte instead of flashing one language
 * and swapping to the other after hydration.
 *
 * The cookie is deliberately not `httpOnly`: the switcher writes it from the
 * client and then asks the router to refresh.
 *
 * Import from `@/lib/i18n/config` in client components — this module pulls in
 * `next/headers` and is server-only.
 */

import { cookies } from "next/headers";

import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from "@/lib/i18n/config";

export * from "@/lib/i18n/config";

/**
 * The active language, read on the server.
 *
 * Reading a cookie opts the route out of static rendering, which is why this is
 * only called from layouts that are dynamic anyway (both call Clerk's `auth()`),
 * and never from `/design-system`.
 */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}
