"use server";

/**
 * The study plan, as a Server Action.
 *
 * Thin on purpose: this file's whole job is to establish *who* is asking. The
 * building and saving live in `lib/study-plan-writer.ts`, which is an ordinary
 * module — a `"use server"` file publishes every export as an HTTP endpoint, so
 * a function taking a `userId` must not live here.
 */

import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/lib/user";
import { buildAndSaveStudyPlan } from "@/lib/study-plan-writer";
import type { ActionResult } from "@/lib/actions/roadmap";

/**
 * Rebuild this student's plan from what they have told us.
 *
 * Takes no arguments: the id comes from the session, every time.
 */
export async function regenerateStudyPlan(): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const result = await buildAndSaveStudyPlan(userId);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/dashboard");
  revalidatePath("/plan");

  return { ok: true };
}
