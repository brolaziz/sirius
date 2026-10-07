import type { PlanSkill } from "@/lib/study-plan";
import { z } from "zod";

const planEvidenceSchema = z.object({ code: z.string(), name: z.string(), nameUz: z.string().nullable(), answered: z.number().int().nonnegative(), correct: z.number().int().nonnegative(), multiplier: z.number().min(1).max(1.5) });
export type PlanEvidence = z.infer<typeof planEvidenceSchema>;
export function parsePlanEvidence(value: unknown): PlanEvidence[] {
  const parsed = z.array(planEvidenceSchema).max(100).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export interface QuestionEvidence { questionId: string; skillId: string | null; correct: boolean; answered: boolean; at: Date }
export function latestQuestionEvidence(rows: QuestionEvidence[]): QuestionEvidence[] {
  const latest = new Map<string, QuestionEvidence>();
  for (const row of [...rows].sort((a, b) => b.at.getTime() - a.at.getTime())) {
    if (!latest.has(row.questionId)) latest.set(row.questionId, row);
  }
  return [...latest.values()];
}
/** A bounded scheduling preference after five distinct answered questions; no mastery claim. */
export function prioritizeFromEvidence(skills: Array<PlanSkill & { id: string }>, evidence: QuestionEvidence[]): PlanSkill[] {
  const summary = summarizePlanEvidence(skills, evidence);
  const multipliers = new Map(summary.map((row) => [row.code, row.multiplier]));
  return skills.map((skill) => ({ code: skill.code, availableQuestions: skill.availableQuestions, examShare: skill.examShare * (multipliers.get(skill.code) ?? 1) }));
}

/** Snapshot the reason at plan creation; later answers cannot rewrite it. */
export function summarizePlanEvidence(skills: Array<PlanSkill & { id: string; name?: string; nameUz?: string | null }>, evidence: QuestionEvidence[]): PlanEvidence[] {
  const tally = new Map<string, { n: number; correct: number }>();
  for (const row of latestQuestionEvidence(evidence)) {
    if (!row.skillId || !row.answered) continue;
    const count = tally.get(row.skillId) ?? { n: 0, correct: 0 };
    count.n++; if (row.correct) count.correct++;
    tally.set(row.skillId, count);
  }
  return skills.map((skill) => {
    const row = tally.get(skill.id);
    const multiplier = row && row.n >= 5 ? 1 + 0.5 * (1 - row.correct / row.n) : 1;
    return { code: skill.code, name: skill.name ?? skill.code, nameUz: skill.nameUz ?? null, answered: row?.n ?? 0, correct: row?.correct ?? 0, multiplier };
  });
}
