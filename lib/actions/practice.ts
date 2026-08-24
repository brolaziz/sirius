"use server";

/**
 * Practice mode: start a session, answer a question, finish.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHAT THE BROWSER IS TRUSTED WITH
 *
 * Nothing. It sends which question it is answering and what it chose; the
 * server loads the key, marks it, writes the row, and only then returns the
 * correct answer and the explanation. A student reading the network tab during
 * a session sees their own answer going out and the verdict coming back — never
 * the key to a question they have not answered yet.
 *
 * Marking goes through `isAnswerCorrect` in `lib/sat.ts`, the same function the
 * simulator uses. Practice is a different *mode*, not a second product: one
 * grader, one definition of "0.35 and 7/20 are the same answer".
 * ───────────────────────────────────────────────────────────────────────────
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { isAnswerCorrect } from "@/lib/sat";
import {
  selectPracticeQuestions,
  sessionLength,
  type QuestionHistory,
} from "@/lib/practice";
import { asQuestionIds } from "@/lib/queries/practice";
import { taskWindow } from "@/lib/study-plan";
import type { ActionResult } from "@/lib/actions/roadmap";

/* -------------------------------------------------------------------------- */
/* Start                                                                       */
/* -------------------------------------------------------------------------- */

const startSchema = z
  .object({
    skillCode: z.string().min(1).max(100).optional(),
    planTaskId: z.string().min(1).max(60).optional(),
    /** Mixed practice: every topic, no skill. */
    mixed: z.boolean().optional(),
    /** How many questions the student asked for. */
    count: z.number().int().min(5).max(50).optional(),
  })
  .refine(
    (input) =>
      [input.skillCode, input.planTaskId, input.mixed].filter(Boolean)
        .length === 1,
    {
      error:
        "Start a session from a skill, a plan task or mixed practice — exactly one.",
    },
  );

export interface StartPracticeResult extends ActionResult {
  sessionId?: string;
}

/**
 * Open a practice session, or return the one already open.
 *
 * Resuming rather than always creating matches the simulator's behaviour and
 * prevents a half-finished session being orphaned every time a student taps
 * "practise" twice.
 */
export async function startPracticeSession(
  input: z.infer<typeof startSchema>,
): Promise<StartPracticeResult> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  /* Which skill, and how much of a plan task is left to do. */
  let skillId: string | null = null;
  let planTaskId: string | null = null;
  let remainingInTask: number | null = null;

  if (parsed.data.mixed) {
    /* Mixed practice has no skill — see the note on `PracticeSession.skillId`. */
    skillId = null;
  } else if (parsed.data.planTaskId) {
    const task = await prisma.studyPlanTask.findFirst({
      // Ownership is checked through the plan: tasks have no user of their own.
      where: { id: parsed.data.planTaskId, plan: { userId } },
      select: {
        id: true,
        skillId: true,
        targetQuestions: true,
        startDate: true,
      },
    });

    if (!task) return { ok: false, error: "That plan task is not available." };

    /*
     * What is left of the task, counted from the student's answers rather than
     * read off the row — `completedByTask` in `lib/study-plan.ts` explains why
     * the count is not stored. Practice on this skill inside this week counts
     * whether or not it was opened from the plan, so a student who has already
     * done the work is not handed it again.
     */
    const week = taskWindow(task);
    const done = await prisma.practiceResponse.count({
      where: {
        session: { userId },
        answeredAt: { gte: week.from, lt: week.until },
        question: { skillId: task.skillId },
      },
    });

    skillId = task.skillId;
    planTaskId = task.id;
    remainingInTask = Math.max(0, task.targetQuestions - done);
  } else {
    const skill = await prisma.skill.findUnique({
      where: { code: parsed.data.skillCode },
      select: { id: true },
    });

    if (!skill) return { ok: false, error: "That topic is not available." };
    skillId = skill.id;
  }

  const open = await prisma.practiceSession.findFirst({
    where: {
      userId,
      skillId,
      planTaskId,
      source: parsed.data.mixed ? "MIXED" : undefined,
      completedAt: null,
    },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  if (open) return { ok: true, sessionId: open.id };

  /*
   * Mixed practice draws from every question that carries a skill, which is the
   * whole usable bank. A question with no skill is excluded for the same reason
   * the blueprint cannot place it: nothing knows what it tests.
   */
  const candidates = await prisma.question.findMany({
    where: skillId === null ? { skillRef: { isNot: null } } : { skillId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  if (candidates.length === 0) {
    return { ok: false, error: "There are no questions for that topic yet." };
  }

  const seen = await prisma.practiceResponse.findMany({
    where: {
      session: { userId },
      questionId: { in: candidates.map((question) => question.id) },
    },
    select: { questionId: true, answeredAt: true },
  });

  const history = new Map<string, QuestionHistory>();
  for (const response of seen) {
    const entry = history.get(response.questionId) ?? {
      lastAnsweredAt: null,
      timesAnswered: 0,
    };

    entry.timesAnswered += 1;
    entry.lastAnsweredAt = Math.max(
      entry.lastAnsweredAt ?? 0,
      response.answeredAt.getTime(),
    );

    history.set(response.questionId, entry);
  }

  /*
   * The student's chosen length wins when they set one, clamped to what the
   * bank actually holds. Without a choice this falls back to `sessionLength`,
   * which is what a plan task or a bare topic tap has always used.
   */
  const requested = parsed.data.count
    ? Math.min(parsed.data.count, candidates.length)
    : sessionLength(candidates.length, remainingInTask);

  const questionIds = selectPracticeQuestions(
    candidates.map((question) => question.id),
    history,
    requested,
  );

  if (questionIds.length === 0) {
    return { ok: false, error: "There are no questions for that topic yet." };
  }

  const session = await prisma.practiceSession.create({
    data: {
      userId,
      skillId,
      planTaskId,
      source: parsed.data.mixed ? "MIXED" : planTaskId ? "PLAN" : "SKILL",
      questionIds,
    },
    select: { id: true },
  });

  return { ok: true, sessionId: session.id };
}

/* -------------------------------------------------------------------------- */
/* Answer                                                                      */
/* -------------------------------------------------------------------------- */

const answerSchema = z.object({
  sessionId: z.string().min(1).max(60),
  questionId: z.string().min(1).max(60),
  answer: z.string().min(1).max(200),
  /** Clamped rather than trusted: an hour on one practice question is a bug. */
  timeSpentSeconds: z.number().int().min(0).max(3_600),
});

export interface AnswerPracticeResult extends ActionResult {
  isCorrect?: boolean;
  correctAnswer?: string;
  explanation?: string | null;
}

export async function answerPracticeQuestion(
  input: z.infer<typeof answerSchema>,
): Promise<AnswerPracticeResult> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid answer." };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const session = await prisma.practiceSession.findFirst({
    where: { id: parsed.data.sessionId, userId },
    select: { id: true, questionIds: true, completedAt: true },
  });

  if (!session) return { ok: false, error: "Session not found." };
  if (session.completedAt) {
    return { ok: false, error: "This session is already finished." };
  }

  // The question has to be one this session asked, not any question in the bank.
  if (!asQuestionIds(session.questionIds).includes(parsed.data.questionId)) {
    return { ok: false, error: "That question is not part of this session." };
  }

  const question = await prisma.question.findUnique({
    where: { id: parsed.data.questionId },
    select: {
      id: true,
      correctAnswer: true,
      acceptedAnswers: true,
      explanation: true,
    },
  });

  if (!question) return { ok: false, error: "Question not found." };

  /*
   * Idempotent: a double submit, or a retried request, returns the verdict
   * already recorded instead of marking the same question twice. The first
   * answer is the true one — that is the whole point of recording it.
   */
  const existing = await prisma.practiceResponse.findUnique({
    where: {
      sessionId_questionId: {
        sessionId: session.id,
        questionId: question.id,
      },
    },
    select: { isCorrect: true },
  });

  if (existing) {
    return {
      ok: true,
      isCorrect: existing.isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  const correct = isAnswerCorrect(
    parsed.data.answer,
    question.correctAnswer,
    question.acceptedAnswers,
  );

  /*
   * One write. Answering used to also increment the plan task's counter, which
   * is what made this a transaction; the plan now counts these rows instead of
   * being told about them, so there is nothing to keep in step.
   */
  await prisma.practiceResponse.create({
    data: {
      sessionId: session.id,
      questionId: question.id,
      answer: parsed.data.answer,
      isCorrect: correct,
      timeSpentSeconds: parsed.data.timeSpentSeconds,
    },
  });

  return {
    ok: true,
    isCorrect: correct,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  };
}

/* -------------------------------------------------------------------------- */
/* Finish                                                                      */
/* -------------------------------------------------------------------------- */

export async function finishPracticeSession(
  sessionId: string,
): Promise<ActionResult> {
  const parsed = z.string().min(1).max(60).safeParse(sessionId);
  if (!parsed.success) return { ok: false, error: "Invalid session." };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  await prisma.practiceSession.updateMany({
    where: { id: parsed.data, userId, completedAt: null },
    data: { completedAt: new Date() },
  });

  revalidatePath("/practice");
  revalidatePath("/plan");
  revalidatePath("/dashboard");

  // Finishing an already-finished session is not an error worth showing.
  return { ok: true };
}
