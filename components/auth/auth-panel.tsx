"use client";

/**
 * The sign-in card.
 *
 * One component serves both `/sign-in` and `/sign-up`, because with Google as
 * the only provider they are the same action — Auth.js creates the account on
 * first callback. Only the framing changes: someone arriving from "Start free"
 * is being invited in, someone arriving from "Sign in" is being welcomed back,
 * and pretending those are different flows would mean two buttons that do
 * exactly the same thing.
 *
 * The panel animates in on mount: the card rises, then the button and the small
 * print follow. It is the first authenticated-adjacent screen a visitor sees,
 * so it should feel like the rest of the product rather than like a form.
 */

import * as React from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { GoogleButton } from "@/components/auth/google-button";
import { useT } from "@/components/i18n/lang-provider";
import { DUR, EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

export function AuthPanel({
  mode,
  callbackUrl,
  hasError,
  isConfigured,
}: {
  mode: "sign-in" | "sign-up";
  callbackUrl?: string;
  /** Auth.js bounced back with `?error=` — usually a cancelled consent screen. */
  hasError?: boolean;
  /** False when `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are missing. */
  isConfigured: boolean;
}) {
  const { t } = useT();
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.from(ref.current?.querySelectorAll("[data-auth-step]") ?? [], {
        opacity: 0,
        y: 22,
        duration: DUR.base,
        ease: EASE,
        stagger: 0.09,
      });
    },
    { scope: ref },
  );

  const isSignUp = mode === "sign-up";

  return (
    <div ref={ref} className="w-full max-w-sm">
      <div data-auth-step className="text-center">
        <h1 className="text-3xl leading-[1.05] font-extrabold tracking-tightest text-balance sm:text-4xl">
          {isSignUp ? t.auth.signUpTitle : t.auth.signInTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
          {isSignUp ? t.auth.signUpBody : t.auth.signInBody}
        </p>
      </div>

      {hasError && (
        <div
          data-auth-step
          role="alert"
          className="mt-6 flex gap-3 rounded-xl bg-viz-rose-soft p-4"
        >
          <TriangleAlert className="size-5 shrink-0 text-viz-rose" />
          <div className="min-w-0 text-sm">
            <p className="font-bold text-viz-rose">{t.auth.errorTitle}</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {t.auth.errorBody}
            </p>
          </div>
        </div>
      )}

      <div data-auth-step className="mt-8">
        {isConfigured ? (
          <GoogleButton callbackUrl={callbackUrl} />
        ) : (
          /*
           * The developer's own failure state, not the student's: whoever sees
           * this is the person who can fix it, so it names the exact variables
           * rather than apologising.
           */
          <div className="rounded-xl border border-dashed border-warning/50 bg-warning/10 p-5">
            <p className="text-sm font-bold">{t.auth.setupTitle}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {t.auth.setupBody}
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-foreground/5 p-3 font-mono text-xs leading-relaxed">
              <code>{`AUTH_SECRET=…\nAUTH_GOOGLE_ID=…\nAUTH_GOOGLE_SECRET=…`}</code>
            </pre>
          </div>
        )}
      </div>

      <p
        data-auth-step
        className="mt-6 text-center text-xs leading-relaxed text-muted-foreground"
      >
        {t.auth.terms}
      </p>

      {/*
        The halo on this one grows 13.5px above and below a 17px inline link.
        That is safe because everything it reaches into is text: the terms
        paragraph sits 32px above and is not interactive, and this is the last
        element in the panel. An inline link with an interactive neighbour on
        the line below would need `tap-row` instead — a halo there would let one
        link answer for another.
      */}
      <p data-auth-step className="mt-8 text-center text-sm text-muted-foreground">
        {isSignUp ? t.auth.haveAccount : t.auth.noAccount}{" "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="tap-target font-semibold text-primary underline-offset-4 hover:underline"
        >
          {isSignUp ? t.auth.signInLink : t.auth.createOne}
        </Link>
      </p>
    </div>
  );
}
