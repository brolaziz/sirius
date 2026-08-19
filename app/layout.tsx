/**
 * Root layout.
 *
 * Providers are mounted once, here:
 *   • `LangProvider`     — the dictionary for the whole tree, chosen on the
 *                          server from a cookie so the first paint is already
 *                          in the right language.
 *   • `TooltipProvider`  — required by shadcn's tooltip; the bilingual
 *                          dictionary uses tooltips heavily, so it lives at the
 *                          root rather than being re-mounted per page.
 *   • `Toaster`          — sonner, for save/import confirmations.
 *
 * Auth.js needs no provider here: sessions are read on the server with
 * `auth()`, and the two client components that act on them post to Server
 * Actions instead of holding a session in React state.
 */

import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Mono, Figtree } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { LangProvider } from "@/components/i18n/lang-provider";
import { getDictionary, getLang } from "@/lib/i18n";

import "./globals.css";

/*
 * Three typefaces, three jobs. See the typography block in globals.css for the
 * reasoning; the variables declared here are what those tokens resolve to.
 *
 * Only the weights actually used are requested, so the payload stays small.
 */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sirius — Digital SAT prep & university admissions",
    template: "%s · Sirius",
  },
  description:
    "Practice the Digital SAT in a faithful test-day simulator, translate any " +
    "English word into Uzbek as you read, and track your university " +
    "applications — all in one place.",
  applicationName: "Sirius",
  keywords: [
    "Digital SAT",
    "SAT practice test",
    "Bluebook",
    "university admissions",
    "Uzbek",
    "IELTS",
  ],
  openGraph: {
    title: "Sirius — Digital SAT prep & university admissions",
    description:
      "A faithful Digital SAT simulator, an English–Uzbek dictionary built into " +
      "every passage, and your whole application list in one place.",
    siteName: "Sirius",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  /*
   * Language is resolved here, once, for the whole tree: the cookie decides,
   * and Uzbek wins when there is no cookie. Doing it in the root layout is what
   * lets `<html lang>` and every string below it agree on the first byte.
   */
  const lang = await getLang();
  const dictionary = getDictionary(lang);

  /*
   * Two attributes on <html> worth knowing about:
   *
   * `suppressHydrationWarning` — browser extensions (password managers,
   * dark-mode injectors, Grammarly) routinely stamp attributes onto <html> and
   * <body> before React hydrates. The flag is one element deep: it makes React
   * accept the DOM for that tag alone and does not silence mismatches below it.
   *
   * `data-motion="full"` — hard-coded, with no way for a visitor to turn it
   * off: the motion is the product's character here. The attribute drives one
   * CSS guard (globals.css) and one JS check (`prefersReducedMotion`), so
   * changing this single value to "system" hands the decision back to the
   * operating system without touching another file.
   */
  return (
    <html
      lang={lang}
      data-motion="full"
      className={`${bricolage.variable} ${figtree.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <LangProvider lang={lang} dictionary={dictionary}>
          <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
          <Toaster position="bottom-right" richColors />
        </LangProvider>
      </body>
    </html>
  );
}
