/**
 * University explorer page.
 *
 * The server loads the full list and the student's shortlist; filtering, sorting
 * and search happen in the client component. See
 * `components/universities/university-explorer.tsx` for why.
 */

import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

import {
  UniversityExplorer,
  type UniversityView,
} from "@/components/universities/university-explorer";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { getLatestScore } from "@/lib/queries/score";
import { getDictionary, getLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Universities",
};

export default async function UniversitiesPage() {
  const databaseReady = isDatabaseConfigured();
  const userId = databaseReady ? await getCurrentUserId() : null;
  const t = getDictionary(await getLang());

  const [universities, shortlist] = databaseReady
    ? await prisma.$transaction([
        prisma.university.findMany({
          orderBy: [{ worldRanking: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            country: true,
            city: true,
            state: true,
            acceptanceRate: true,
            minSat: true,
            minIelts: true,
            minToefl: true,
            averageGpa: true,
            satMath: true,
            satReading: true,
            studentSize: true,
            dataSource: true,
            description: true,
            descriptionUz: true,
            extracurriculars: true,
            extracurricularsUz: true,
            popularMajors: true,
            popularMajorsUz: true,
            studentProfile: true,
            studentProfileUz: true,
            imageUrl: true,
            tuitionUsd: true,
            meetsFullNeed: true,
            worldRanking: true,
            websiteUrl: true,
            applicationDeadline: true,
          },
        }),
        prisma.universityShortlistEntry.findMany({
          where: { userId: userId ?? "__none__" },
          select: { universityId: true },
        }),
      ])
    : [[], []];

  /*
   * The student's own score, so every card arrives already answering "can I
   * apply here?" instead of waiting to be told what to compare against.
   *
   * A real sitting beats what they told onboarding: the number they typed in a
   * form is a memory, and the number they earned last week is a measurement.
   */
  const measured = userId
    ? await getLatestScore(userId)
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t.pages.uniEyebrow}
        </p>
        <h1 className="mt-2 text-4xl leading-[1.02] font-extrabold tracking-tightest text-balance sm:text-5xl lg:text-6xl">
          {t.pages.uniTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t.pages.uniBody}
        </p>
      </div>

      {universities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <GraduationCap className="size-5" />
          </span>
          <h2 className="mt-5 text-lg font-bold">{t.pages.uniEmptyTitle}</h2>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Seed the starter list with{" "}
            <code className="font-mono text-xs">npm run db:seed</code>, or add
            your own rows to the{" "}
            <code className="font-mono text-xs">universities</code> table.
          </p>
        </div>
      ) : (
        <UniversityExplorer
          universities={universities as UniversityView[]}
          shortlistedIds={shortlist.map((entry) => entry.universityId)}
          initialScore={measured}
        />
      )}
    </div>
  );
}
