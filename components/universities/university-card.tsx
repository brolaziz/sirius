"use client";

/**
 * One university, as a card in the explorer.
 *
 * Three bands:
 *   1. a full-width campus photo with the name on a frosted plate over it;
 *   2. the acceptance rate as an arc, because "how many get in" is a proportion
 *      and a proportion should look like one;
 *   3. the two score bars a student compares against their own, plus cost.
 *
 * ABOUT THE PHOTO
 * `university.imageUrl` is used when we hold a licensed photo. Otherwise the
 * card falls back to a generic campus shot chosen deterministically from the
 * name (`coverPhoto`), sitting on that university's own gradient so the image
 * has something to fade from while it loads. Those fallbacks are stock, and the
 * card says so — nobody should read a photo of some other campus as this one.
 *
 * The SAT pill is coloured against the student's own score when they have
 * entered one, which turns the grid into an answer to "where can I actually
 * apply?" rather than a table to compare by hand.
 *
 * The card carries `data-uni-card` so the explorer can cascade a whole grid of
 * them with one GSAP tween. Hover and press stay in CSS: a lift does not need a
 * timeline.
 */

import Image from "next/image";
import { Star } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import {
  TONES,
  coverGradient,
  coverPhoto,
  toneForAcceptance,
  toneForRequirement,
  type Tone,
} from "@/lib/viz";
import type { UniversityView } from "@/components/universities/university-explorer";

/** `0.043` -> `"4.3%"`. */
export function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatTuition(amount: number | null): string {
  if (amount === null) return "—";
  return `$${amount.toLocaleString("en-US")}`;
}

/** Up to two initials, skipping the small words in a name. */
export function monogram(name: string): string {
  const skip = new Set(["of", "the", "and", "at", "for", "de", "du", "in"]);
  return name
    .split(/\s+/)
    .filter((word) => word.length > 0 && !skip.has(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: Tone;
}) {
  return (
    <div className={cn("rounded-xl px-3 py-2.5", TONES[tone].badge)}>
      <p className="text-[11px] font-medium opacity-80">{label}</p>
      <p className="mt-0.5 text-base font-extrabold tnum">{value}</p>
    </div>
  );
}

interface UniversityCardProps {
  university: UniversityView;
  isShortlisted: boolean;
  onOpen: () => void;
  onToggleShortlist: () => void;
  /** The student's own SAT score, when they have entered one. */
  myScore: number | null;
}

export function UniversityCard({
  university,
  isShortlisted,
  onOpen,
  onToggleShortlist,
  myScore,
}: UniversityCardProps) {
  const { t } = useT();

  const cover = coverGradient(university.name);
  const photo = university.imageUrl ?? coverPhoto(university.name, 800);
  const isStockPhoto = university.imageUrl === null;

  const acceptanceTone = toneForAcceptance(university.acceptanceRate);
  const satTone = toneForRequirement(university.minSat, myScore);
  const location =
    [university.city, university.country].filter(Boolean).join(", ") || "—";

  return (
    <article
      data-uni-card
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-card-hover"
    >
      {/* Cover */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={university.name}
        className="relative h-44 shrink-0 overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        style={{
          backgroundImage: `linear-gradient(135deg, ${cover.from}, ${cover.to})`,
        }}
      >
        <Image
          src={photo}
          alt=""
          fill
          sizes="(min-width: 1280px) 24rem, (min-width: 640px) 45vw, 92vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* The scrim that keeps white text readable over any photograph. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/25 to-transparent"
        />

        {university.worldRanking && (
          <span className="absolute top-3 left-3 rounded-full glass-dark px-2.5 py-1 text-[11px] font-semibold text-white tnum">
            #{university.worldRanking}
          </span>
        )}

        {isStockPhoto && (
          <span className="absolute top-3 right-14 rounded-full glass-dark px-2 py-1 text-[10px] font-medium text-white/80">
            {t.uni.stockPhoto}
          </span>
        )}

        {/* Glass name plate */}
        <span className="absolute inset-x-3 bottom-3 block rounded-xl glass-dark p-3">
          <span className="flex items-center gap-2.5">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-extrabold text-white">
              {monogram(university.name)}
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm leading-snug font-bold text-white">
                {university.name}
              </span>
              <span className="mt-0.5 block truncate text-xs text-white/80">
                {location}
              </span>
            </span>
          </span>
        </span>
      </button>

      {/*
       * The shortlist button sits outside the cover button rather than inside
       * it: a button nested in a button is invalid HTML, and browsers resolve
       * that by dropping one of them.
       */}
      <button
        type="button"
        onClick={onToggleShortlist}
        aria-pressed={isShortlisted}
        aria-label={fill(
          isShortlisted ? t.uni.removeFromShortlist : t.uni.addNamed,
          { name: university.name },
        )}
        className="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-full glass-dark text-white outline-none transition-transform duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/80 active:scale-90"
      >
        <Star
          className={cn(
            "size-[18px] transition-colors",
            isShortlisted && "fill-warning text-warning",
          )}
        />
      </button>

      {/* Numbers */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={
              university.acceptanceRate === null
                ? 0
                : university.acceptanceRate * 100
            }
            size={58}
            thickness={6}
            color={TONES[acceptanceTone].cssVar}
          >
            <span
              className={cn(
                "text-[13px] font-extrabold tnum",
                TONES[acceptanceTone].text,
              )}
            >
              {university.acceptanceRate === null
                ? "—"
                : `${Math.round(university.acceptanceRate * 100)}%`}
            </span>
          </ProgressRing>

          <div className="min-w-0">
            <p className="text-sm font-semibold">{t.uni.acceptanceRate}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {fill(t.uni.acceptanceBody, {
                rate: formatRate(university.acceptanceRate),
              })}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatPill
            label={t.uni.sat}
            value={university.minSat ?? "—"}
            tone={satTone}
          />
          <StatPill
            label={t.uni.ielts}
            value={university.minIelts ?? "—"}
            tone="violet"
          />
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
          <div>
            <p className="text-[11px] text-muted-foreground">{t.uni.tuition}</p>
            <p className="text-sm font-bold tnum">
              {formatTuition(university.tuitionUsd)}
            </p>
          </div>

          {university.meetsFullNeed && (
            <span className="rounded-full bg-viz-emerald-soft px-2.5 py-1 text-[11px] font-semibold text-viz-emerald">
              {t.uni.fullNeed}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
