"use server";

/** Profile mutations: the student's target score. */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { TOTAL_SCORE_MAX, TOTAL_SCORE_MIN } from "@/lib/sat";
import type { ActionResult } from "@/lib/actions/roadmap";

const targetScoreSchema = z
  .number()
  .int()
  .min(TOTAL_SCORE_MIN, `Target must be at least ${TOTAL_SCORE_MIN}.`)
  .max(TOTAL_SCORE_MAX, `Target cannot exceed ${TOTAL_SCORE_MAX}.`)
  // Real SAT scores are reported in steps of 10.
  .refine((score) => score % 10 === 0, {
    error: "SAT scores go up in steps of 10.",
  });

export async function setTargetScore(score: number): Promise<ActionResult> {
  const parsed = targetScoreSchema.safeParse(score);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid score." };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  await prisma.user.update({
    where: { id: userId },
    data: { targetScore: parsed.data },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
