"use server";

/**
 * Test attempt lifecycle: start, autosave, advance a module, submit.
 *
 * The important property here is that **the client never grades anything**. It
 * submits which option it chose; the server loads the questions, compares
 * against `correctAnswer`, and writes the result. A student editing the payload
 * in devtools can change their answers, but not their score.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THE CLOCK IS ENFORCED HERE, NOT IN THE BROWSER
 *
 * Every write checks the deadline before it accepts anything:
 *
 *   • a single-module practice test is over at `startedAt + durationMinutes`;
 *   • a full sitting is over, module by module, at
 *     `moduleStartedAt + MOCK_MODULES[n].minutes`.
 *
 * An answer arriving after that is refused, and `submitAttempt` grades what was
 * **stored while the module was open** rather than what the payload says. That
 * is what closes the hole this codebase used to have: stopping JavaScript,
 * letting the countdown die, and submitting an hour later now submits exactly
 * the answers that were saved before time ran out.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId, getOrCreateCurrentUser } from "@/lib/user";
import { estimateScaledScore, isAnswerCorrect } from "@/lib/sat";
import {
  assembleMockFromBank,
  mergeModuleAnswers,
  parseModulePlan,
  readAttemptClock,
  scoreMock,
  selectModule2,
  type MockModulePlan,
  type MockSection,
} from "@/lib/mock";
import type { ActionResult } from "@/lib/actions/roadmap";

/** Answers already stored, read out of the Json column. */
function storedAnswers(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const answers: Record<string, string> = {};
  for (const [questionId, answer] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (typeof answer === "string") answers[questionId] = answer;
  }

  return answers;
}

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
 *
 * A full test is planned into modules here, once. The plan is stored on the
 * attempt — see `TestAttempt.modulePlan` — and a test whose questions carry no
 * taxonomy produces no plan and runs as the single-clock practice test it has
 * always been.
 */
export async function startAttempt(testId: string): Promise<StartAttemptResult> {
  const parsed = z.string().min(1).max(60).safeParse(testId);
  if (!parsed.success) return { ok: false, error: "Invalid test." };

  const user = await getOrCreateCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const test = await prisma.test.findFirst({
    where: { id: parsed.data, isPublished: true },
    select: { id: true, type: true },
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

  /*
   * Only a FULL test is a sitting. A Reading or Math practice test is one
   * module by definition, and planning it into four would invent three.
   */
  let modulePlan: MockModulePlan = [];

  if (test.type === "FULL") {
    /*
     * A full sitting draws from the WHOLE BANK, not from this test's own rows.
     *
     * The bank was imported into two unpublished container tests, so assembling
     * from `testId` gave the demo test its two questions and called that a
     * mock. A question's fitness for a module is a property of the question —
     * its section and its module — not of the row it was imported under.
     *
     * `assembleMockFromBank` fills each module to the blueprint (27/27/22/22)
     * and no further, so importing more questions lengthens the mock without
     * anyone editing a list. That is what makes turning this on a data change.
     */
    const questions = await prisma.question.findMany({
      where: { skillRef: { isNot: null } },
      orderBy: [{ module: "asc" }, { order: "asc" }],
      select: {
        id: true,
        module: true,
        skillRef: { select: { domain: { select: { section: true } } } },
      },
    });

    modulePlan = assembleMockFromBank(
      questions.map((question) => ({
        id: question.id,
        module: question.module,
        section: sectionOf(question.skillRef?.domain.section ?? null),
      })),
    );
  }

  const created = await prisma.testAttempt.create({
    data: {
      userId: user.id,
      testId: test.id,
      modulePlan: modulePlan.length > 0 ? modulePlan : undefined,
      moduleStartedAt: new Date(),
    },
  });

  return {
    ok: true,
    attemptId: created.id,
    startedAtMs: created.startedAt.getTime(),
  };
}

/** `SatSection` (RW/MATH) to the section names the mock and `TestType` use. */
function sectionOf(section: "RW" | "MATH" | null): MockSection | null {
  if (section === "RW") return "READING";
  if (section === "MATH") return "MATH";
  return null;
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
 *
 * Refuses everything once the module's time is up. Fire-and-forget from the
 * client — a failed autosave must not interrupt the test, so this returns a
 * result rather than throwing.
 */
export async function saveAttemptProgress(
  input: z.infer<typeof progressSchema>,
): Promise<ActionResult> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid progress payload." };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const attempt = await prisma.testAttempt.findFirst({
    where: { id: parsed.data.attemptId, userId, status: "IN_PROGRESS" },
    select: {
      id: true,
      answers: true,
      modulePlan: true,
      moduleIndex: true,
      moduleStartedAt: true,
      startedAt: true,
      test: { select: { durationMinutes: true } },
    },
  });

  if (!attempt) return { ok: false, error: "Attempt is no longer open." };

  const clock = readAttemptClock(attempt, attempt.test.durationMinutes, new Date());
  if (clock.expired) {
    return { ok: false, error: "That module's time is up." };
  }

  await prisma.testAttempt.update({
    where: { id: attempt.id },
    data: {
      answers: mergeModuleAnswers(
        storedAnswers(attempt.answers),
        parsed.data.answers,
        clock,
      ),
      flagged: parsed.data.flagged,
    },
  });

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Modules                                                                     */
/* -------------------------------------------------------------------------- */

export interface AdvanceModuleResult extends ActionResult {
  /** Set when the sitting moved on rather than finishing. */
  moduleIndex?: number;
  moduleStartedAtMs?: number;
  /** Set when the sitting is over and has been graded. */
  resultId?: string;
}

/**
 * Close the open module and open the next one — or finish the sitting.
 *
 * The next module's clock starts *now*, when the student says they are ready,
 * rather than at a fixed offset from the last one. That is what makes the break
 * a break: a student who comes back from ten minutes away has not lost the
 * first eight minutes of Math.
 */
export async function advanceModule(
  attemptId: string,
): Promise<AdvanceModuleResult> {
  const parsed = z.string().min(1).max(60).safeParse(attemptId);
  if (!parsed.success) return { ok: false, error: "Invalid attempt." };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const attempt = await prisma.testAttempt.findFirst({
    where: { id: parsed.data, userId, status: "IN_PROGRESS" },
    select: {
      id: true,
      answers: true,
      modulePlan: true,
      moduleIndex: true,
      moduleStartedAt: true,
      startedAt: true,
      test: { select: { durationMinutes: true } },
    },
  });

  if (!attempt) return { ok: false, error: "Attempt is no longer open." };

  const plan = parseModulePlan(attempt.modulePlan);
  if (plan.length === 0) {
    return { ok: false, error: "This test has no modules to advance." };
  }

  const clock = readAttemptClock(attempt, attempt.test.durationMinutes, new Date());

  if (!clock.hasNext) {
    const finished = await gradeAndClose(attempt.id, userId);
    return finished.ok
      ? { ok: true, resultId: finished.resultId }
      : { ok: false, error: finished.error };
  }

  /*
   * THE ADAPTIVE SEAM.
   *
   * The real exam routes a student to an easier or harder second module based
   * on how the first went. `selectModule2` is called with exactly that, and
   * answers STANDARD for now — the questions in the bank carry no measured
   * difficulty, so any other answer would be sorting by a property nobody has
   * established. When it changes, it changes here: a routing other than
   * STANDARD rewrites `plan[next].questionIds` before the module opens, and
   * nothing else in the flow has to know.
   */
  const closing = await gradeModule(clock.questionIds, storedAnswers(attempt.answers));
  selectModule2(closing);

  const moduleStartedAt = new Date();

  await prisma.testAttempt.updateMany({
    where: { id: attempt.id, userId, status: "IN_PROGRESS" },
    data: {
      moduleIndex: attempt.moduleIndex + 1,
      moduleStartedAt,
    },
  });

  return {
    ok: true,
    moduleIndex: attempt.moduleIndex + 1,
    moduleStartedAtMs: moduleStartedAt.getTime(),
  };
}

/** How a module went, for the routing seam. */
async function gradeModule(
  questionIds: readonly string[],
  answers: Record<string, string>,
): Promise<{ correct: number; total: number }> {
  if (questionIds.length === 0) return { correct: 0, total: 0 };

  const questions = await prisma.question.findMany({
    where: { id: { in: [...questionIds] } },
    select: { id: true, correctAnswer: true, acceptedAnswers: true },
  });

  const correct = questions.filter((question) =>
    isAnswerCorrect(
      answers[question.id],
      question.correctAnswer,
      question.acceptedAnswers,
    ),
  ).length;

  return { correct, total: questions.length };
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

/**
 * Grade and close an attempt, writing a `TestResult`.
 *
 * The payload is folded in **only if the module it belongs to is still open**.
 * Once the clock has run out the stored answers are the answers, which is the
 * whole point of storing them as they were given.
 */
export async function submitAttempt(
  input: z.infer<typeof submitSchema>,
): Promise<SubmitAttemptResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission." };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const attempt = await prisma.testAttempt.findFirst({
    where: { id: parsed.data.attemptId, userId },
    select: {
      id: true,
      status: true,
      testId: true,
      answers: true,
      modulePlan: true,
      moduleIndex: true,
      moduleStartedAt: true,
      startedAt: true,
      test: { select: { durationMinutes: true } },
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

  const clock = readAttemptClock(attempt, attempt.test.durationMinutes, new Date());

  /*
   * A submission after the deadline is not refused — the student still gets
   * their score — but nothing it carries is accepted. Only what was saved while
   * the clock was running counts.
   */
  const answers = clock.expired
    ? storedAnswers(attempt.answers)
    : mergeModuleAnswers(storedAnswers(attempt.answers), parsed.data.answers, clock);

  if (!clock.expired) {
    await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: { answers },
    });
  }

  const graded = await gradeAndClose(attempt.id, userId);
  if (!graded.ok) return { ok: false, error: graded.error };

  revalidatePath("/dashboard");
  revalidatePath("/practice");

  return { ok: true, resultId: graded.resultId };
}

/* -------------------------------------------------------------------------- */
/* Grading                                                                     */
/* -------------------------------------------------------------------------- */

type GradeOutcome =
  | { ok: true; resultId: string }
  | { ok: false; error: string };

/**
 * Grade whatever is stored on the attempt and close it.
 *
 * Reads the answers from the row rather than taking them as an argument, so
 * there is exactly one thing that can be graded: what the server saved.
 */
async function gradeAndClose(
  attemptId: string,
  userId: string,
): Promise<GradeOutcome> {
  const attempt = await prisma.testAttempt.findFirst({
    where: { id: attemptId, userId },
    select: {
      id: true,
      testId: true,
      answers: true,
      modulePlan: true,
      startedAt: true,
      test: {
        select: {
          id: true,
          type: true,
          questions: {
            select: {
              id: true,
              correctAnswer: true,
              acceptedAnswers: true,
              skillRef: { select: { domain: { select: { section: true } } } },
            },
          },
        },
      },
    },
  });

  if (!attempt) return { ok: false, error: "Attempt not found." };

  const answers = storedAnswers(attempt.answers);
  const plan = parseModulePlan(attempt.modulePlan);

  /*
   * A modular sitting grades only the questions it actually planned. A test
   * whose bank could not fill Math must not score the student as if they had
   * left every Math question blank.
   */
  const planned = new Set(plan.flatMap((entry) => entry.questionIds));
  const questions =
    plan.length > 0
      ? attempt.test.questions.filter((question) => planned.has(question.id))
      : attempt.test.questions;

  const breakdown: Record<string, { answer: string | null; correct: boolean }> =
    {};
  const perQuestion: Array<{ section: MockSection; correct: boolean }> = [];
  let score = 0;

  for (const question of questions) {
    const submitted = answers[question.id] ?? null;
    const correct = isAnswerCorrect(
      submitted,
      question.correctAnswer,
      question.acceptedAnswers,
    );

    if (correct) score += 1;
    breakdown[question.id] = { answer: submitted, correct };

    const section = sectionOf(question.skillRef?.domain.section ?? null);
    if (section) perQuestion.push({ section, correct });
  }

  const totalQuestions = questions.length;

  /*
   * Section scores need every question to know which half of the exam it
   * belongs to. When they do — which is every question imported with a skill —
   * the sitting is scored section by section; otherwise it falls back to the
   * single-scale estimate practice tests have always used.
   */
  const sectioned =
    plan.length > 0 && perQuestion.length === totalQuestions && totalQuestions > 0;

  const mock = sectioned ? scoreMock(perQuestion) : null;

  const durationSeconds = Math.max(
    0,
    Math.round((Date.now() - attempt.startedAt.getTime()) / 1000),
  );

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.testResult.create({
      data: {
        userId,
        testId: attempt.testId,
        score,
        totalQuestions,
        scaledScore: mock
          ? mock.total
          : estimateScaledScore(score, totalQuestions, attempt.test.type),
        rwScore: mock?.readingWriting ?? null,
        mathScore: mock?.math ?? null,
        answersRecord: breakdown,
        durationSeconds,
      },
    });

    await tx.testAttempt.update({
      where: { id: attempt.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return created;
  });

  return { ok: true, resultId: result.id };
}
