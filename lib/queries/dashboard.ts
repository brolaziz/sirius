/**
 * Dashboard data access.
 *
 * One function fetches everything the bento grid needs, in a single round trip
 * (`$transaction` batches the reads). Doing it here rather than in the page
 * keeps the page a layout concern, and means the "no database" fallback lives in
 * exactly one place.
 */

import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getOrCreateCurrentUser } from "@/lib/user";
import { getBankCounts } from "@/lib/queries/practice";
import { mockAvailability } from "@/lib/mock";
import { getCurrentStudyPlan } from "@/lib/queries/study-plan";
import { chooseTodayAction, type TodayAction } from "@/lib/today";
import type {
  RoadmapTask,
  Test,
  TestResult,
  University,
  User,
} from "@/lib/generated/prisma/client";

/** A shortlisted university, trimmed to what the dashboard tile shows. */
export type ShortlistedUniversity = Pick<
  University,
  | "id"
  | "name"
  | "city"
  | "country"
  | "acceptanceRate"
  | "minSat"
  | "worldRanking"
  | "applicationDeadline"
>;

export interface DashboardData {
  todayAction: TodayAction;
  /** False when `DATABASE_URL` is unset — the UI shows setup guidance instead. */
  databaseReady: boolean;
  user: User | null;
  /** Most recent completed result, or null before the first test. */
  latestResult: (TestResult & { test: Pick<Test, "id" | "title" | "type"> }) | null;
  /** Best estimated scaled score achieved so far. */
  bestScaledScore: number | null;
  testsTaken: number;
  /** Accuracy across graded practice and test answers, 0–1. */
  averageAccuracy: number | null;
  roadmapTasks: RoadmapTask[];
  savedWordCount: number;
  shortlistCount: number;
  /**
   * The student's shortlist, soonest deadline first. Capped at four: the tile
   * shows three and says "+N more", and fetching the whole list to render three
   * rows would be wasteful.
   */
  shortlisted: ShortlistedUniversity[];
  /**
   * A published FULL container, available only when the reviewed global bank
   * can fill all four modules.
   */
  featuredTest: Pick<Test, "id" | "title" | "type" | "durationMinutes"> | null;
}

/** The shape returned when there is no database to read from. */
function emptyDashboard(): DashboardData {
  return {
    todayAction: { kind: "setup", href: "/profile" },
    databaseReady: false,
    user: null,
    latestResult: null,
    bestScaledScore: null,
    testsTaken: 0,
    averageAccuracy: null,
    roadmapTasks: [],
    savedWordCount: 0,
    shortlistCount: 0,
    shortlisted: [],
    featuredTest: null,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!isDatabaseConfigured()) return emptyDashboard();

  const user = await getOrCreateCurrentUser();
  if (!user) return { ...emptyDashboard(), databaseReady: true };

  const userId = user.id;

  const [
    latestResult,
    aggregate,
    roadmapTasks,
    savedWordCount,
    shortlistCount,
    shortlistEntries,
    fullTest,
  ] = await prisma.$transaction([
    prisma.testResult.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { test: { select: { id: true, title: true, type: true } } },
    }),
    prisma.testResult.aggregate({
      where: { userId },
      _count: { _all: true },
      _max: { scaledScore: true },
      _sum: { score: true, totalQuestions: true },
    }),
    prisma.roadmapTask.findMany({
      where: { userId },
      orderBy: [{ isDone: "asc" }, { order: "asc" }],
      take: 8,
    }),
    prisma.savedWord.count({ where: { userId } }),
    prisma.universityShortlistEntry.count({ where: { userId } }),
    /*
     * Ordered by the university's own deadline, nulls last, so the tile leads
     * with whatever is due soonest rather than with whatever was saved first.
     */
    prisma.universityShortlistEntry.findMany({
      where: { userId },
      orderBy: { university: { applicationDeadline: { sort: "asc", nulls: "last" } } },
      take: 4,
      select: {
        university: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            acceptanceRate: true,
            minSat: true,
            worldRanking: true,
            applicationDeadline: true,
          },
        },
      },
    }),
    prisma.test.findFirst({
      where: { isPublished: true, type: "FULL" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, type: true, durationMinutes: true },
    }),
  ]);

  let totalAnswered = aggregate._sum.totalQuestions ?? 0;
  let totalCorrect = aggregate._sum.score ?? 0;

  const [bankCounts, plan, openPractice, openAttempt, practiceAnswered, practiceCorrect, practiceAvailable] = await Promise.all([
    getBankCounts(), getCurrentStudyPlan(userId),
    prisma.practiceSession.findFirst({ where: { userId, completedAt: null }, orderBy: { startedAt: "desc" },
      select: { id: true, startedAt: true, skill: { select: { name: true } } } }),
    prisma.testAttempt.findFirst({ where: { userId, status: "IN_PROGRESS", test: { isPublished: true } }, orderBy: { startedAt: "desc" },
      select: { startedAt: true, test: { select: { id: true, title: true } } } }),
    prisma.practiceResponse.count({ where: { session: { userId } } }),
    prisma.practiceResponse.count({ where: { session: { userId }, isCorrect: true } }),
    prisma.question.count({ where: { skillId: { not: null }, reviewStatus: "VERIFIED" } }),
  ]);
  totalAnswered += practiceAnswered; totalCorrect += practiceCorrect;
  const featuredTest = fullTest && mockAvailability(bankCounts).complete ? fullTest : null;
  const resumes = [
    ...(openPractice ? [{ href: `/practice/session/${openPractice.id}`, title: openPractice.skill?.name ?? "", startedAt: openPractice.startedAt }] : []),
    ...(openAttempt ? [{ href: `/simulator/${openAttempt.test.id}`, title: openAttempt.test.title, startedAt: openAttempt.startedAt }] : []),
  ];

  return {
    todayAction: chooseTodayAction({ resumes, plan, mockHref: featuredTest ? `/simulator/${featuredTest.id}` : null,
      hasPractice: practiceAvailable > 0 }),
    databaseReady: true,
    user,
    latestResult,
    bestScaledScore: aggregate._max.scaledScore ?? null,
    testsTaken: aggregate._count._all,
    averageAccuracy: totalAnswered > 0 ? totalCorrect / totalAnswered : null,
    roadmapTasks,
    savedWordCount,
    shortlistCount,
    shortlisted: shortlistEntries.map((entry) => entry.university),
    featuredTest,
  };
}
