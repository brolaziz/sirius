"use client";

/**
 * One university, as a card in the explorer.
 *
 * THE WHOLE CARD IS THE LINK.
 * It opens `/universities/[universityId]`. It used to be the cover photo alone,
 * and the rest of the card — the name, the acceptance arc, the score pills —
 * was dead to a tap, which is the opposite of how a card reads: everything
 * inside a bordered rectangle looks like one target. There is no quick-view
 * dialog any more either; the page holds the same content plus the admissions
 * outcomes, and two doors into one room is one door too many.
 *
 * The shortlist star is a **sibling** of that link, not a child of it. A button
 * inside a link is invalid HTML and browsers resolve it by dropping one of the
 * two; keeping them siblings — the star positioned over the card at `z-10` — is
 * what lets a tap on the star save the university without also navigating.
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
 * The SAT figure is presented neutrally. It is the average score of admitted
 * students, not a bar to clear, and nothing on this card is coloured or hidden
 * according to whether a student's score reaches it.
 *
 * The card carries `data-uni-card` so the explorer can cascade a whole grid of
 * them with one GSAP tween. Hover and press stay in CSS: a lift does not need a
 * timeline.
 */

import Image from "next/image";
import Link from "next/link";
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
  onToggleShortlist: () => void;
}

export function UniversityCard({
  university,
  isShortlisted,
  onToggleShortlist,
}: UniversityCardProps) {
  const { t } = useT();

  const cover = coverGradient(university.name);
  const photo = university.imageUrl ?? coverPhoto(university.name, 800);
  const isStockPhoto = university.imageUrl === null;

  const acceptanceTone = toneForAcceptance(university.acceptanceRate);
  const location =
    [university.city, university.country].filter(Boolean).join(", ") || "—";

  return (
    <article
      data-uni-card
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-card-hover"
    >
      {/*
       * The link wraps every band of the card. `flex-1` so it fills the article
       * even when a neighbouring card is taller, which is what makes the dead
       * space at the bottom of a short card clickable too.
       */}
      <Link
        href={`/universities/${university.id}`}
        aria-label={university.name}
        className="flex flex-1 flex-col rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {/* Cover */}
        <div
          className="relative h-44 shrink-0 overflow-hidden"
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

          {/*
            12px, not 10px. This is a disclosure that the photograph is not the
            real university — the layout audit found it was the smallest text
            anywhere in the product, which is precisely backwards for a label
            whose job is to stop someone believing something untrue.
          */}
          {isStockPhoto && (
            <span className="absolute top-3 right-14 rounded-full glass-dark px-2 py-1 text-xs font-medium text-white/80">
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
        </div>

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
            {/*
              Neutral, like every other figure on this card.

              This pill used to be coloured against the student's own score —
              green at or above, amber within 60 points, red below. A red badge
              does not hide a university; it tells the student not to bother, and
              it says so without a sentence anyone can argue with. Admissions is
              not a threshold, so the number is presented as what it is.
            */}
            <StatPill
              label={t.uni.sat}
              value={university.minSat ?? "—"}
              tone="violet"
            />
            <StatPill
              label={t.uni.ielts}
              value={university.minIelts ?? "—"}
              tone="violet"
            />
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
            <div>
              <p className="text-[11px] text-muted-foreground">
                {t.uni.tuition}
              </p>
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
      </Link>

      {/*
       * The shortlist star, a sibling of the link rather than a child of it:
       * a button inside a link is invalid HTML, and browsers resolve that by
       * dropping one of them. Sitting over the card at `z-10`, it takes the
       * tap itself — nothing has to cancel a navigation that never started.
       */}
      <button
        type="button"
        onClick={onToggleShortlist}
        aria-pressed={isShortlisted}
        aria-label={fill(
          isShortlisted ? t.uni.removeFromShortlist : t.uni.addNamed,
          { name: university.name },
        )}
        /*
         * 36px of glass, 44 to a finger.
         *
         * The card clips (`overflow-hidden`, for the cover photo’s rounded
         * corners), so the halo only works because the button is inset 12px
         * from both edges and the halo reaches 4px — it stays inside the card.
         * Move this button closer to a corner and the halo goes with it: check
         * `scripts/audit-tap-targets.ts` if you do.
         *
         * The 4px it borrows on the other two sides comes off the card link
         * underneath, whose cover band is 176px tall and loses nothing it
         * needs.
         */
        className="tap-target absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-full glass-dark text-white outline-none transition-transform duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/80 active:scale-90"
      >
        <Star
          className={cn(
            "size-[18px] transition-colors",
            isShortlisted && "fill-warning text-warning",
          )}
        />
      </button>
    </article>
  );
}
