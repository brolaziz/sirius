"use client";

/**
 * The university detail view.
 *
 * Opening a card is the moment a student decides whether to spend three months
 * on an application, so this is not a tooltip with a website link — it answers
 * the three questions that decide it:
 *
 *   1. Can I get in?      admission requirements, against their own score
 *   2. Can I study what I want?   the programmes this place is known for
 *   3. What do they want from me? the profile the admissions office rewards
 *
 * A Dialog rather than a Sheet: this is a decision, not a side note, and a
 * centred modal on a dimmed page is the shape that says so. It scrolls inside
 * itself at 85dvh so a long profile never pushes the actions off screen.
 *
 * Motion: the dialog's own scale-and-fade comes from the shadcn primitive, and
 * GSAP cascades the sections behind it once it is open. The sections wait for
 * the dialog to be present in the DOM — `open` is the dependency, not a
 * one-shot mount effect — because Radix mounts the content lazily.
 */

import * as React from "react";
import Image from "next/image";
import { ExternalLink, Star } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pressable } from "@/components/motion/pressable";
import { useT } from "@/components/i18n/lang-provider";
import { DUR, EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { TONES, coverGradient, coverPhoto, toneForRequirement } from "@/lib/viz";
import {
  formatRate,
  formatTuition,
  monogram,
} from "@/components/universities/university-card";
import type { UniversityView } from "@/components/universities/university-explorer";

/** One number in the requirements grid. */
function Requirement({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className={cn("rounded-xl px-4 py-3", TONES[tone].badge)}>
      <p className="text-[11px] font-medium opacity-80">{label}</p>
      <p className="mt-1 text-xl font-extrabold tnum">{value}</p>
    </div>
  );
}

export function UniversityDetail({
  university,
  isShortlisted,
  isPending,
  myScore,
  onClose,
  onToggleShortlist,
}: {
  /** Null closes the dialog. */
  university: UniversityView | null;
  isShortlisted: boolean;
  isPending: boolean;
  myScore: number | null;
  onClose: () => void;
  onToggleShortlist: () => void;
}) {
  const { t, lang } = useT();
  const ref = React.useRef<HTMLDivElement>(null);
  const open = university !== null;

  useGSAP(
    () => {
      if (!open || prefersReducedMotion()) return;

      gsap.from(ref.current?.querySelectorAll("[data-detail-section]") ?? [], {
        opacity: 0,
        y: 18,
        duration: DUR.base,
        ease: EASE,
        stagger: 0.08,
        delay: 0.1,
      });
    },
    { scope: ref, dependencies: [open, university?.id] },
  );

  if (!university) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent className="sr-only" />
      </Dialog>
    );
  }

  const photo = university.imageUrl ?? coverPhoto(university.name, 1200);
  const cover = coverGradient(university.name);
  const location =
    [university.city, university.country].filter(Boolean).join(", ") || "—";

  /*
   * Uzbek content falls back to the English column when a row has not been
   * translated yet — an empty section would look like the university has no
   * programmes rather than like our data is thin.
   */
  const isUz = lang === "uz";
  const description =
    (isUz ? university.descriptionUz : university.description) ??
    university.description;
  const studentProfile =
    (isUz ? university.studentProfileUz : university.studentProfile) ??
    university.studentProfile;
  const majors =
    isUz && university.popularMajorsUz.length > 0
      ? university.popularMajorsUz
      : university.popularMajors;
  const activities =
    isUz && university.extracurricularsUz.length > 0
      ? university.extracurricularsUz
      : university.extracurriculars;

  const deadline = university.applicationDeadline
    ? new Intl.DateTimeFormat(isUz ? "uz-UZ" : "en-GB", {
        day: "numeric",
        month: "long",
      }).format(new Date(university.applicationDeadline))
    : null;

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[88dvh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <div ref={ref}>
          {/* Cover */}
          <div
            className="relative h-44 w-full shrink-0 overflow-hidden sm:h-52"
            style={{
              backgroundImage: `linear-gradient(135deg, ${cover.from}, ${cover.to})`,
            }}
          >
            <Image
              src={photo}
              alt=""
              fill
              sizes="(min-width: 640px) 42rem, 100vw"
              className="object-cover"
              priority
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/35 to-transparent"
            />

            {university.imageUrl === null && (
              <span className="absolute top-3 left-3 rounded-full glass-dark px-2 py-1 text-[10px] font-medium text-white/80">
                {t.uni.stockPhoto}
              </span>
            )}

            <DialogHeader className="absolute inset-x-4 bottom-4 space-y-0 text-left">
              <div className="flex items-end gap-3 rounded-xl glass-dark p-3.5">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-extrabold text-white">
                  {monogram(university.name)}
                </span>

                <div className="min-w-0">
                  <DialogTitle className="text-lg leading-tight font-extrabold text-white sm:text-xl">
                    {university.name}
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 truncate text-xs text-white/80">
                    {location}
                    {university.worldRanking
                      ? ` · ${t.uni.ranking} #${university.worldRanking}`
                      : ""}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-7 p-6 sm:p-8">
            {description && (
              <p
                data-detail-section
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {description}
              </p>
            )}

            {/* 1 · Admission requirements */}
            <section data-detail-section>
              <h3 className="text-base font-bold tracking-tight">
                {t.uni.requirements}
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Requirement
                  label={t.uni.sat}
                  value={university.minSat ?? t.uni.noData}
                  tone={toneForRequirement(university.minSat, myScore)}
                />
                <Requirement
                  label={t.uni.ielts}
                  value={university.minIelts ?? t.uni.noData}
                  tone="violet"
                />
                <Requirement
                  label={t.uni.toefl}
                  value={university.minToefl ?? t.uni.noData}
                  tone="violet"
                />
                {university.satMath !== null && (
                  <Requirement
                    label={t.uni.satMath}
                    value={university.satMath}
                    tone="brand"
                  />
                )}
                {university.satReading !== null && (
                  <Requirement
                    label={t.uni.satReading}
                    value={university.satReading}
                    tone="brand"
                  />
                )}
                <Requirement
                  label={t.uni.gpa}
                  value={
                    university.averageGpa
                      ? university.averageGpa.toFixed(2)
                      : t.uni.noData
                  }
                  tone="amber"
                />
                <Requirement
                  label={t.uni.acceptanceRate}
                  value={formatRate(university.acceptanceRate)}
                  tone="rose"
                />
                <Requirement
                  label={t.uni.tuition}
                  value={formatTuition(university.tuitionUsd)}
                  tone="sky"
                />
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t.uni.requirementsNote}
                {university.dataSource === "scorecard" && (
                  <> {t.uni.sourceScorecard}</>
                )}
              </p>
            </section>

            {/* 2 · Programmes */}
            {majors.length > 0 && (
              <section data-detail-section>
                <h3 className="text-base font-bold tracking-tight">
                  {t.uni.majors}
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {majors.map((major) => (
                    <li
                      key={major}
                      className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
                    >
                      {major}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 3 · What they look for */}
            {(studentProfile || activities.length > 0) && (
              <section data-detail-section>
                <h3 className="text-base font-bold tracking-tight">
                  {t.uni.profile}
                </h3>

                {studentProfile && (
                  <p className="mt-3 border-l-2 border-magenta pl-4 text-sm leading-relaxed text-muted-foreground">
                    {studentProfile}
                  </p>
                )}

                {activities.length > 0 && (
                  <>
                    <p className="mt-5 text-xs font-semibold text-muted-foreground">
                      {t.uni.activities}
                    </p>
                    <ul className="mt-2.5 flex flex-wrap gap-2">
                      {activities.map((activity) => (
                        <li
                          key={activity}
                          className="rounded-full bg-magenta-soft px-3 py-1.5 text-xs font-semibold text-magenta-ink"
                        >
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            )}

            {university.meetsFullNeed && (
              <section
                data-detail-section
                className="rounded-xl bg-viz-emerald-soft p-4"
              >
                <p className="text-sm font-bold text-viz-emerald">
                  {t.uni.fullNeedTitle}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t.uni.fullNeedBody}
                </p>
              </section>
            )}

            <div
              data-detail-section
              className="flex flex-wrap items-center gap-3 border-t border-border pt-6"
            >
              <Pressable disabled={isPending}>
                <Button
                  size="lg"
                  className="h-11 rounded-lg shadow-glow"
                  onClick={onToggleShortlist}
                  disabled={isPending}
                >
                  <Star className={cn("size-4", isShortlisted && "fill-current")} />
                  {isShortlisted ? t.uni.shortlisted : t.uni.addToShortlist}
                </Button>
              </Pressable>

              {university.websiteUrl && (
                <Pressable>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-11 rounded-lg"
                  >
                    <a
                      href={university.websiteUrl}
                      target="_blank"
                      // `noreferrer` alongside `noopener`: without it the
                      // destination learns which page linked to it.
                      rel="noopener noreferrer"
                    >
                      {t.uni.officialSite}
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </Pressable>
              )}

              {deadline && (
                <span className="ml-auto text-xs font-semibold text-muted-foreground">
                  {t.uni.deadline}: {deadline}
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
