import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { isAnswerCorrect } from "@/lib/sat";
import { questionIdsFrom } from "@/lib/attempt-questions";
import { taskWindow } from "@/lib/study-plan";
import { recordLearningEvent } from "@/lib/learning-events";
import { practiceAnswerSchema, type PracticeAnswerInput } from "@/lib/validation/practice-answer";

async function recordCompletedTasks(tx: Prisma.TransactionClient, userId: string, skillId: string | null, at: Date) {
  if (!skillId) return;
  const plan = await tx.studyPlan.findFirst({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } });
  if (!plan) return;
  const tasks = await tx.studyPlanTask.findMany({ where: { planId: plan.id, skillId, startDate: { lte: at } },
    select: { id: true, startDate: true, targetQuestions: true } });
  for (const task of tasks) {
    const week = taskWindow(task);
    if (at >= week.until || task.targetQuestions <= 0) continue;
    const answered = await tx.practiceResponse.count({ where: { session: { userId }, question: { skillId }, answeredAt: { gte: week.from, lt: week.until } } });
    if (answered >= task.targetQuestions) await recordLearningEvent(tx, userId, "plan_task_completed", task.id);
  }
}

/** Answer and finish share the owner-scoped session lock; the first answer wins. */
export async function answerOwnedPractice(db: PrismaClient, userId: string, input: PracticeAnswerInput) {
  const parsed = practiceAnswerSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid answer." };
  const data = parsed.data;
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM practice_sessions WHERE id = ${data.sessionId} AND user_id = ${userId} FOR UPDATE`;
    const session = await tx.practiceSession.findFirst({ where: { id: data.sessionId, userId }, select: { completedAt: true, questionIds: true } });
    if (!session) return { ok: false as const, error: "Session not found." };
    if (!questionIdsFrom(session.questionIds).includes(data.questionId)) return { ok: false as const, error: "That question is not part of this session." };
    const existing = await tx.practiceResponse.findUnique({ where: { sessionId_questionId: { sessionId: data.sessionId, questionId: data.questionId } }, select: { isCorrect: true, answer: true, timeSpentSeconds: true } });
    if (session.completedAt && !existing) return { ok: false as const, error: "This session is already finished." };
    const question = await tx.question.findUnique({ where: { id: data.questionId }, select: { correctAnswer: true, acceptedAnswers: true, explanation: true, skillId: true } });
    if (!question) return { ok: false as const, error: "Question not found." };
    if (existing) return { ok: true as const, ...existing, correctAnswer: question.correctAnswer, explanation: question.explanation };
    // Serialize answers across this user's sessions when checking plan thresholds.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const response = await tx.practiceResponse.create({ data: { ...data, isCorrect: isAnswerCorrect(data.answer, question.correctAnswer, question.acceptedAnswers) } });
    await recordCompletedTasks(tx, userId, question.skillId, response.answeredAt);
    return { ok: true as const, answer: response.answer, timeSpentSeconds: response.timeSpentSeconds, isCorrect: response.isCorrect, correctAnswer: question.correctAnswer, explanation: question.explanation };
  });
}

export async function finishOwnedPractice(db: PrismaClient, userId: string, id: string) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM practice_sessions WHERE id = ${id} AND user_id = ${userId} FOR UPDATE`;
    const session = await tx.practiceSession.findFirst({ where: { id, userId }, select: { completedAt: true, _count: { select: { responses: true } } } });
    if (!session) return { ok: false as const, error: "Session not found." };
    if (session.completedAt) return { ok: true as const };
    await tx.practiceSession.update({ where: { id }, data: { completedAt: new Date() } });
    // Ending an empty session does not imply a meaningful learning activity.
    if (session._count.responses > 0) await recordLearningEvent(tx, userId, "practice_completed", id);
    return { ok: true as const };
  });
}

/** Records visible feedback only for a graded question in the caller's session. */
export async function recordPracticeExplanation(db: PrismaClient, userId: string, sessionId: string, questionId: string) {
  return db.$transaction(async (tx) => {
    const response = await tx.practiceResponse.findFirst({ where: { sessionId, questionId, session: { userId } }, select: { question: { select: { explanation: true } } } });
    if (!response?.question.explanation?.trim()) return { ok: false as const, error: "Explanation is not available." };
    await recordLearningEvent(tx, userId, "explanation_opened", `${sessionId}:${questionId}`);
    return { ok: true as const };
  });
}
