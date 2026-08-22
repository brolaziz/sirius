/**
 * "Applicants like you", and the Common Application's limits.
 *
 * The similarity tests are mostly about refusing to answer: a profile with
 * nothing comparable must not come back as a perfect match, which is exactly
 * what a naive distance of zero would look like.
 */

import { describe, expect, it } from "vitest";

import {
  ACTIVITY_DESCRIPTION_LIMIT,
  ACTIVITY_TIERS,
  MAX_ACTIVITIES,
  activityProblem,
  groupByTier,
  profileDistance,
  rankSimilarProfiles,
  tierRank,
} from "@/lib/admissions";

describe("profileDistance", () => {
  it("is zero for an identical profile", () => {
    expect(
      profileDistance({ satScore: 1400, gpa: 3.8 }, { satScore: 1400, gpa: 3.8 }),
    ).toBe(0);
  });

  it("grows with the gap", () => {
    const near = profileDistance(
      { satScore: 1400, gpa: 3.8 },
      { satScore: 1380, gpa: 3.7 },
    );
    const far = profileDistance(
      { satScore: 1400, gpa: 3.8 },
      { satScore: 1000, gpa: 2.9 },
    );

    expect(near).not.toBeNull();
    expect(far).not.toBeNull();
    expect(far!).toBeGreaterThan(near!);
  });

  it("refuses to compare profiles with nothing in common", () => {
    expect(
      profileDistance({ satScore: 1400, gpa: null }, { satScore: null, gpa: 3.9 }),
    ).toBeNull();

    expect(
      profileDistance({ satScore: null, gpa: null }, { satScore: 1400, gpa: 3.9 }),
    ).toBeNull();
  });

  it("uses whichever dimension both profiles have", () => {
    const distance = profileDistance(
      { satScore: 1400, gpa: null },
      { satScore: 1400, gpa: 3.2 },
    );

    expect(distance).toBe(0);
  });

  it("never exceeds one", () => {
    const distance = profileDistance(
      { satScore: 400, gpa: 0 },
      { satScore: 1600, gpa: 4 },
    );

    expect(distance).toBeLessThanOrEqual(1);
    expect(distance).toBeGreaterThan(0.9);
  });
});

describe("rankSimilarProfiles", () => {
  const mine = { satScore: 1400, gpa: 3.8 };

  it("puts the closest profile first", () => {
    const ranked = rankSimilarProfiles(mine, [
      { satScore: 1100, gpa: 3.2, id: "far" },
      { satScore: 1410, gpa: 3.8, id: "near" },
      { satScore: 1300, gpa: 3.6, id: "middle" },
    ]);

    expect(ranked.map((row) => row.profile.id)).toEqual([
      "near",
      "middle",
      "far",
    ]);
  });

  it("leaves out anyone there is no basis to compare", () => {
    const ranked = rankSimilarProfiles(mine, [
      { satScore: null, gpa: null, id: "unknown" },
      { satScore: 1390, gpa: 3.8, id: "known" },
    ]);

    expect(ranked.map((row) => row.profile.id)).toEqual(["known"]);
  });

  it("returns nothing when the student has no profile of their own", () => {
    const ranked = rankSimilarProfiles({ satScore: null, gpa: null }, [
      { satScore: 1400, gpa: 3.9, id: "a" },
    ]);

    expect(ranked).toEqual([]);
  });

  it("honours the limit", () => {
    const many = Array.from({ length: 30 }, (_, index) => ({
      satScore: 1400 - index,
      gpa: 3.8,
      id: String(index),
    }));

    expect(rankSimilarProfiles(mine, many, 5)).toHaveLength(5);
  });
});

describe("activityProblem", () => {
  it("accepts a well-formed activity", () => {
    expect(
      activityProblem({
        title: "Debate club",
        description: "Ran weekly practice rounds for twelve members.",
        hoursPerWeek: 4,
        weeksPerYear: 30,
      }),
    ).toBeNull();
  });

  it("insists on a name", () => {
    expect(activityProblem({ title: "   " })).toContain("name");
  });

  it("holds the Common App's 150 characters", () => {
    const long = "x".repeat(ACTIVITY_DESCRIPTION_LIMIT + 1);
    const problem = activityProblem({ title: "Debate", description: long });

    expect(problem).toContain(String(ACTIVITY_DESCRIPTION_LIMIT));
    expect(
      activityProblem({
        title: "Debate",
        description: "x".repeat(ACTIVITY_DESCRIPTION_LIMIT),
      }),
    ).toBeNull();
  });

  it("rejects impossible time commitments", () => {
    expect(activityProblem({ title: "Debate", hoursPerWeek: 200 })).toContain(
      "168",
    );
    expect(activityProblem({ title: "Debate", weeksPerYear: 60 })).toContain(
      "52",
    );
  });

  it("keeps the Common App's ten-activity limit visible to callers", () => {
    expect(MAX_ACTIVITIES).toBe(10);
  });
});

describe("the ladder", () => {
  it("runs from the first rung upwards", () => {
    expect(ACTIVITY_TIERS[0]).toBe("Bronze I");
    expect(ACTIVITY_TIERS[ACTIVITY_TIERS.length - 1]).toBe("Platinum");
    expect(tierRank("Silver")).toBeLessThan(tierRank("Gold"));
  });

  it("sorts an unknown tier last rather than crashing", () => {
    expect(tierRank("Diamond")).toBe(ACTIVITY_TIERS.length);
  });

  it("groups activities by tier in ladder order", () => {
    const grouped = groupByTier([
      { tier: "Gold", order: 1, id: "g1" },
      { tier: "Bronze I", order: 2, id: "b2" },
      { tier: "Bronze I", order: 1, id: "b1" },
    ]);

    expect(grouped.map((group) => group.tier)).toEqual(["Bronze I", "Gold"]);
    expect(grouped[0].activities.map((activity) => activity.id)).toEqual([
      "b1",
      "b2",
    ]);
  });
});
