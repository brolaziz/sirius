/**
 * Building a student's plan and writing it down.
 *
 * Kept out of `lib/actions/study-plan.ts` on purpose. A module marked
 * `"use server"` publishes every export as an HTTP endpoint, so a function that
 * takes a `userId` cannot live there — it would let anyone rewrite anyone's
 * plan. Here it is an ordinary server module: the action calls it with an id it
 * read from the session, and nothing else can call it at all.
 *
 * The arithmetic is in `lib/study-plan.ts` and knows nothing about the
 * database; this is the part that reads the student's answers, reads what the
 * question bank actually holds, and saves the result.
 */

import { prisma } from "@/lib/prisma";
import { buildStudyPlan, type PlanSkill } from "@/lib/study-plan";

export type BuildPlanResult =
  | { ok: true; planId: string; totalQuestions: number }
  | { ok: false; error: string };

/**
 * Rebuild one student's plan.
 *
 * Regeneration **adds** a plan rather than editing the current one. A plan is a
 * statement about a moment — "on 21 August, with 12 weeks left and five hours a
 * week, here is what it takes" — and rewriting that statement in place makes it
 * impossible for a student to see that moving their exam date changed what the
 * plan asks of them. Nothing is ever deleted here.
 */
export async function buildAndSaveStudyPlan(
  userId: string,
): Promise<BuildPlanResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentScore: true,
      targetScore: true,
      targetExamDate: true,
      weeklyStudyMinutes: true,
    },
  });

  if (!user) return { ok: false, error: "Account not found." };

  /*
   * Pulled out of `user` rather than read from it later: TypeScript drops what
   * it knows about an object's properties inside a callback, and two of these
   * are read inside the transaction.
   */
  const { currentScore, weeklyStudyMinutes } = user;
  const targetScore = user.targetScore;
  const examDate = user.targetExamDate;

  if (targetScore === null || examDate === null) {
    return {
      ok: false,
      error: "Set a target score and an exam date before building a plan.",
    };
  }

  /*
   * Every skill in the taxonomy, with two numbers: what share of the exam it
   * carries, and how many questions we can actually put in front of a student.
   * A skill with no questions is dropped by the planner rather than scheduled
   * and then found empty.
   */
  const skills = await prisma.skill.findMany({
    select: {
      id: true,
      code: true,
      weightInDomain: true,
      domain: { select: { examWeight: true } },
      _count: { select: { questions: true } },
    },
  });

  const planSkills: PlanSkill[] = skills.map((skill) => ({
    code: skill.code,
    examShare: skill.domain.examWeight * skill.weightInDomain,
    availableQuestions: skill._count.questions,
  }));

  const skillIds = new Map(skills.map((skill) => [skill.code, skill.id]));

  const { projection, weeks } = buildStudyPlan({
    currentScore,
    targetScore,
    examDate,
    today: new Date(),
    weeklyStudyMinutes,
    skills: planSkills,
  });

  const planId = await prisma.$transaction(async (tx) => {
    const plan = await tx.studyPlan.create({
      data: {
        userId,
        currentScore,
        targetScore,
        examDate,
        weeklyStudyMinutes,
        weeks: projection.weeks,
        weeklyQuestions: projection.weeklyQuestions,
        totalQuestions: projection.totalQuestions,
        projectedScore: projection.projectedScore,
        onTrack: projection.onTrack,
        shortfallMinutesPerWeek: projection.shortfallMinutesPerWeek,
        bankLimited: projection.bankLimited,
      },
      select: { id: true },
    });

    const tasks = weeks.flatMap((week) =>
      week.tasks.flatMap((task) => {
        const skillId = skillIds.get(task.skillCode);
        // Cannot happen — the planner only names skills it was given — but a
        // missing id would otherwise become a foreign key error mid-transaction.
        if (!skillId) return [];

        return [
          {
            planId: plan.id,
            week: week.week,
            startDate: week.startDate,
            dueDate: week.dueDate,
            skillId,
            targetQuestions: task.questions,
          },
        ];
      }),
    );

    if (tasks.length > 0) {
      await tx.studyPlanTask.createMany({ data: tasks });
    }

    return plan.id;
  });

  return {
    ok: true,
    planId,
    totalQuestions: projection.totalQuestions,
  };
}
