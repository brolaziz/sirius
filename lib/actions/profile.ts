"use server";

/**
 * Profile mutations: the student's target score.
 *
 * The rules come from `lib/validation/onboarding.ts` rather than being restated
 * here. A target set on the profile page and a target set during onboarding are
 * the same number under the same constraints, and two copies of "400–1600, in
 * steps of 10, not below the score you already have" is one copy too many —
 * whichever of them someone edits later becomes the one that is wrong.
 *
 * CHANGING THE TARGET REBUILDS THE PLAN.
 * The study plan is arithmetic over the target: how many questions a week, of
 * which skills, to close the gap by exam day. Leaving yesterday's plan in place
 * after the target moves is worse than having no plan at all, because it still
 * looks authoritative. `buildAndSaveStudyPlan` *appends* a new plan rather than
 * editing the current one (see its header), so nothing a student has already
 * worked through is rewritten or lost — the history keeps every version and the
 * app reads the newest.
 *
 * The rebuild is deliberately not fatal. If the plan cannot be built — no exam
 * date yet, an empty question bank, a database blip — the target is still
 * saved and the student is told the plan did not follow. Refusing the save
 * would leave the two out of step in the other, worse direction: a target the
 * student believes they changed and a plan built for it, neither of them true.
 */

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { buildAndSaveStudyPlan } from "@/lib/study-plan-writer";
import {
  satScoreSchema,
  targetScoreProblem,
} from "@/lib/validation/onboarding";
import type { ActionResult } from "@/lib/actions/roadmap";

/** What `setTargetScore` reports back, beyond whether the score was saved. */
export interface TargetScoreResult extends ActionResult {
  /**
   * False when the score was saved but the plan could not be rebuilt from it.
   * The caller shows a different message: the target moved, the plan did not.
   */
  planRebuilt?: boolean;
}

export async function setTargetScore(
  score: number,
): Promise<TargetScoreResult> {
  const parsed = satScoreSchema.safeParse(score);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid score.",
    };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  /*
   * The cross-field rule needs the other field. Read it here rather than
   * trusting anything the browser sent: a Server Action is an open HTTP
   * endpoint, and the current score is exactly the value a client would have to
   * lie about to get a target under it accepted.
   */
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentScore: true },
  });

  if (!user) return { ok: false, error: "Account not found." };

  const problem = targetScoreProblem(parsed.data, user.currentScore);
  if (problem) return { ok: false, error: problem };

  await prisma.user.update({
    where: { id: userId },
    data: { targetScore: parsed.data },
  });

  const rebuilt = await buildAndSaveStudyPlan(userId);
  if (!rebuilt.ok) {
    console.error("[profile] could not rebuild the plan:", rebuilt.error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/plan");

  return { ok: true, planRebuilt: rebuilt.ok };
}
