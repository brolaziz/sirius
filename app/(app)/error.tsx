"use client";

/**
 * Error boundary for every authenticated route.
 *
 * This is where `requireUserId()` lands when the session cannot be read. The
 * important thing it does is *not redirect*: an unreadable session used to send
 * the visitor to sign-in, sign-in read the session successfully on the retry
 * and sent them back, and the two routes bounced a few times a second.
 *
 * A boundary breaks that cycle. The visitor stays on the page they asked for
 * and gets a button, which is both calmer and quicker than a loop.
 *
 * `reset()` re-renders the segment without a full page load, so a transient
 * database blip clears without losing anything.
 */

import * as React from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pressable } from "@/components/motion/pressable";
import { useT } from "@/components/i18n/lang-provider";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();

  React.useEffect(() => {
    // The overlay hides the real message in production; the console does not.
    console.error("[app] route error:", error);
  }, [error]);

  /*
   * Prisma surfaces connection trouble as `PrismaClientKnownRequestError` /
   * `PrismaClientInitializationError`. Naming that case specifically turns
   * "something went wrong" into advice the reader can act on.
   */
  const isDatabaseError =
    error.name.startsWith("Prisma") ||
    /database|connection|ECONNREFUSED|08P01/i.test(error.message);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-viz-rose-soft text-viz-rose">
        <TriangleAlert className="size-6" />
      </span>

      <h1 className="mt-6 text-2xl font-extrabold tracking-tightest text-balance sm:text-3xl">
        {isDatabaseError ? t.errors.dbTitle : t.errors.genericTitle}
      </h1>

      <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
        {isDatabaseError ? t.errors.dbBody : t.errors.genericBody}
      </p>

      {isDatabaseError && (
        <p className="mt-2 text-xs text-muted-foreground">{t.errors.dbHint}</p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Pressable>
          <Button
            size="lg"
            className="h-11 rounded-lg shadow-glow"
            onClick={reset}
          >
            <RotateCw className="size-4" />
            {t.errors.retry}
          </Button>
        </Pressable>

        <Pressable>
          <Button asChild variant="outline" size="lg" className="h-11 rounded-lg">
            <Link href="/dashboard">{t.errors.backToDashboard}</Link>
          </Button>
        </Pressable>
      </div>

      {error.digest && (
        <p className="mt-8 font-mono text-[11px] text-muted-foreground">
          {error.digest}
        </p>
      )}
    </div>
  );
}
