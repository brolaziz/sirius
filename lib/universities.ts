/**
 * Reading a university's numbers against a student's own.
 *
 * Small, pure, and tested because the sentence these functions produce is the
 * one a student will quote to their parents. "Your score is 120 points below
 * their average" has to be right, and it has to be honestly hedged when the
 * inputs do not support it.
 */

import type { ApplicationStatus } from "@/lib/generated/prisma/enums";

/* -------------------------------------------------------------------------- */
/* Score comparison                                                            */
/* -------------------------------------------------------------------------- */

export type ScoreVerdict =
  /** The student has no score yet. */
  | "no-score"
  /** The university publishes no SAT figure — test-blind, or simply unknown. */
  | "no-benchmark"
  | "above"
  | "level"
  | "below";

export interface ScoreComparison {
  verdict: ScoreVerdict;
  /** Absolute point difference. Zero unless the verdict is above or below. */
  difference: number;
  myScore: number | null;
  benchmark: number | null;
}

/**
 * Points within which a score counts as "about the same".
 *
 * A 10-point gap on a 1600 scale is one question and well inside the noise of a
 * single sitting. Reporting it as "20 points below their average" invites a
 * student to treat a rounding difference as a verdict.
 */
export const SCORE_LEVEL_MARGIN = 20;

export function compareScore(
  myScore: number | null,
  benchmark: number | null,
): ScoreComparison {
  if (myScore === null) {
    return { verdict: "no-score", difference: 0, myScore, benchmark };
  }

  if (benchmark === null) {
    return { verdict: "no-benchmark", difference: 0, myScore, benchmark };
  }

  const difference = myScore - benchmark;

  if (Math.abs(difference) <= SCORE_LEVEL_MARGIN) {
    return { verdict: "level", difference: 0, myScore, benchmark };
  }

  return {
    verdict: difference > 0 ? "above" : "below",
    difference: Math.abs(difference),
    myScore,
    benchmark,
  };
}

/**
 * The SAT figure a student should be compared against.
 *
 * The two section midpoints are the better benchmark when the federal dataset
 * supplies them — their sum is "half of admitted students scored above this",
 * which is exactly the question being asked. `minSat` is the fallback, and is
 * what the hand-curated rows carry.
 */
export function satBenchmark(university: {
  satReading: number | null;
  satMath: number | null;
  minSat: number | null;
}): number | null {
  if (university.satReading !== null && university.satMath !== null) {
    return university.satReading + university.satMath;
  }

  return university.minSat;
}

/* -------------------------------------------------------------------------- */
/* Admissions outcomes                                                         */
/* -------------------------------------------------------------------------- */

export interface AdmissionsOutcome {
  status: ApplicationStatus;
  satScore: number | null;
  isSample: boolean;
}

export interface AdmissionsSummary {
  total: number;
  accepted: number;
  rejected: number;
  waitlisted: number;
  /** 0–1, or null when there is nothing to divide by. */
  acceptanceRate: number | null;
  /** True when any row is demonstration data shipped with the repository. */
  hasSample: boolean;
  /** True when *every* row is demonstration data. */
  allSample: boolean;
}

/**
 * Count what a university's reported outcomes actually say.
 *
 * `hasSample` and `allSample` exist so the UI can label the grid honestly. A
 * made-up outcome rendered in the same green square as a real one is the single
 * most misleading thing this product could show, so the distinction is carried
 * out of the data rather than assumed by the component.
 */
export function summariseAdmissions(
  outcomes: readonly AdmissionsOutcome[],
): AdmissionsSummary {
  const total = outcomes.length;
  const accepted = outcomes.filter((row) => row.status === "ACCEPTED").length;
  const rejected = outcomes.filter((row) => row.status === "REJECTED").length;
  const waitlisted = outcomes.filter(
    (row) => row.status === "WAITLISTED",
  ).length;

  const samples = outcomes.filter((row) => row.isSample).length;

  return {
    total,
    accepted,
    rejected,
    waitlisted,
    acceptanceRate: total > 0 ? accepted / total : null,
    hasSample: samples > 0,
    allSample: total > 0 && samples === total,
  };
}

/**
 * Order outcomes for the grid: by score, lowest first, unknown scores last.
 *
 * Sorting by score is what turns a wall of squares into a reading: the green
 * ones cluster to the right, and a student can see where their own score falls
 * among them.
 */
export function sortOutcomes<T extends { satScore: number | null }>(
  outcomes: readonly T[],
): T[] {
  return [...outcomes].sort((a, b) => {
    if (a.satScore === null && b.satScore === null) return 0;
    if (a.satScore === null) return 1;
    if (b.satScore === null) return -1;
    return a.satScore - b.satScore;
  });
}
