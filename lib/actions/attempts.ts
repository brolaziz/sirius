"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, getOrCreateCurrentUser } from "@/lib/user";
import { beginAttempt, writeAttempt } from "@/lib/attempt-lifecycle";
import type { ActionResult } from "@/lib/actions/roadmap";

export interface StartAttemptResult extends ActionResult { attemptId?: string; startedAtMs?: number }
export interface SubmitAttemptResult extends ActionResult { resultId?: string; conflict?: boolean }
export interface AdvanceModuleResult extends SubmitAttemptResult { moduleIndex?: number; moduleStartedAtMs?: number }

const progressSchema = z.object({
  attemptId: z.string().min(1).max(60), moduleIndex: z.number().int().min(0).max(3),
  revision: z.number().int().min(1).max(2147483647),
  answers: z.record(z.string().max(60), z.string().max(200)), flagged: z.array(z.string().max(60)).max(500),
});
const submitSchema = progressSchema.omit({ flagged: true });

export async function startAttempt(testId: string): Promise<StartAttemptResult> {
  const parsed = z.string().min(1).max(60).safeParse(testId);
  if (!parsed.success) return { ok: false, error: "Invalid test." };
  const user = await getOrCreateCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  return beginAttempt(prisma, user.id, parsed.data);
}

export async function saveAttemptProgress(input: z.infer<typeof progressSchema>): Promise<ActionResult & { conflict?: boolean }> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid progress payload." };
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };
  return writeAttempt(prisma, userId, parsed.data.attemptId, { kind: "save", ...parsed.data });
}

export async function advanceModule(input: z.infer<typeof progressSchema>): Promise<AdvanceModuleResult> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid module payload." };
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };
  const result = await writeAttempt(prisma, userId, parsed.data.attemptId, { kind: "advance", ...parsed.data });
  if (result.ok) { revalidatePath("/dashboard"); revalidatePath("/practice"); }
  return result;
}

export async function submitAttempt(input: z.infer<typeof submitSchema>): Promise<SubmitAttemptResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission." };
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };
  const result = await writeAttempt(prisma, userId, parsed.data.attemptId, { kind: "submit", ...parsed.data });
  if (result.ok) { revalidatePath("/dashboard"); revalidatePath("/practice"); }
  return result;
}
