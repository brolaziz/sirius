"use server";

/**
 * Onboarding: five questions, saved one at a time.
 *
 * Each step writes its own answer immediately. A student who closes the tab at
 * step 3 comes back to step 3 — which matters more here than anywhere else in
 * the product, because this form stands between a new account and everything
 * else, and a form that loses your answers is a form you do not come back to.
 *
 * Both actions revalidate the whole rules module rather than trusting the
 * fields the browser sent: `lib/validation/onboarding.ts` is imported by the
 * form for the messages, but a Server Action is an open HTTP endpoint and the
 * client's copy of a rule is a courtesy, not a check.
 */

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { regenerateStudyPlan } from "@/lib/actions/study-plan";
import {
  examDateToIso,
  examDateToUtc,
  onboardingProfileSchema,
  onboardingStepSchema,
  targetScoreProblem,
  type OnboardingStep,
  type OnboardingStepInput,
} from "@/lib/validation/onboarding";
import type { ActionResult } from "@/lib/actions/roadmap";

/**
 * Onboarding's own result type: when a rule fails it also says which step to
 * send the student back to, so a cross-field problem ("your target is below
 * your current score") lands them on the field they can fix rather than on a
 * message with no way forward.
 */
export interface OnboardingResult extends ActionResult {
  step?: OnboardingStep;
}

/** Which step owns which field, for sending the student back to it. */
const FIELD_STEPS: Readonly<Record<string, OnboardingStep>> = {
  gradeLevel: "grade",
  currentScore: "current-score",
  targetScore: "target-score",
  examDate: "exam-date",
  priority: "priority",
};

/* -------------------------------------------------------------------------- */
/* One step                                                                    */
/* -------------------------------------------------------------------------- */

export async function saveOnboardingStep(
  input: OnboardingStepInput,
): Promise<OnboardingResult> {
  const parsed = onboardingStepSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "That answer is not valid.",
      step: stepForPath(issue?.path),
    };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const answer = parsed.data;

  /*
   * The one rule a single step cannot check on its own. The target is entered
   * after the current score, so this compares against what is already stored;
   * `completeOnboarding` checks the pair again at the end, because a student
   * can go back and raise their current score afterwards.
   */
  if (answer.step === "target-score") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentScore: true },
    });

    const problem = targetScoreProblem(
      answer.targetScore,
      user?.currentScore ?? null,
    );
    if (problem) return { ok: false, error: problem, step: "target-score" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: dataForStep(answer),
  });

  return { ok: true };
}

/** The single column a step owns. */
function dataForStep(answer: OnboardingStepInput) {
  switch (answer.step) {
    case "grade":
      return { gradeLevel: answer.gradeLevel };
    case "current-score":
      return { currentScore: answer.currentScore };
    case "target-score":
      return { targetScore: answer.targetScore };
    case "exam-date":
      return { targetExamDate: examDateToUtc(answer.examDate) };
    case "priority":
      return { priority: answer.priority };
  }
}

/* -------------------------------------------------------------------------- */
/* Finishing                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Close onboarding and build the first study plan.
 *
 * The stored answers are validated as a whole here, not the payload — by this
 * point the browser has nothing left to send, and what matters is whether the
 * five columns in the database make a coherent profile.
 */
export async function completeOnboarding(): Promise<OnboardingResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

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

  if (!user) return { ok: false, error: "Account not found." };

  const parsed = onboardingProfileSchema.safeParse({
    gradeLevel: user.gradeLevel,
    currentScore: user.currentScore,
    targetScore: user.targetScore,
    examDate: user.targetExamDate ? examDateToIso(user.targetExamDate) : "",
    priority: user.priority,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Some answers are still missing.",
      step: stepForPath(issue?.path),
    };
  }

  /*
   * Idempotent: finishing twice — a double click, a retried request — must not
   * move the completion date or stack up plans.
   */
  if (user.onboardingCompletedAt === null) {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
    });

    const planned = await regenerateStudyPlan();
    if (!planned.ok) {
      /*
       * The profile is saved and onboarding is done; only the plan failed. The
       * student is let through to the dashboard rather than being held at a
       * form they have already completed — the plan can be rebuilt from there.
       */
      console.error("[onboarding] could not build the first plan:", planned.error);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/plan");

  return { ok: true };
}

/** Map a Zod issue path onto the step that owns the field. */
function stepForPath(path: readonly PropertyKey[] | undefined): OnboardingStep | undefined {
  const field = path?.[0];
  return typeof field === "string" ? FIELD_STEPS[field] : undefined;
}
