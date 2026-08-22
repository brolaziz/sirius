/**
 * One university, in full.
 *
 * The explorer's dialog is a quick look while scanning a grid; this is the page
 * a student sends to a parent. It leads with the one comparison that decides
 * whether the rest of the page is worth reading — their score against this
 * university's — and it hedges that comparison honestly when either number is
 * missing.
 *
 * Everything below the fold is the same data the dialog shows, plus the
 * admissions outcomes grid, which is too much to open over a list.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  GraduationCap,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdmissionsHeatmap,
  type HeatmapOutcome,
} from "@/components/universities/admissions-heatmap";
import { ShortlistButton } from "@/components/universities/shortlist-button";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { getLatestScore } from "@/lib/queries/score";
import { getDictionary, getLang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/config";
import { compareScore, satBenchmark } from "@/lib/universities";
import { coverGradient, coverPhoto } from "@/lib/viz";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "University",
};

export default async function UniversityPage({
  params,
}: PageProps<"/universities/[universityId]">) {
  if (!isDatabaseConfigured()) notFound();

  const { universityId } = await params;
  const userId = await getCurrentUserId();
  const lang = await getLang();
  const t = getDictionary(lang);

  const university = await prisma.university.findUnique({
    where: { id: universityId },
    include: {
      applicants: {
        orderBy: { satScore: "asc" },
        select: {
          id: true,
          status: true,
          satScore: true,
          gpaUnweighted: true,
          year: true,
          isSample: true,
        },
      },
    },
  });

  if (!university) notFound();

  const [shortlisted, myScore] = await Promise.all([
    userId
      ? prisma.universityShortlistEntry.findFirst({
          where: { userId, universityId },
          select: { id: true },
        })
      : null,
    userId ? getLatestScore(userId) : null,
  ]);

  const benchmark = satBenchmark(university);
  const comparison = compareScore(myScore, benchmark);

  const description =
    (lang === "uz" ? university.descriptionUz : null) ?? university.description;
  const majors =
    lang === "uz" && university.popularMajorsUz.length > 0
      ? university.popularMajorsUz
      : university.popularMajors;
  const looksFor =
    (lang === "uz" ? university.studentProfileUz : null) ??
    university.studentProfile;

  const location = [university.city, university.state, university.country]
    .filter(Boolean)
    .join(", ");

  const gradient = coverGradient(university.name);

  const outcomes: HeatmapOutcome[] = university.applicants.map((row) => ({
    id: row.id,
    status: row.status,
    satScore: row.satScore,
    gpaUnweighted: row.gpaUnweighted,
    year: row.year,
    isSample: row.isSample,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/universities">
            <ArrowLeft className="size-4" />
            {t.app.universities}
          </Link>
        </Button>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <div
          className="relative h-40 sm:h-56"
          style={{
            backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          }}
        >
          {university.imageUrl ? (
            <Image
              src={university.imageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 60rem, 100vw"
              className="object-cover"
            />
          ) : (
            <Image
              src={coverPhoto(university.name, 1200)}
              alt=""
              fill
              sizes="(min-width: 1024px) 60rem, 100vw"
              className="object-cover opacity-90"
            />
          )}
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl leading-[1.05] font-extrabold tracking-tightest text-balance sm:text-4xl">
                {university.name}
              </h1>
              {location && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {location}
                </p>
              )}
            </div>

            {university.worldRanking !== null && (
              <Badge variant="secondary">
                {fill(t.uni.rankingBadge, { rank: university.worldRanking })}
              </Badge>
            )}
          </div>

          {/* The comparison this page exists for. */}
          <ScoreVerdictPanel comparison={comparison} t={t} />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {userId && (
              <ShortlistButton
                universityId={university.id}
                isShortlisted={shortlisted !== null}
              />
            )}

            {university.websiteUrl && (
              <Button asChild variant="outline" size="lg" className="h-11">
                <a
                  href={university.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.uni.officialSite}
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* The numbers */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<GraduationCap className="size-5" />}
          label={t.uni.acceptanceRate}
          value={
            university.acceptanceRate === null
              ? null
              : `${Math.round(university.acceptanceRate * 100)}%`
          }
          empty={t.uni.noData}
        />
        <Stat
          icon={<GraduationCap className="size-5" />}
          label={t.uni.satBenchmark}
          value={benchmark === null ? null : String(benchmark)}
          empty={t.uni.noSatRequirement}
        />
        <Stat
          icon={<Wallet className="size-5" />}
          label={t.uni.tuition}
          value={
            university.tuitionUsd === null
              ? null
              : `$${university.tuitionUsd.toLocaleString("en-US")}`
          }
          empty={t.uni.noData}
        />
        <Stat
          icon={<Users className="size-5" />}
          label={t.uni.students}
          value={
            university.studentSize === null
              ? null
              : university.studentSize.toLocaleString("en-US")
          }
          empty={t.uni.noData}
        />
      </section>

      {description && (
        <section className="rounded-2xl bg-card p-6 shadow-card sm:p-7">
          <p className="text-base leading-relaxed text-pretty">{description}</p>
        </section>
      )}

      {(majors.length > 0 || looksFor) && (
        <section className="grid gap-5 lg:grid-cols-2">
          {majors.length > 0 && (
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <h2 className="text-base font-bold tracking-tight">
                {t.uni.majors}
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {majors.map((major) => (
                  <li key={major}>
                    <span className="inline-flex rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium">
                      {major}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {looksFor && (
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <h2 className="text-base font-bold tracking-tight">
                {t.uni.profile}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {looksFor}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Reported outcomes */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t.uni.outcomesSection}
        </h2>
        <div className="mt-5">
          <AdmissionsHeatmap outcomes={outcomes} myScore={myScore} t={t} />
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * "Your score is 120 points below their average."
 *
 * Every branch of this is a different sentence rather than one sentence with a
 * number swapped in, because "we do not know your score" and "they do not
 * publish one" are different facts and a student needs to know which applies.
 */
function ScoreVerdictPanel({
  comparison,
  t,
}: {
  comparison: ReturnType<typeof compareScore>;
  t: Dictionary;
}) {
  const { verdict, difference, myScore, benchmark } = comparison;

  const tone =
    verdict === "above"
      ? "bg-viz-emerald-soft text-viz-emerald"
      : verdict === "below"
        ? "bg-viz-amber-soft text-viz-amber"
        : verdict === "level"
          ? "bg-brand-50 text-primary"
          : "bg-muted text-muted-foreground";

  const message =
    verdict === "no-score"
      ? t.uni.verdictNoScore
      : verdict === "no-benchmark"
        ? t.uni.verdictNoBenchmark
        : verdict === "level"
          ? fill(t.uni.verdictLevel, { score: myScore ?? 0 })
          : fill(
              verdict === "above" ? t.uni.verdictAbove : t.uni.verdictBelow,
              { score: myScore ?? 0, difference, benchmark: benchmark ?? 0 },
            );

  return (
    <div className={cn("mt-6 rounded-xl px-4 py-3.5 text-sm", tone)}>
      <p className="font-medium">{message}</p>
      {(verdict === "above" || verdict === "below" || verdict === "level") && (
        <p className="mt-1 text-xs opacity-80">{t.uni.verdictNote}</p>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  empty,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  empty: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-card">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-primary">
        {icon}
      </span>

      {value === null ? (
        <p className="mt-6 text-base font-medium text-muted-foreground">
          {empty}
        </p>
      ) : (
        <p className="mt-6 text-2xl font-extrabold tracking-tightest tabular-nums">
          {value}
        </p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
