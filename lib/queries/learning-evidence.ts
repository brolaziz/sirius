import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { latestQuestionEvidence, type QuestionEvidence } from "@/lib/study-evidence";

/** Owner-scoped graded outcomes; question content and answer keys are never selected. */
export async function getRecentQuestionEvidence(userId: string, db: PrismaClient = prisma): Promise<QuestionEvidence[]> {
  if (db === prisma && !isDatabaseConfigured()) return [];
  const [responses, results] = await Promise.all([
    db.practiceResponse.findMany({ where: { session: { userId } }, orderBy: { answeredAt: "desc" }, take: 500,
      select: { questionId: true, answer: true, isCorrect: true, answeredAt: true, question: { select: { skillId: true } } } }),
    db.testResult.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20,
      select: { answersRecord: true, createdAt: true } }),
  ]);
  const rows: Array<Omit<QuestionEvidence, "skillId">> = [];
  for (const result of results) {
    if (!result.answersRecord || typeof result.answersRecord !== "object" || Array.isArray(result.answersRecord)) continue;
    for (const [questionId, record] of Object.entries(result.answersRecord)) {
      if (!record || typeof record !== "object" || Array.isArray(record) || typeof record.correct !== "boolean") continue;
      rows.push({ questionId, correct: record.correct, answered: typeof record.answer === "string" && record.answer.trim().length > 0, at: result.createdAt });
    }
  }
  const questions = rows.length ? await db.question.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.questionId))] } }, select: { id: true, skillId: true } }) : [];
  const byId = new Map(questions.map((q) => [q.id, q.skillId]));
  return latestQuestionEvidence([
    ...responses.map((r) => ({ questionId: r.questionId, skillId: r.question.skillId, correct: r.isCorrect, answered: !!r.answer?.trim(), at: r.answeredAt })),
    ...rows.flatMap((r) => byId.has(r.questionId) ? [{ ...r, skillId: byId.get(r.questionId) ?? null }] : []),
  ]);
}

export async function getMistakeQuestionIds(userId: string, db: PrismaClient = prisma): Promise<string[]> {
  const ids = (await getRecentQuestionEvidence(userId, db)).filter((row) => !row.correct).map((row) => row.questionId);
  const available = await db.question.findMany({ where: { id: { in: ids }, reviewStatus: "VERIFIED" }, select: { id: true } });
  const allowed = new Set(available.map((q) => q.id));
  return ids.filter((id) => allowed.has(id));
}
