"use client";

/**
 * Reported admissions outcomes, filterable.
 *
 * Filtering happens in the browser over a list the server already sent, the
 * same call the university explorer makes and for the same reason: at this size
 * a keystroke should not cost a round trip. If the table ever holds tens of
 * thousands of decisions, this moves to `searchParams` and a server query.
 *
 * WHAT A ROW IS
 * A decision, not a person, and never a name. `applicantKey` is a pseudonymous
 * handle that stitches one applicant's decisions together — "the person who got
 * into Yale was rejected by Harvard" — without identifying them. Rows shipped
 * as demonstration data are badged, because a made-up outcome that looks like a
 * real one is the most misleading thing this page could show.
 */

import * as React from "react";
import Link from "next/link";
import { Filter, Info, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/lib/generated/prisma/enums";

export interface ApplicantCard {
  id: string;
  applicantKey: string;
  status: ApplicationStatus;
  year: number | null;
  major: string | null;
  satScore: number | null;
  gpa: number | null;
  isSample: boolean;
  universityId: string;
  universityName: string;
}

type StatusFilter = ApplicationStatus | "ALL";

export function ApplicationsBrowser({
  applicants,
  similar,
  myScore,
}: {
  applicants: ApplicantCard[];
  /** Closest to this student's own numbers. Empty when we cannot say. */
  similar: ApplicantCard[];
  myScore: number | null;
}) {
  const { t } = useT();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("ALL");

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return applicants.filter((applicant) => {
      if (status !== "ALL" && applicant.status !== status) return false;
      if (!needle) return true;

      return [applicant.universityName, applicant.major ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [applicants, query, status]);

  const statusLabels: Record<StatusFilter, string> = {
    ALL: t.applications.statusAll,
    ACCEPTED: t.uni.accepted,
    REJECTED: t.uni.rejected,
    WAITLISTED: t.uni.waitlisted,
  };

  return (
    <div className="space-y-10">
      {/* Applicants like you */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t.applications.likeYou}
        </h2>

        {similar.length === 0 ? (
          <p className="mt-3 max-w-2xl rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            {myScore === null
              ? t.applications.likeYouNoScore
              : t.applications.likeYouNoData}
          </p>
        ) : (
          <>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {fill(t.applications.likeYouBody, { score: myScore ?? 0 })}
            </p>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((applicant) => (
                <li key={applicant.id}>
                  <ApplicantTile applicant={applicant} t={t} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Everything */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t.applications.allTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {fill(t.applications.counted, {
                shown: visible.length,
                total: applicants.length,
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.applications.searchPlaceholder}
                // `h-11`, not a halo: `<input>` is a replaced element and does
                // not render `::after`, so the only way this reaches 44 is to
                // be 44.
                className="h-11 w-56 pl-9"
                aria-label={t.applications.searchPlaceholder}
              />
            </div>

            <Select
              value={status}
              onValueChange={(value) => setStatus(value as StatusFilter)}
            >
              <SelectTrigger className="h-10 w-44" aria-label={t.applications.status}>
                <Filter className="size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["ALL", "ACCEPTED", "WAITLISTED", "REJECTED"] as const).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {statusLabels[value]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <h3 className="text-base font-semibold">
              {applicants.length === 0
                ? t.applications.empty
                : t.applications.noMatch}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {applicants.length === 0
                ? t.applications.emptyBody
                : t.applications.noMatchBody}
            </p>
          </div>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((applicant) => (
              <li key={applicant.id}>
                <ApplicantTile applicant={applicant} t={t} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const STATUS_TONE: Record<ApplicationStatus, string> = {
  ACCEPTED: "bg-viz-emerald-soft text-viz-emerald",
  REJECTED: "bg-viz-rose-soft text-viz-rose",
  WAITLISTED: "bg-viz-amber-soft text-viz-amber",
};

function ApplicantTile({
  applicant,
  t,
}: {
  applicant: ApplicantCard;
  t: ReturnType<typeof useT>["t"];
}) {
  const statusLabel =
    applicant.status === "ACCEPTED"
      ? t.uni.accepted
      : applicant.status === "REJECTED"
        ? t.uni.rejected
        : t.uni.waitlisted;

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl bg-card p-5 shadow-card">
      <div>
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/universities/${applicant.universityId}`}
            className="min-w-0 text-sm font-semibold hover:underline"
          >
            {applicant.universityName}
          </Link>

          <span
            className={cn(
              "shrink-0 rounded-lg px-2 py-1 text-xs font-medium",
              STATUS_TONE[applicant.status],
            )}
          >
            {statusLabel}
          </span>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {applicant.applicantKey}
          {applicant.year !== null && ` · ${applicant.year}`}
          {applicant.major && ` · ${applicant.major}`}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex gap-4 text-sm tabular-nums">
          <span>
            <span className="block text-xs text-muted-foreground">SAT</span>
            {applicant.satScore ?? "—"}
          </span>
          <span>
            <span className="block text-xs text-muted-foreground">GPA</span>
            {applicant.gpa ?? "—"}
          </span>
        </div>

        {applicant.isSample && (
          <Badge variant="secondary" className="gap-1">
            <Info className="size-3" />
            {t.uni.sampleAll}
          </Badge>
        )}
      </div>
    </article>
  );
}
