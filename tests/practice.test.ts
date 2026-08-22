/**
 * Practice-mode rules.
 *
 * The selection test is the one that matters: with a bank this small, a
 * student meets the same question again quickly, and the difference between
 * "unseen first" and "whatever the database returned" is the difference between
 * practice and a memory test.
 */

import { describe, expect, it } from "vitest";

import {
  DEFAULT_SESSION_LENGTH,
  MIN_ANSWERS_FOR_WEAKNESS,
  rankWeakSkills,
  selectPracticeQuestions,
  sessionLength,
  summarisePractice,
  type QuestionHistory,
} from "@/lib/practice";

const candidates = ["q1", "q2", "q3", "q4", "q5"];

function history(
  entries: Record<string, { at: number; times?: number }>,
): Map<string, QuestionHistory> {
  return new Map(
    Object.entries(entries).map(([id, value]) => [
      id,
      { lastAnsweredAt: value.at, timesAnswered: value.times ?? 1 },
    ]),
  );
}

describe("selectPracticeQuestions", () => {
  it("asks the never-seen questions first", () => {
    const seen = history({ q1: { at: 1_000 }, q2: { at: 2_000 } });

    expect(selectPracticeQuestions(candidates, seen, 3)).toEqual([
      "q3",
      "q4",
      "q5",
    ]);
  });

  it("comes back to the oldest answer once everything has been seen", () => {
    const seen = history({
      q1: { at: 5_000 },
      q2: { at: 1_000 },
      q3: { at: 3_000 },
      q4: { at: 4_000 },
      q5: { at: 2_000 },
    });

    expect(selectPracticeQuestions(candidates, seen, 3)).toEqual([
      "q2",
      "q5",
      "q3",
    ]);
  });

  it("prefers the question answered fewer times when the dates tie", () => {
    const seen = new Map<string, QuestionHistory>([
      ["q1", { lastAnsweredAt: 1_000, timesAnswered: 3 }],
      ["q2", { lastAnsweredAt: 1_000, timesAnswered: 1 }],
    ]);

    expect(selectPracticeQuestions(["q1", "q2"], seen, 1)).toEqual(["q2"]);
  });

  it("keeps bank order between two questions nobody has answered", () => {
    expect(selectPracticeQuestions(candidates, new Map(), 5)).toEqual(candidates);
  });

  it("never asks for more than there are", () => {
    expect(selectPracticeQuestions(candidates, new Map(), 99)).toHaveLength(5);
    expect(selectPracticeQuestions(candidates, new Map(), 0)).toEqual([]);
    expect(selectPracticeQuestions([], new Map(), 5)).toEqual([]);
  });

  it("is deterministic", () => {
    const seen = history({ q2: { at: 10 }, q4: { at: 20 } });
    expect(selectPracticeQuestions(candidates, seen, 4)).toEqual(
      selectPracticeQuestions(candidates, seen, 4),
    );
  });
});

describe("sessionLength", () => {
  it("uses the default when the student picked a topic", () => {
    expect(sessionLength(50)).toBe(DEFAULT_SESSION_LENGTH);
  });

  it("never asks for more questions than the bank holds", () => {
    expect(sessionLength(4)).toBe(4);
    expect(sessionLength(0)).toBe(0);
  });

  it("asks for what is left of a plan task", () => {
    expect(sessionLength(50, 3)).toBe(3);
    expect(sessionLength(2, 3)).toBe(2);
  });

  it("still opens a session for a task that is already done", () => {
    expect(sessionLength(50, 0)).toBe(1);
    expect(sessionLength(50, -4)).toBe(1);
  });
});

describe("summarisePractice", () => {
  it("counts an empty session as zero rather than NaN", () => {
    expect(summarisePractice([])).toEqual({
      answered: 0,
      correct: 0,
      accuracy: 0,
      totalSeconds: 0,
      averageSeconds: 0,
    });
  });

  it("summarises a mixed session", () => {
    const summary = summarisePractice([
      { isCorrect: true, timeSpentSeconds: 30 },
      { isCorrect: false, timeSpentSeconds: 90 },
      { isCorrect: true, timeSpentSeconds: 60 },
      { isCorrect: true, timeSpentSeconds: 60 },
    ]);

    expect(summary.answered).toBe(4);
    expect(summary.correct).toBe(3);
    expect(summary.accuracy).toBe(0.75);
    expect(summary.totalSeconds).toBe(240);
    expect(summary.averageSeconds).toBe(60);
  });
});

describe("rankWeakSkills", () => {
  it("leaves out skills with too little evidence to judge", () => {
    const ranked = rankWeakSkills([
      { skillCode: "A", answered: 1, correct: 0 },
      { skillCode: "B", answered: MIN_ANSWERS_FOR_WEAKNESS, correct: 1 },
    ]);

    expect(ranked.map((skill) => skill.skillCode)).toEqual(["B"]);
  });

  it("puts the worst accuracy first", () => {
    const ranked = rankWeakSkills([
      { skillCode: "A", answered: 10, correct: 8 },
      { skillCode: "B", answered: 10, correct: 3 },
      { skillCode: "C", answered: 10, correct: 5 },
    ]);

    expect(ranked.map((skill) => skill.skillCode)).toEqual(["B", "C", "A"]);
    expect(ranked[0].accuracy).toBeCloseTo(0.3);
  });

  it("breaks a tie with the skill there is more evidence for", () => {
    const ranked = rankWeakSkills([
      { skillCode: "A", answered: 4, correct: 2 },
      { skillCode: "B", answered: 20, correct: 10 },
    ]);

    expect(ranked.map((skill) => skill.skillCode)).toEqual(["B", "A"]);
  });
});
