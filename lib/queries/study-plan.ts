/**
 * Reads for onboarding and the study plan.
 *
 * Kept out of the pages for the same reason `lib/queries/dashboard.ts` is: the
 * "no database configured" fallback has to live in one place, and a page that
 * calls Prisma directly grows its own version of it.
 */

import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import {
  completedByTask,
  planWindow,
  type TaskWindow,
} from "@/lib/study-plan";
import { examDateToIso } from "@/lib/validation/onboarding";
import type { GradeLevel, StudyPriority } from "@/lib/generated/prisma/enums";

/* -------------------------------------------------------------------------- */
/* Onboarding                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * What onboarding already knows about this student.
 *
 * `completed` is the only field the app shell reads. The rest is what the form
 * needs to reopen at the right step with the right answers filled in.
 */
export interface OnboardingState {
  completed: boolean;
  gradeLevel: GradeLevel | null;
  currentScore: number | null;
  targetScore: number | null;
  /** `YYYY-MM-DD`, the shape the form works in. */
  examDate: string | null;
  priority: StudyPriority | null;
}

const EMPTY_ONBOARDING: OnboardingState = {
  completed: false,
  gradeLevel: null,
  currentScore: null,
  targetScore: null,
  examDate: null,
  priority: null,
};

export async function getOnboardingState(
  userId: string,
): Promise<OnboardingState> {
  if (!isDatabaseConfigured()) {
    /*
     * Without a database there is nothing to save, so pretending onboarding is
     * finished is the kinder lie: it lets a contributor with no `DATABASE_URL`
     * see the rest of the app instead of being held at a form that cannot
     * submit.
     */
    return { ...EMPTY_ONBOARDING, completed: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      gradeLevel: true,
      currentScore: true,
      targetScore: true,
      targetExamDate: true,
      priority: true,
      onboardingCompletedAt: true,
    },
  });

  if (!user) return EMPTY_ONBOARDING;

  return {
    completed: user.onboardingCompletedAt !== null,
    gradeLevel: user.gradeLevel,
    currentScore: user.currentScore,
    targetScore: user.targetScore,
    examDate: user.targetExamDate ? examDateToIso(user.targetExamDate) : null,
    priority: user.priority,
  };
}

/**
 * Has this student finished onboarding?
 *
 * Its own query rather than a field on the shell's user read, because the app
 * layout runs it on every authenticated request and only needs one column.
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCompletedAt: true },
  });

  return user?.onboardingCompletedAt != null;
}

/* -------------------------------------------------------------------------- */
/* The plan                                                                    */
/* -------------------------------------------------------------------------- */

export interface PlanTaskView {
  id: string;
  skillCode: string;
  skillName: string;
  skillNameUz: string | null;
  domainName: string;
  targetQuestions: number;
  /**
   * Answers the student has given on this skill inside this task's week.
   * Derived on every read rather than stored — see `completedByTask`. Not
   * clamped to `targetQuestions`; a caller showing a bar clamps its own width.
   */
  completedQuestions: number;
}

export interface PlanWeekView {
  week: number;
  startDate: Date;
  dueDate: Date;
  questions: number;
  tasks: PlanTaskView[];
}

export interface StudyPlanView {
  id: string;
  createdAt: Date;
  currentScore: number | null;
  targetScore: number;
  examDate: Date;
  weeklyStudyMinutes: number;
  weeks: PlanWeekView[];
  weekCount: number;
  /** Weeks whose due date has not passed. Computed when the plan is read. */
  weeksRemaining: number;
  /**
   * The week the plan is in: the first one not yet past its due date, or the
   * last week once the plan has run out. Null when the plan has no weeks.
   */
  currentWeek: number | null;
  weeklyQuestions: number;
  totalQuestions: number;
  projectedScore: number | null;
  onTrack: boolean;
  shortfallMinutesPerWeek: number;
  bankLimited: boolean;
}

/**
 * The student's current plan — the newest one.
 *
 * Regenerating writes a new row instead of editing the old one, so "current"
 * is a matter of `createdAt` and the history stays readable. Progress does not
 * live on those rows and so does not reset with them: it is counted from the
 * student's answers each time this runs.
 */
export async function getCurrentStudyPlan(
  userId: string,
): Promise<StudyPlanView | null> {
  if (!isDatabaseConfigured()) return null;

  const plan = await prisma.studyPlan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      tasks: {
        orderBy: [{ week: "asc" }, { targetQuestions: "desc" }],
        include: {
          skill: {
            select: {
              code: true,
              name: true,
              nameUz: true,
              domain: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!plan) return null;

  /*
   * Progress is derived from the student's answers, not read off the task row —
   * see `completedByTask` in `lib/study-plan.ts` for why. One extra read,
   * bounded to the plan's own dates and its own skills rather than the
   * student's whole history.
   */
  const windows: TaskWindow[] = plan.tasks.map((task) => ({
    id: task.id,
    skillId: task.skillId,
    startDate: task.startDate,
    dueDate: task.dueDate,
  }));

  const span = planWindow(windows);

  const responses = span
    ? await prisma.practiceResponse.findMany({
        where: {
          session: { userId },
          answeredAt: { gte: span.from, lt: span.until },
          question: {
            skillId: { in: [...new Set(windows.map((task) => task.skillId))] },
          },
        },
        select: {
          answeredAt: true,
          question: { select: { skillId: true } },
        },
      })
    : [];

  const completed = completedByTask(
    windows,
    // `Question.skillId` is nullable; the `in` filter above already excludes
    // nulls, and this is what tells the type system so.
    responses.flatMap((response) =>
      response.question.skillId === null
        ? []
        : [
            {
              skillId: response.question.skillId,
              answeredAt: response.answeredAt,
            },
          ],
    ),
  );

  const now = Date.now();
  const weeks = new Map<number, PlanWeekView>();

  for (const task of plan.tasks) {
    const week = weeks.get(task.week) ?? {
      week: task.week,
      startDate: task.startDate,
      dueDate: task.dueDate,
      questions: 0,
      tasks: [],
    };

    week.questions += task.targetQuestions;
    week.tasks.push({
      id: task.id,
      skillCode: task.skill.code,
      skillName: task.skill.name,
      skillNameUz: task.skill.nameUz,
      domainName: task.skill.domain.name,
      targetQuestions: task.targetQuestions,
      completedQuestions: completed.get(task.id) ?? 0,
    });

    weeks.set(task.week, week);
  }

  const ordered = [...weeks.values()].sort((a, b) => a.week - b.week);
  const currentWeek =
    ordered.find((week) => week.dueDate.getTime() >= now) ??
    ordered[ordered.length - 1];

  return {
    id: plan.id,
    createdAt: plan.createdAt,
    currentScore: plan.currentScore,
    targetScore: plan.targetScore,
    examDate: plan.examDate,
    weeklyStudyMinutes: plan.weeklyStudyMinutes,
    weeks: ordered,
    weekCount: plan.weeks,
    weeksRemaining: ordered.filter((week) => week.dueDate.getTime() >= now)
      .length,
    currentWeek: currentWeek?.week ?? null,
    weeklyQuestions: plan.weeklyQuestions,
    totalQuestions: plan.totalQuestions,
    projectedScore: plan.projectedScore,
    onTrack: plan.onTrack,
    shortfallMinutesPerWeek: plan.shortfallMinutesPerWeek,
    bankLimited: plan.bankLimited,
  };
}

