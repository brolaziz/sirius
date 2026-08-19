/**
 * Digital SAT domain rules: timing, grading and score estimation.
 *
 * Kept in one module so the simulator, the results screen and the dashboard all
 * agree on what a score means.
 */

import type { TestType } from "@/lib/generated/prisma/enums";

/**
 * Official time allowances, in minutes, per module.
 * Reading & Writing: 2 modules x 32 min. Math: 2 modules x 35 min.
 */
export const MODULE_MINUTES = {
  READING: 32,
  MATH: 35,
} as const;

/** Question counts per module on the real test. */
export const MODULE_QUESTION_COUNT = {
  READING: 27,
  MATH: 22,
} as const;

/** The scaled-score range of a single section. */
export const SECTION_SCORE_MIN = 200;
export const SECTION_SCORE_MAX = 800;

/** The scaled-score range of a full test. */
export const TOTAL_SCORE_MIN = 400;
export const TOTAL_SCORE_MAX = 1600;

/**
 * How many section scores a test type produces — used to scale a raw result on
 * to the right range.
 */
function sectionCount(type: TestType): 1 | 2 {
  return type === "FULL" ? 2 : 1;
}

/**
 * Normalise a student's typed answer for comparison.
 *
 * Multiple choice is a letter, compared case-insensitively. SPR answers are
 * typed freely, so we strip whitespace and normalise a leading "+" and unicode
 * minus, but we deliberately do **not** evaluate fractions — "3/4" and "0.75"
 * are treated as different strings. Accepting both means storing every
 * equivalent form in `correctAnswer`, which keeps grading predictable and
 * inspectable rather than hiding arithmetic in the grader.
 */
export function normaliseAnswer(answer: string): string {
  return answer.trim().replace(/^\+/, "").replace(/−/g, "-").toLowerCase();
}

/**
 * Grade one answer.
 *
 * `correctAnswer` may list several accepted values separated by `|`, which is
 * how an importer expresses "0.75 or 3/4".
 */
export function isAnswerCorrect(
  submitted: string | null | undefined,
  correctAnswer: string,
): boolean {
  if (!submitted) return false;
  const accepted = correctAnswer.split("|").map(normaliseAnswer);
  return accepted.includes(normaliseAnswer(submitted));
}

export interface GradedQuestion {
  questionId: string;
  /** What the student chose, or null if they left it blank. */
  answer: string | null;
  correctAnswer: string;
  correct: boolean;
}

export interface GradedResult {
  /** Correct answers. */
  score: number;
  totalQuestions: number;
  /** 0–1. */
  accuracy: number;
  /** Estimated score on the SAT scale. See `estimateScaledScore`. */
  scaledScore: number;
  /** Per-question detail, persisted as `TestResult.answersRecord`. */
  breakdown: Record<string, { answer: string | null; correct: boolean }>;
}

/**
 * Estimate a scaled SAT score from a raw score.
 *
 * The College Board's real conversion is a per-test equating curve that is not
 * published, and it is not linear — the first and last few raw points move the
 * scaled score less than the middle ones. This is a deliberately simple
 * approximation: linear across the range, rounded to the nearest 10 (the
 * granularity real scores are reported at).
 *
 * Treat it as directional feedback for a practice session, not a predicted
 * official score. Every surface that shows it should label it an estimate.
 */
export function estimateScaledScore(
  correct: number,
  total: number,
  type: TestType,
): number {
  if (total <= 0) return TOTAL_SCORE_MIN;

  const accuracy = Math.min(Math.max(correct / total, 0), 1);
  const sections = sectionCount(type);

  const min = SECTION_SCORE_MIN * sections;
  const max = SECTION_SCORE_MAX * sections;

  const raw = min + (max - min) * accuracy;
  return Math.round(raw / 10) * 10;
}

/** Grade a whole attempt. */
export function gradeAttempt(
  questions: Array<{
    id: string;
    correctAnswer: string;
  }>,
  answers: Record<string, string | null | undefined>,
  type: TestType,
): GradedResult {
  const breakdown: GradedResult["breakdown"] = {};
  let score = 0;

  for (const question of questions) {
    const submitted = answers[question.id] ?? null;
    const correct = isAnswerCorrect(submitted, question.correctAnswer);
    if (correct) score += 1;
    breakdown[question.id] = { answer: submitted, correct };
  }

  const totalQuestions = questions.length;

  return {
    score,
    totalQuestions,
    accuracy: totalQuestions > 0 ? score / totalQuestions : 0,
    scaledScore: estimateScaledScore(score, totalQuestions, type),
    breakdown,
  };
}

/** Human label for a test type. */
export function testTypeLabel(type: TestType): string {
  switch (type) {
    case "READING":
      return "Reading & Writing";
    case "MATH":
      return "Math";
    case "FULL":
      return "Full test";
  }
}

/** `1_920` seconds -> `"32:00"`. Used by the simulator countdown. */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const pad = (value: number) => value.toString().padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}
