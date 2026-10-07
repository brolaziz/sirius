import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma/client";

export interface LearningHistoryEntry {
  id: string; kind: "test" | "practice" | "review"; title: string; titleUz: string | null;
  href: string; finishedAt: Date; correct: number; answered: number;
  scaledScore: number | null; durationSeconds: number | null;
}
/** A bounded, owner-scoped timeline. Untimed practice never receives a scaled score. */
export async function getLearningHistory(userId: string, limit = 20, db: PrismaClient = prisma): Promise<LearningHistoryEntry[]> {
  if (db === prisma && !isDatabaseConfigured()) return [];
  const take = Math.min(50, Math.max(1, limit));
  const [results, sessions] = await Promise.all([
    db.testResult.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take,
      select: { id: true, createdAt: true, score: true, totalQuestions: true, scaledScore: true, durationSeconds: true,
        test: { select: { title: true } } } }),
    db.practiceSession.findMany({ where: { userId, completedAt: { not: null } }, orderBy: { completedAt: "desc" }, take,
      select: { id: true, source: true, completedAt: true, skill: { select: { name: true, nameUz: true } },
        responses: { select: { isCorrect: true, timeSpentSeconds: true } } } }),
  ]);
  return [
    ...results.map((r): LearningHistoryEntry => ({ id: r.id, kind: "test", title: r.test.title, titleUz: null,
      href: `/practice/results/${r.id}`, finishedAt: r.createdAt, correct: r.score, answered: r.totalQuestions,
      scaledScore: r.scaledScore, durationSeconds: r.durationSeconds })),
    ...sessions.map((s): LearningHistoryEntry => ({ id: s.id, kind: s.source === "REVIEW" ? "review" : "practice", title: s.skill?.name ?? "", titleUz: s.skill?.nameUz ?? null,
      href: `/practice/session/${s.id}`, finishedAt: s.completedAt!, correct: s.responses.filter((r) => r.isCorrect).length,
      answered: s.responses.length, scaledScore: null, durationSeconds: s.responses.reduce((n, r) => n + r.timeSpentSeconds, 0) })),
  ].sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime()).slice(0, take);
}

/** Coverage describes content present, never claims that it is teacher-verified. */
export async function getContentCoverage() {
  if (!isDatabaseConfigured()) return [];
  const skills = await prisma.skill.findMany({ orderBy: [{ domain: { order: "asc" } }, { order: "asc" }],
    select: { code: true, name: true, nameUz: true, questions: { where: { reviewStatus: { not: "REJECTED" } }, select: { explanation: true, difficulty: true, module: true, reviewStatus: true } } } });
  return skills.map((s) => ({ code: s.code, name: s.name, nameUz: s.nameUz,
    total: s.questions.length, explained: s.questions.filter((q) => q.explanation?.trim()).length,
    rated: s.questions.filter((q) => q.difficulty !== null).length,
    verified: s.questions.filter((q) => q.reviewStatus === "VERIFIED").length,
    module2: s.questions.filter((q) => q.module === "MODULE_2").length }));
}
