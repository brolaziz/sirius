import { parseModulePlan } from "@/lib/mock";

/** Preserve order and deduplicate untrusted/legacy JSON without inventing IDs. */
export function questionIdsFrom(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string"))]
    : [];
}

export function attemptQuestionIds(attempt: {
  questionIds: unknown;
  modulePlan: unknown;
}, legacyIds: readonly string[] = []): string[] {
  const planned = parseModulePlan(attempt.modulePlan).flatMap((m) => m.questionIds);
  if (planned.length) return questionIdsFrom(planned);
  const fixed = questionIdsFrom(attempt.questionIds);
  return fixed.length ? fixed : [...legacyIds];
}

/** SQL IN does not preserve the attempt's question order. Missing rows are fatal. */
export function orderAttemptQuestions<T extends { id: string }>(ids: readonly string[], rows: T[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => {
    const question = byId.get(id);
    if (!question) throw new Error("An attempt question is missing. No result was written.");
    return question;
  });
}
