import { describe, expect, it } from "vitest";
import { latestQuestionEvidence, prioritizeFromEvidence, summarizePlanEvidence, parsePlanEvidence, type QuestionEvidence } from "@/lib/study-evidence";
const skills = [{ id: "s", code: "skill", examShare: 0.2, availableQuestions: 20 }];
const evidence = (count: number, correct = false): QuestionEvidence[] => Array.from({ length: count }, (_, n) => ({ questionId: `q${n}`, skillId: "s", answered: true, correct, at: new Date(n * 1000) }));
describe("evidence-based practice scheduling", () => {
  it("does not infer a weakness from too little or repeated evidence", () => {
    expect(prioritizeFromEvidence(skills, evidence(4))[0].examShare).toBe(0.2);
    const repeated = evidence(20).map((r) => ({ ...r, questionId: "same" }));
    expect(prioritizeFromEvidence(skills, repeated)[0].examShare).toBe(0.2);
  });
  it("keeps the content cap and limits the priority increase to 50 percent", () => {
    const prioritized = prioritizeFromEvidence(skills, evidence(5))[0];
    expect(prioritized.examShare).toBeCloseTo(0.3);
    expect(prioritized.availableQuestions).toBe(20);
    expect(prioritizeFromEvidence(skills, evidence(5, true))[0].examShare).toBe(0.2);
  });
  it("uses the latest graded answer and excludes blanks from knowledge evidence", () => {
    const rows = [...evidence(5), { questionId: "q0", skillId: "s", answered: true, correct: true, at: new Date(10_000) }];
    expect(latestQuestionEvidence(rows).find((r) => r.questionId === "q0")?.correct).toBe(true);
    expect(prioritizeFromEvidence(skills, evidence(5).map((r) => ({ ...r, answered: false })))[0].examShare).toBe(0.2);
  });
  it("keeps a readable historical reason after later answers change the schedule", () => {
    const snapshot = JSON.stringify(summarizePlanEvidence([{ ...skills[0], name: "Linear equations", nameUz: "Chiziqli tenglamalar" }], evidence(5)));
    const next = summarizePlanEvidence(skills, evidence(5, true));
    expect(next[0].multiplier).toBe(1);
    expect(parsePlanEvidence(JSON.parse(snapshot))[0]).toMatchObject({ name: "Linear equations", nameUz: "Chiziqli tenglamalar", answered: 5, correct: 0, multiplier: 1.5 });
    expect(parsePlanEvidence(null)).toEqual([]);
  });
});
