"use client";

/**
 * Next deadline.
 *
 * The one tile on the dashboard painted in midnight, because it is the one
 * thing that gets worse on its own. Everything else on this page improves when
 * you work on it; a deadline only ever gets closer.
 *
 * The day count is computed on the client from a date the server sent, not
 * rendered on the server: "12 days left" is relative to the *reader's*
 * midnight, and a server in another timezone would be off by one for half the
 * day. `null` until mount, so the server and the first client render agree.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarClock } from "lucide-react";

import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import type { ShortlistedUniversity } from "@/lib/queries/dashboard";

/** Whole days from today to `date`, in the reader's own timezone. */
function daysUntil(date: Date): number {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.round(
    (target.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function DeadlineCard({
  university,
  className,
}: {
  /** The shortlisted university whose deadline comes first, if any has one. */
  university: ShortlistedUniversity | null;
  className?: string;
}) {
  const { t, lang } = useT();
  const deadline = university?.applicationDeadline ?? null;

  /*
   * `useSyncExternalStore` rather than state-in-an-effect: the server snapshot
   * is `null` (so the server renders the date and hydration matches), and the
   * client snapshot is the real day count, which React picks up in the same
   * pass. The store never changes during a session — a countdown that ticks
   * over at midnight while someone is staring at it is not worth a timer — so
   * `subscribe` is a no-op.
   */
  const days = React.useSyncExternalStore(
    () => () => {},
    () => (deadline ? daysUntil(new Date(deadline)) : null),
    () => null,
  );

  const formatted = React.useMemo(() => {
    if (!deadline) return null;
    return new Intl.DateTimeFormat(lang === "uz" ? "uz-UZ" : "en-GB", {
      day: "numeric",
      month: "long",
    }).format(new Date(deadline));
  }, [deadline, lang]);

  return (
    <section
      className={cn(
        "relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-midnight p-6 text-white shadow-card",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-dots-neon opacity-70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-magenta/30 blur-[70px]"
      />

      <div className="relative flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold text-white/80">
          {t.dash.deadline}
        </h2>
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/15">
          <CalendarClock className="size-[18px] text-lime" />
        </span>
      </div>

      {university && deadline ? (
        <div className="relative mt-6">
          <p className="text-4xl leading-none font-extrabold tracking-tightest text-lime tnum">
            {/* Server render shows the date; the day count arrives on mount. */}
            {days === null
              ? formatted
              : days >= 0
                ? fill(t.dash.daysLeft, { count: days })
                : t.dash.daysPassed}
          </p>
          <p className="mt-3 truncate text-sm font-semibold">
            {university.name}
          </p>
          <p className="mt-0.5 text-xs text-white/70">{formatted}</p>

          <Link
            href="/universities"
            className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-lime transition-opacity hover:opacity-80"
          >
            {t.dash.universitiesCta}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      ) : (
        <p className="relative mt-6 text-sm leading-relaxed text-white/70">
          {t.dash.deadlineEmpty}
        </p>
      )}
    </section>
  );
}
