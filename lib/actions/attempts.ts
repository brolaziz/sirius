"use server";

/**
 * Test attempt lifecycle: start, autosave, submit.
 *
 * The important property here is that **the client never grades anything**. It
 * submits which option it chose; the server loads the questions, compares
 * against `correctAnswer`, and writes the result. A student editing the payload
 * in devtools can change their answers, but not their score.
 *
 * The timer is anchored to `TestAttempt.startedAt` on the server for the same
 * reason: reloading the page does not buy more time.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { getOrCreateCurrentUser } from "@/lib/user";
import { gradeAttempt } from "@/lib/sat";
import type { ActionResult } from "@/lib/actions/roadmap";

/* -------------------------------------------------------------------------- */
/* Start                                                                       */
/* -------------------------------------------------------------------------- */

export interface StartAttemptResult extends ActionResult {
  attemptId?: string;
  /** Epoch milliseconds, so the client can compute a countdown. */
  startedAtMs?: number;
}

/**
 * Begin (or resume) an attempt at a test.
 *
 * Resuming rather than always creating is deliberate: a student who reloads
 * mid-module should return to the same attempt with the same clock, not get a
 * fresh 32 minutes.
 */
export async function startAttempt(testId: string): Promise<StartAttemptResult> {
  const parsed = z.string().min(1).max(60).safeParse(testId);
  if (!parsed.success) return { ok: false, error: "Invalid test." };

  const user = await getOrCreateCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const test = await prisma.test.findFirst({
    where: { id: parsed.data, isPublished: true },
    select: { id: true },
  });
  if (!test) return { ok: false, error: "That test is not available." };

  const existing = await prisma.testAttempt.findFirst({
    where: {
      userId: user.id,
      testId: test.id,
      status: "IN_PROGRESS",
    },
    orderBy: { startedAt: "desc" },
  });

  if (existing) {
    return {
      ok: true,
      attemptId: existing.id,
      startedAtMs: existing.startedAt.getTime(),
    };
  }

  const created = await prisma.testAttempt.create({
    data: { userId: user.id, testId: test.id },
  });

  return {
    ok: true,
    attemptId: created.id,
    startedAtMs: created.startedAt.getTime(),
  };
}

/* -------------------------------------------------------------------------- */
/* Autosave                                                                    */
/* -------------------------------------------------------------------------- */

const progressSchema = z.object({
  attemptId: z.string().min(1).max(60),
  answers: z.record(z.string().max(60), z.string().max(200)),
  flagged: z.array(z.string().max(60)).max(500),
});

/**
 * Persist in-progress answers so a closed tab does not lose the module.
 * Fire-and-forget from the client — a failed autosave must not interrupt the
 * test, so this returns a result rather than throwing.
 */
export async function saveAttemptProgress(
  input: z.infer<typeof progressSchema>,
): Promise<ActionResult> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid progress payload." };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const updated = await prisma.testAttempt.updateMany({
    where: {
      id: parsed.data.attemptId,
      userId,
      status: "IN_PROGRESS",
    },
    data: {
      answers: parsed.data.answers,
      flagged: parsed.data.flagged,
    },
  });

  return updated.count > 0
    ? { ok: true }
    : { ok: false, error: "Attempt is no longer open." };
}

/* -------------------------------------------------------------------------- */
/* Submit                                                                      */
/* -------------------------------------------------------------------------- */

const submitSchema = z.object({
  attemptId: z.string().min(1).max(60),
  answers: z.record(z.string().max(60), z.string().max(200)),
});

export interface SubmitAttemptResult extends ActionResult {
  resultId?: string;
}

/** Grade and close an attempt, writing a `TestResult`. */
export async function submitAttempt(
  input: z.infer<typeof submitSchema>,
): Promise<SubmitAttemptResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission." };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const attempt = await prisma.testAttempt.findFirst({
    where: { id: parsed.data.attemptId, userId },
    include: {
      test: {
        select: {
          id: true,
          type: true,
          questions: {
            select: { id: true, correctAnswer: true },
          },
        },
      },
    },
  });

  if (!attempt) return { ok: false, error: "Attempt not found." };

  if (attempt.status === "COMPLETED") {
    // Idempotent: resubmitting returns the result that already exists rather
    // than double-scoring the attempt.
    const existing = await prisma.testResult.findFirst({
      where: { userId, testId: attempt.testId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    return { ok: true, resultId: existing?.id };
  }

  const graded = gradeAttempt(
    attempt.test.questions,
    parsed.data.answers,
    attempt.test.type,
  );

  const durationSeconds = Math.max(
    0,
    Math.round((Date.now() - attempt.startedAt.getTime()) / 1000),
  );

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.testResult.create({
      data: {
        userId,
        testId: attempt.testId,
        score: graded.score,
        totalQuestions: graded.totalQuestions,
        scaledScore: graded.scaledScore,
        answersRecord: graded.breakdown,
        durationSeconds,
      },
    });

    await tx.testAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        answers: parsed.data.answers,
      },
    });

    return created;
  });

  revalidatePath("/dashboard");
  revalidatePath("/practice");

  return { ok: true, resultId: result.id };
}
