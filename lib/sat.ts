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
 * Normalise a student's typed answer for textual comparison.
 *
 * Multiple choice is a letter, compared case-insensitively. SPR answers are
 * typed freely, so this strips whitespace and normalises a leading "+" and the
 * unicode minus sign. It is purely textual — arithmetic equivalence is a
 * separate step, in `answersAreEquivalent`.
 */
export function normaliseAnswer(answer: string): string {
  return answer.trim().replace(/^\+/, "").replace(/−/g, "-").toLowerCase();
}

/* -------------------------------------------------------------------------- */
/* Numeric (SPR) answers                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A student-produced response, parsed as a number.
 *
 * `decimals` and `significantDigits` describe *how it was written*, not what it
 * is worth, because the rounding rule below depends on the form: "0.666" is an
 * acceptable way to write 2/3 and "0.66" is not, even though both are
 * approximations of the same value.
 */
interface NumericAnswer {
  value: number;
  /** Decimal places written. Null when the answer was written as a fraction. */
  decimals: number | null;
  /** Significant digits written. Infinite for a fraction, which is exact. */
  significantDigits: number;
}

/** Tolerance for comparing two doubles that should be the same number. */
const EPSILON = 1e-9;

const DECIMAL_PATTERN = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;

function parseDecimal(text: string): NumericAnswer | null {
  if (!DECIMAL_PATTERN.test(text)) return null;

  const value = Number(text);
  if (!Number.isFinite(value)) return null;

  const dot = text.indexOf(".");
  const digits = text.replace(/[-.]/g, "").replace(/^0+/, "");

  return {
    value,
    decimals: dot === -1 ? 0 : text.length - dot - 1,
    significantDigits: digits.length,
  };
}

/**
 * Parse "7/20", "-3/4", ".35", "1,200" or "$18" into a number.
 *
 * Commas and a currency symbol are stripped because students copy them out of
 * the question. A percent sign is **not**, so "35%" fails to parse and is
 * graded wrong — a grid-in answer is never a percentage on the real test, and
 * quietly reading it as 35 would mark a genuinely wrong answer correct.
 */
function parseNumericAnswer(raw: string): NumericAnswer | null {
  const text = normaliseAnswer(raw).replace(/[\s,$]/g, "");
  if (text === "") return null;

  const slash = text.indexOf("/");
  if (slash === -1) return parseDecimal(text);

  const numerator = parseDecimal(text.slice(0, slash));
  const denominator = parseDecimal(text.slice(slash + 1));
  if (!numerator || !denominator || denominator.value === 0) return null;

  return {
    value: numerator.value / denominator.value,
    decimals: null,
    significantDigits: Number.POSITIVE_INFINITY,
  };
}

/**
 * True when a string is a usable student-produced response — a plain number or
 * a fraction. The bank importer uses it to refuse a grid-in question whose
 * answer key is prose, which would otherwise be impossible for anyone to type.
 */
export function isNumericAnswer(value: string): boolean {
  return parseNumericAnswer(value) !== null;
}

/**
 * Is what the student typed the same answer as one we accept?
 *
 * Three ways to be right, in order of cost:
 *   1. The same text ("B" for "b", "0.35" for "0.35").
 *   2. The same number written differently ("7/20" for "0.35", and "0.350").
 *   3. A legitimate truncation or rounding of a value that does not fit the
 *      grid: 2/3 may be entered as "0.666" or "0.667".
 *
 * Rule 3 is deliberately narrow — it applies only to a decimal with at least
 * one decimal place and at least three significant digits. Without that guard
 * "285" would count as a correct answer for 285.4, which it is not.
 */
export function answersAreEquivalent(
  submitted: string,
  accepted: string,
): boolean {
  if (normaliseAnswer(submitted) === normaliseAnswer(accepted)) return true;

  const typed = parseNumericAnswer(submitted);
  const truth = parseNumericAnswer(accepted);
  if (!typed || !truth) return false;

  if (Math.abs(typed.value - truth.value) <= EPSILON) return true;

  if (
    typed.decimals === null ||
    typed.decimals < 1 ||
    typed.significantDigits < 3
  ) {
    return false;
  }

  const factor = 10 ** typed.decimals;
  const truncated = Math.trunc(truth.value * factor) / factor;
  const rounded = Math.round(truth.value * factor) / factor;

  return (
    Math.abs(typed.value - truncated) <= EPSILON ||
    Math.abs(typed.value - rounded) <= EPSILON
  );
}

/**
 * Grade one answer.
 *
 * `acceptedAnswers` is the question's list of accepted forms, written by the
 * bank importer ("0.35 or 7/20" becomes two entries). When it is empty — every
 * multiple-choice question, and any row imported before that column existed —
 * this falls back to splitting `correctAnswer` on `|`, which is how the
 * external import API expresses the same thing.
 */
export function isAnswerCorrect(
  submitted: string | null | undefined,
  correctAnswer: string,
  acceptedAnswers?: readonly string[] | null,
): boolean {
  if (!submitted) return false;

  const candidates =
    acceptedAnswers && acceptedAnswers.length > 0
      ? acceptedAnswers
      : correctAnswer.split("|");

  return candidates.some((candidate) =>
    answersAreEquivalent(submitted, candidate),
  );
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
    /** Alternative accepted forms for an SPR question. Absent for choices. */
    acceptedAnswers?: readonly string[] | null;
  }>,
  answers: Record<string, string | null | undefined>,
  type: TestType,
): GradedResult {
  const breakdown: GradedResult["breakdown"] = {};
  let score = 0;

  for (const question of questions) {
    const submitted = answers[question.id] ?? null;
    const correct = isAnswerCorrect(
      submitted,
      question.correctAnswer,
      question.acceptedAnswers,
    );
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
