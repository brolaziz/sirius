/**
 * Reads for the admissions half of the product: reported outcomes, essays and
 * the activity ladder.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THREE TABLES THAT ARE MOSTLY EMPTY, ON PURPOSE
 *
 * `ApplicantProfile`, `Essay` and `ActivityReference` were written before
 * anything read them, and they are still nearly empty. That is a content
 * problem, not a bug, and the screens above these queries say so: an empty
 * outcomes grid says nobody has reported one, not "0% accepted".
 *
 * Nothing here invents a row, and nothing copies one from a competitor. The
 * profiles are meant to come from students submitting their own results, and
 * the demonstration rows that ship with the repository are marked `isSample` so
 * every surface can label them.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { hasPremium } from "@/lib/premium";
import { getLatestScore } from "@/lib/queries/score";
import { rankSimilarProfiles, type ProfileSignals } from "@/lib/admissions";
import type { ApplicationStatus } from "@/lib/generated/prisma/enums";

/* -------------------------------------------------------------------------- */
/* Reported outcomes                                                           */
/* -------------------------------------------------------------------------- */

export interface ApplicantRow extends ProfileSignals {
  id: string;
  applicantKey: string;
  status: ApplicationStatus;
  year: number | null;
  major: string | null;
  isSample: boolean;
  universityId: string;
  universityName: string;
}

export interface ApplicantFilters {
  /** Free text over university name and major. */
  query?: string;
  status?: ApplicationStatus;
  limit?: number;
}

export async function getApplicantProfiles(
  filters: ApplicantFilters = {},
): Promise<ApplicantRow[]> {
  if (!isDatabaseConfigured()) return [];

  const query = filters.query?.trim();

  const rows = await prisma.applicantProfile.findMany({
    where: {
      status: filters.status,
      ...(query
        ? {
            OR: [
              { university: { name: { contains: query, mode: "insensitive" } } },
              { major: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ satScore: "desc" }, { createdAt: "desc" }],
    take: filters.limit ?? 60,
    select: {
      id: true,
      applicantKey: true,
      status: true,
      year: true,
      major: true,
      satScore: true,
      gpaUnweighted: true,
      isSample: true,
      university: { select: { id: true, name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    applicantKey: row.applicantKey,
    status: row.status,
    year: row.year,
    major: row.major,
    satScore: row.satScore,
    gpa: row.gpaUnweighted,
    isSample: row.isSample,
    universityId: row.university.id,
    universityName: row.university.name,
  }));
}

/**
 * The reported outcomes closest to this student's own numbers.
 *
 * Similarity is currently SAT-only, because Sirius does not ask students for a
 * GPA — `profileDistance` handles that by weighing whichever dimensions both
 * sides have, and returns nothing at all for a student with no score yet. That
 * is the honest answer: "applicants like you" needs to know what you are like.
 */
export async function getSimilarApplicants(
  userId: string,
  limit = 12,
): Promise<Array<ApplicantRow & { distance: number }>> {
  if (!isDatabaseConfigured()) return [];

  const [myScore, profiles] = await Promise.all([
    getLatestScore(userId),
    getApplicantProfiles({ limit: 200 }),
  ]);

  if (myScore === null) return [];

  return rankSimilarProfiles({ satScore: myScore, gpa: null }, profiles, limit).map(
    (ranked) => ({ ...ranked.profile, distance: ranked.distance }),
  );
}

/* -------------------------------------------------------------------------- */
/* Essays                                                                      */
/* -------------------------------------------------------------------------- */

export interface EssayCard {
  id: string;
  prompt: string;
  wordCount: number;
  topicTags: string[];
  year: number | null;
  isPremium: boolean;
  isSample: boolean;
  universityName: string | null;
  /** True when this account may read the body. */
  unlocked: boolean;
}

export async function getEssays(userId: string | null): Promise<EssayCard[]> {
  if (!isDatabaseConfigured()) return [];

  const [rows, premium] = await Promise.all([
    prisma.essay.findMany({
      orderBy: [{ createdAt: "desc" }],
      // The body is deliberately absent: a card never needs it, and selecting
      // it here would ship every locked essay to the browser.
      select: {
        id: true,
        prompt: true,
        wordCount: true,
        topicTags: true,
        year: true,
        isPremium: true,
        isSample: true,
        university: { select: { name: true } },
      },
    }),
    hasPremium(userId),
  ]);

  return rows.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    wordCount: row.wordCount,
    topicTags: row.topicTags,
    year: row.year,
    isPremium: row.isPremium,
    isSample: row.isSample,
    universityName: row.university?.name ?? null,
    unlocked: !row.isPremium || premium,
  }));
}

export interface EssayDetail extends EssayCard {
  /** Null when this account may not read it — see `lib/premium.ts`. */
  content: string | null;
}

/**
 * One essay, with its body only if this account may read it.
 *
 * The body is fetched in a second query, after the lock has been checked, so a
 * premium essay is never loaded for an account without access. Same shape as
 * the practice question keys: the way to guarantee something is not sent is not
 * to read it.
 */
export async function getEssay(
  userId: string | null,
  essayId: string,
): Promise<EssayDetail | null> {
  if (!isDatabaseConfigured()) return null;

  const essay = await prisma.essay.findUnique({
    where: { id: essayId },
    select: {
      id: true,
      prompt: true,
      wordCount: true,
      topicTags: true,
      year: true,
      isPremium: true,
      isSample: true,
      university: { select: { name: true } },
    },
  });

  if (!essay) return null;

  const unlocked = !essay.isPremium || (await hasPremium(userId));

  const body = unlocked
    ? await prisma.essay.findUnique({
        where: { id: essayId },
        select: { content: true },
      })
    : null;

  return {
    id: essay.id,
    prompt: essay.prompt,
    wordCount: essay.wordCount,
    topicTags: essay.topicTags,
    year: essay.year,
    isPremium: essay.isPremium,
    isSample: essay.isSample,
    universityName: essay.university?.name ?? null,
    unlocked,
    content: body?.content ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* Activities                                                                  */
/* -------------------------------------------------------------------------- */

export interface ActivityReferenceRow {
  id: string;
  tier: string;
  category: string;
  title: string;
  titleUz: string | null;
  description: string | null;
  descriptionUz: string | null;
  participationRate: number | null;
  order: number;
}

export async function getActivityReferences(): Promise<ActivityReferenceRow[]> {
  if (!isDatabaseConfigured()) return [];

  return prisma.activityReference.findMany({
    orderBy: [{ tier: "asc" }, { order: "asc" }],
    select: {
      id: true,
      tier: true,
      category: true,
      title: true,
      titleUz: true,
      description: true,
      descriptionUz: true,
      participationRate: true,
      order: true,
    },
  });
}

export interface MyActivity {
  id: string;
  position: number;
  title: string;
  organisation: string | null;
  role: string | null;
  description: string | null;
  hoursPerWeek: number | null;
  weeksPerYear: number | null;
}

export async function getMyActivities(userId: string): Promise<MyActivity[]> {
  if (!isDatabaseConfigured()) return [];

  return prisma.userActivity.findMany({
    where: { userId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      position: true,
      title: true,
      organisation: true,
      role: true,
      description: true,
      hoursPerWeek: true,
      weeksPerYear: true,
    },
  });
}
