import type { PrismaClient, Prisma } from "@/lib/generated/prisma/client";
import { attemptQuestionIds, orderAttemptQuestions, questionIdsFrom } from "@/lib/attempt-questions";
import { assembleMockFromBank, MOCK_MODULES, questionsNeeded, mergeModuleAnswers, parseModulePlan, readAttemptClock, scoreMock } from "@/lib/mock";
import { estimateScaledScore, isAnswerCorrect } from "@/lib/sat";
import { recordLearningEvent } from "@/lib/learning-events";

function answerMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}
type Outcome = { ok: true; resultId?: string; moduleIndex?: number; moduleStartedAtMs?: number } | { ok: false; error: string; conflict?: boolean };
type Write = { kind: "save" | "advance"; revision: number; moduleIndex: number; answers: Record<string, string>; flagged: string[] }
  | { kind: "submit"; revision: number; moduleIndex: number; answers: Record<string, string> };

export async function beginAttempt(db: PrismaClient, userId: string, testId: string) {
  return db.$transaction(async (tx) => {
    // Serialize starts before checking for an existing attempt.
    await tx.$queryRaw`SELECT id FROM tests WHERE id = ${testId} FOR UPDATE`;
    const test = await tx.test.findFirst({ where: { id: testId, isPublished: true } });
    if (!test) return { ok: false as const, error: "That test is not available." };
    const existing = await tx.testAttempt.findFirst({ where: { userId, testId, status: "IN_PROGRESS" }, orderBy: { startedAt: "desc" } });
    if (existing) return { ok: true as const, attemptId: existing.id, startedAtMs: existing.startedAt.getTime() };
    const pool = await tx.question.findMany({
      where: test.type === "FULL" ? { skillRef: { isNot: null }, reviewStatus: "VERIFIED" } : { testId, reviewStatus: "VERIFIED" },
      orderBy: [{ module: "asc" }, { order: "asc" }, { id: "asc" }],
      select: { id: true, module: true, skillRef: { select: { domain: { select: { section: true } } } } },
    });
    const plan = test.type === "FULL" ? assembleMockFromBank(pool.map((q) => ({
      id: q.id, module: q.module, section: q.skillRef?.domain.section === "RW" ? "READING" : q.skillRef?.domain.section === "MATH" ? "MATH" : null,
    }))) : [];
    if (test.type === "FULL" && !MOCK_MODULES.every((spec) => plan.find((m) => m.module === spec.index)?.questionIds.length === questionsNeeded(spec))) {
      return { ok: false as const, error: "The full mock is not ready yet. Please use topic practice while the question bank is completed." };
    }
    const ids = plan.length ? plan.flatMap((m) => m.questionIds) : pool.map((q) => q.id);
    if (!ids.length) return { ok: false as const, error: "This test has no questions yet." };
    const created = await tx.testAttempt.create({ data: {
      userId, testId, questionIds: ids, durationMinutes: test.durationMinutes,
      modulePlan: plan.length ? plan : undefined, moduleStartedAt: new Date(),
    } });
    await recordLearningEvent(tx, userId, "mock_started", created.id);
    return { ok: true as const, attemptId: created.id, startedAtMs: created.startedAt.getTime() };
  }, { timeout: 30_000 });
}

/** Every writer locks the same owned row; grading and closure are atomic. */
export async function writeAttempt(db: PrismaClient, userId: string, attemptId: string, input: Write): Promise<Outcome> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM test_attempts WHERE id = ${attemptId} AND user_id = ${userId} FOR UPDATE`;
    const attempt = await tx.testAttempt.findFirst({ where: { id: attemptId, userId }, include: {
      result: { select: { id: true } }, test: { select: { type: true, durationMinutes: true } },
    } });
    if (!attempt) return { ok: false, error: "Attempt not found." };
    if (attempt.status === "COMPLETED") return input.kind === "submit" && attempt.result
      ? { ok: true, resultId: attempt.result.id } : { ok: false, error: "Attempt is no longer open." };
    if (attempt.status !== "IN_PROGRESS") return { ok: false, error: "Attempt is no longer open." };
    if (attempt.moduleIndex !== input.moduleIndex) return { ok: false, conflict: true, error: "The module changed. Reload to continue." };
    if (input.revision <= attempt.progressRevision) return { ok: false, conflict: true, error: "Newer progress has already been saved. Reload this attempt." };
    const legacy = questionIdsFrom(attempt.questionIds).length || parseModulePlan(attempt.modulePlan).length ? []
      : (await tx.question.findMany({ where: { testId: attempt.testId }, orderBy: [{ module: "asc" }, { order: "asc" }], select: { id: true } })).map((q) => q.id);
    const ids = attemptQuestionIds(attempt, legacy);
    const clock = readAttemptClock(attempt, attempt.durationMinutes ?? attempt.test.durationMinutes, new Date());
    if (input.kind === "save" && clock.expired) return { ok: false, error: "That module's time is up." };
    const allowed = new Set(clock.modular ? clock.questionIds : ids);
    const incoming = Object.fromEntries(Object.entries(input.answers).filter(([id]) => allowed.has(id)));
    const answers = clock.expired ? answerMap(attempt.answers) : mergeModuleAnswers(answerMap(attempt.answers), incoming, clock);
    const storedFlagged = questionIdsFrom(attempt.flagged);
    const flagged = input.kind === "submit" ? storedFlagged : [...storedFlagged.filter((id) => !allowed.has(id)), ...input.flagged.filter((id) => allowed.has(id))];
    if (input.kind === "save") {
      await tx.testAttempt.update({ where: { id: attempt.id }, data: { answers, flagged, progressRevision: input.revision } });
      return { ok: true };
    }
    if (input.kind === "advance") {
      if (!clock.modular) return { ok: false, error: "This test has no modules to advance." };
      if (clock.hasNext) {
        const moduleStartedAt = new Date();
        await tx.testAttempt.update({ where: { id: attempt.id }, data: { answers, flagged, progressRevision: input.revision, moduleIndex: attempt.moduleIndex + 1, moduleStartedAt } });
        return { ok: true, moduleIndex: attempt.moduleIndex + 1, moduleStartedAtMs: moduleStartedAt.getTime() };
      }
    }
    return closeAttempt(tx, attempt, ids, answers);
  }, { timeout: 30_000 });
}

async function closeAttempt(tx: Prisma.TransactionClient, attempt: { id: string; userId: string; testId: string; modulePlan: unknown; startedAt: Date; test: { type: "READING" | "MATH" | "FULL" } }, ids: string[], answers: Record<string, string>): Promise<Outcome> {
  if (!ids.length) return { ok: false, error: "This attempt has no questions to grade." };
  const questions = orderAttemptQuestions(ids, await tx.question.findMany({ where: { id: { in: ids } }, select: {
    id: true, correctAnswer: true, acceptedAnswers: true, skillRef: { select: { domain: { select: { section: true } } } },
  } }));
  const breakdown: Record<string, { answer: string | null; correct: boolean }> = {};
  const outcomes: Array<{ section: "READING" | "MATH"; correct: boolean }> = [];
  let score = 0;
  for (const q of questions) {
    const answer = answers[q.id] ?? null;
    const correct = isAnswerCorrect(answer, q.correctAnswer, q.acceptedAnswers);
    breakdown[q.id] = { answer, correct };
    if (correct) score++;
    const section = q.skillRef?.domain.section;
    if (section) outcomes.push({ section: section === "RW" ? "READING" : "MATH", correct });
  }
  const mock = parseModulePlan(attempt.modulePlan).length && outcomes.length === ids.length ? scoreMock(outcomes) : null;
  const result = await tx.testResult.create({ data: {
    attemptId: attempt.id, userId: attempt.userId, testId: attempt.testId, questionIds: ids,
    score, totalQuestions: ids.length, scaledScore: mock?.total ?? estimateScaledScore(score, ids.length, attempt.test.type),
    rwScore: mock?.readingWriting ?? null, mathScore: mock?.math ?? null, answersRecord: breakdown,
    durationSeconds: Math.max(0, Math.round((Date.now() - attempt.startedAt.getTime()) / 1000)),
  } });
  await tx.testAttempt.update({ where: { id: attempt.id }, data: { answers, status: "COMPLETED", completedAt: new Date() } });
  await recordLearningEvent(tx, attempt.userId, "mock_completed", attempt.id);
  return { ok: true, resultId: result.id };
}
