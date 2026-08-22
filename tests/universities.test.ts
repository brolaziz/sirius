/**
 * Comparing a student's score with a university's, and reading admissions
 * outcomes honestly.
 *
 * The tests that matter are the ones about *not* answering: no score, no
 * published benchmark, and a difference too small to mean anything. Those are
 * the cases where a confident sentence would be a wrong one.
 */

import { describe, expect, it } from "vitest";

import {
  SCORE_LEVEL_MARGIN,
  compareScore,
  satBenchmark,
  sortOutcomes,
  summariseAdmissions,
  type AdmissionsOutcome,
} from "@/lib/universities";

describe("compareScore", () => {
  it("says nothing when the student has no score", () => {
    const comparison = compareScore(null, 1450);

    expect(comparison.verdict).toBe("no-score");
    expect(comparison.difference).toBe(0);
  });

  it("says nothing when the university publishes no SAT figure", () => {
    const comparison = compareScore(1400, null);

    expect(comparison.verdict).toBe("no-benchmark");
    expect(comparison.difference).toBe(0);
  });

  it("reports how far above the benchmark a score is", () => {
    const comparison = compareScore(1500, 1400);

    expect(comparison.verdict).toBe("above");
    expect(comparison.difference).toBe(100);
  });

  it("reports how far below, as a positive number", () => {
    const comparison = compareScore(1280, 1400);

    expect(comparison.verdict).toBe("below");
    expect(comparison.difference).toBe(120);
  });

  it("calls a difference inside the noise level rather than a verdict", () => {
    expect(compareScore(1400, 1400).verdict).toBe("level");
    expect(compareScore(1400 + SCORE_LEVEL_MARGIN, 1400).verdict).toBe("level");
    expect(compareScore(1400 - SCORE_LEVEL_MARGIN, 1400).verdict).toBe("level");
    expect(compareScore(1400 + SCORE_LEVEL_MARGIN + 10, 1400).verdict).toBe(
      "above",
    );
  });
});

describe("satBenchmark", () => {
  it("prefers the two section midpoints", () => {
    expect(
      satBenchmark({ satReading: 730, satMath: 770, minSat: 1400 }),
    ).toBe(1500);
  });

  it("falls back to the curated total when a section is missing", () => {
    expect(satBenchmark({ satReading: 730, satMath: null, minSat: 1400 })).toBe(
      1400,
    );
  });

  it("has no answer for a test-blind university", () => {
    expect(
      satBenchmark({ satReading: null, satMath: null, minSat: null }),
    ).toBeNull();
  });
});

describe("summariseAdmissions", () => {
  const outcome = (
    status: AdmissionsOutcome["status"],
    isSample = false,
  ): AdmissionsOutcome => ({ status, satScore: 1400, isSample });

  it("counts nothing as nothing, not as a zero percent acceptance rate", () => {
    const summary = summariseAdmissions([]);

    expect(summary.total).toBe(0);
    expect(summary.acceptanceRate).toBeNull();
    expect(summary.hasSample).toBe(false);
    expect(summary.allSample).toBe(false);
  });

  it("counts each decision", () => {
    const summary = summariseAdmissions([
      outcome("ACCEPTED"),
      outcome("ACCEPTED"),
      outcome("REJECTED"),
      outcome("WAITLISTED"),
    ]);

    expect(summary.accepted).toBe(2);
    expect(summary.rejected).toBe(1);
    expect(summary.waitlisted).toBe(1);
    expect(summary.acceptanceRate).toBe(0.5);
  });

  it("flags demonstration rows so the grid can label them", () => {
    const mixed = summariseAdmissions([outcome("ACCEPTED", true), outcome("REJECTED")]);
    expect(mixed.hasSample).toBe(true);
    expect(mixed.allSample).toBe(false);

    const all = summariseAdmissions([outcome("ACCEPTED", true)]);
    expect(all.hasSample).toBe(true);
    expect(all.allSample).toBe(true);
  });
});

describe("sortOutcomes", () => {
  it("puts the lowest score first and the unknown ones last", () => {
    const sorted = sortOutcomes([
      { satScore: 1500 },
      { satScore: null },
      { satScore: 1200 },
    ]);

    expect(sorted.map((row) => row.satScore)).toEqual([1200, 1500, null]);
  });
});
