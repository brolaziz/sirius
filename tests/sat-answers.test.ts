/**
 * Answer matching — the part of grading a student can argue with.
 *
 * The cases below are the ones that decide whether a correct answer typed in an
 * unexpected form is marked wrong. Getting that wrong is worse than a crash: it
 * is invisible, and the student concludes they do not understand the topic.
 */

import { describe, expect, it } from "vitest";

import {
  answersAreEquivalent,
  gradeAttempt,
  isAnswerCorrect,
  isNumericAnswer,
  normaliseAnswer,
} from "@/lib/sat";

describe("normaliseAnswer", () => {
  it("folds case, whitespace, a leading plus and the unicode minus", () => {
    expect(normaliseAnswer("  B ")).toBe("b");
    expect(normaliseAnswer("+5")).toBe("5");
    expect(normaliseAnswer("−5")).toBe("-5");
  });
});

describe("isNumericAnswer", () => {
  it("accepts the forms a grid-in allows", () => {
    for (const value of ["285", "0", "-4", ".35", "0.35", "7/20", "-3/4"]) {
      expect(isNumericAnswer(value), value).toBe(true);
    }
  });

  it("rejects prose, percentages and a zero denominator", () => {
    for (const value of ["", "twelve", "35%", "3/0", "0.35 or 7/20"]) {
      expect(isNumericAnswer(value), value).toBe(false);
    }
  });
});

describe("answersAreEquivalent", () => {
  it("matches the same value written differently", () => {
    expect(answersAreEquivalent("7/20", "0.35")).toBe(true);
    expect(answersAreEquivalent("0.35", "7/20")).toBe(true);
    expect(answersAreEquivalent("0.350", "0.35")).toBe(true);
    expect(answersAreEquivalent("1,200", "1200")).toBe(true);
    expect(answersAreEquivalent("$18", "18")).toBe(true);
  });

  it("accepts a truncated or rounded form of a value that does not fit the grid", () => {
    expect(answersAreEquivalent("0.666", "2/3")).toBe(true);
    expect(answersAreEquivalent("0.667", "2/3")).toBe(true);
    expect(answersAreEquivalent(".666", "2/3")).toBe(true);
  });

  it("refuses an approximation that is too coarse to be the answer", () => {
    // Two significant digits is not an accepted way to write 2/3.
    expect(answersAreEquivalent("0.66", "2/3")).toBe(false);
    expect(answersAreEquivalent("0.7", "2/3")).toBe(false);
  });

  it("does not let the rounding rule swallow the integer part", () => {
    // The guard that stops "285" counting as 285.4.
    expect(answersAreEquivalent("285", "285.4")).toBe(false);
    expect(answersAreEquivalent("285.4", "285.4")).toBe(true);
  });

  it("treats a percentage as a different answer, not as a number", () => {
    expect(answersAreEquivalent("35%", "35")).toBe(false);
  });

  it("keeps letters textual", () => {
    expect(answersAreEquivalent("b", "B")).toBe(true);
    expect(answersAreEquivalent("C", "B")).toBe(false);
  });
});

describe("isAnswerCorrect", () => {
  it("prefers the question's accepted list when it has one", () => {
    expect(isAnswerCorrect("7/20", "0.35", ["0.35", "7/20"])).toBe(true);
    expect(isAnswerCorrect("0.35", "0.35", ["0.35", "7/20"])).toBe(true);
    expect(isAnswerCorrect("0.4", "0.35", ["0.35", "7/20"])).toBe(false);
  });

  it("falls back to splitting correctAnswer on | for rows without a list", () => {
    expect(isAnswerCorrect("0.75", "3/4|0.75")).toBe(true);
    expect(isAnswerCorrect("3/4", "3/4|0.75", [])).toBe(true);
    expect(isAnswerCorrect("0.8", "3/4|0.75")).toBe(false);
  });

  it("counts a blank as wrong rather than throwing", () => {
    expect(isAnswerCorrect(null, "B")).toBe(false);
    expect(isAnswerCorrect(undefined, "B")).toBe(false);
    expect(isAnswerCorrect("", "B")).toBe(false);
  });
});

describe("gradeAttempt", () => {
  it("grades an SPR question against its accepted forms", () => {
    const graded = gradeAttempt(
      [
        { id: "mc", correctAnswer: "B" },
        { id: "spr", correctAnswer: "0.35", acceptedAnswers: ["0.35", "7/20"] },
      ],
      { mc: "b", spr: "7/20" },
      "MATH",
    );

    expect(graded.score).toBe(2);
    expect(graded.breakdown.spr).toEqual({ answer: "7/20", correct: true });
  });

  it("records a blank answer as null and wrong", () => {
    const graded = gradeAttempt([{ id: "spr", correctAnswer: "12" }], {}, "MATH");

    expect(graded.score).toBe(0);
    expect(graded.breakdown.spr).toEqual({ answer: null, correct: false });
  });
});
