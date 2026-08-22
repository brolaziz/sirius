/**
 * Admissions evidence: comparing profiles, and the Common Application's own
 * limits.
 *
 * Pure, because both halves are the kind of rule that has to be argued with
 * rather than eyeballed. "Applicants like you" is a claim about similarity, and
 * a similarity function nobody can inspect is a horoscope.
 */

/* -------------------------------------------------------------------------- */
/* Similarity                                                                  */
/* -------------------------------------------------------------------------- */

export interface ProfileSignals {
  /** 400–1600. */
  satScore: number | null;
  /** Unweighted, on the US 4.0 scale. */
  gpa: number | null;
}

/**
 * How much each dimension counts towards similarity.
 *
 * The SAT weighs more than the GPA because it is the comparable number: a 3.8
 * means different things at two schools, while a 1480 means the same thing
 * everywhere. Weights are renormalised over whichever dimensions both profiles
 * actually have, so a missing GPA does not quietly make everyone look similar.
 */
const WEIGHTS = { sat: 0.65, gpa: 0.35 } as const;

const SAT_RANGE = 1600 - 400;
const GPA_RANGE = 4;

/**
 * Distance between two profiles, 0 (identical) to 1 (opposite ends).
 *
 * Null means there is nothing in common to compare — no shared dimension — and
 * the caller must drop the profile rather than treat it as a perfect match,
 * which is what a "0" would look like.
 */
export function profileDistance(
  mine: ProfileSignals,
  theirs: ProfileSignals,
): number | null {
  let weight = 0;
  let total = 0;

  if (mine.satScore !== null && theirs.satScore !== null) {
    total +=
      WEIGHTS.sat * Math.abs(mine.satScore - theirs.satScore) / SAT_RANGE;
    weight += WEIGHTS.sat;
  }

  if (mine.gpa !== null && theirs.gpa !== null) {
    total += WEIGHTS.gpa * Math.abs(mine.gpa - theirs.gpa) / GPA_RANGE;
    weight += WEIGHTS.gpa;
  }

  if (weight === 0) return null;

  return Math.min(1, total / weight);
}

export interface RankedProfile<T> {
  profile: T;
  distance: number;
}

/**
 * The profiles closest to this student's, nearest first.
 *
 * Profiles with nothing comparable are excluded, not sorted to the bottom: a
 * list called "applicants like you" must not contain applicants nobody can say
 * that about.
 */
export function rankSimilarProfiles<T extends ProfileSignals>(
  mine: ProfileSignals,
  profiles: readonly T[],
  limit = 12,
): Array<RankedProfile<T>> {
  return profiles
    .flatMap((profile) => {
      const distance = profileDistance(mine, profile);
      return distance === null ? [] : [{ profile, distance }];
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* The Common Application's limits                                             */
/* -------------------------------------------------------------------------- */

/** The Common App allows ten activities. Not a Sirius choice — theirs. */
export const MAX_ACTIVITIES = 10;

/** And 150 characters to describe each one. */
export const ACTIVITY_DESCRIPTION_LIMIT = 150;

export interface ActivityInput {
  title: string;
  description?: string | null;
  hoursPerWeek?: number | null;
  weeksPerYear?: number | null;
}

/**
 * What is wrong with this activity, or null when nothing is.
 *
 * Returns the message rather than a boolean so the same sentence appears in the
 * form and in the action's error — one rule, one wording, checked in both
 * places because a Server Action is an open endpoint.
 */
export function activityProblem(input: ActivityInput): string | null {
  const title = input.title.trim();
  if (title === "") return "Give the activity a name.";
  if (title.length > 100) return "Keep the name under 100 characters.";

  const description = input.description?.trim() ?? "";
  if (description.length > ACTIVITY_DESCRIPTION_LIMIT) {
    return `The Common App allows ${ACTIVITY_DESCRIPTION_LIMIT} characters; this is ${description.length}.`;
  }

  const hours = input.hoursPerWeek;
  if (hours !== undefined && hours !== null && (hours < 0 || hours > 168)) {
    return "Hours a week has to be between 0 and 168.";
  }

  const weeks = input.weeksPerYear;
  if (weeks !== undefined && weeks !== null && (weeks < 0 || weeks > 52)) {
    return "Weeks a year has to be between 0 and 52.";
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* The activity ladder                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The tiers, weakest first.
 *
 * Ascending on purpose: the question this ladder answers is "what does the next
 * step look like", and that reads upwards from where a student already is. A
 * list that opens with Platinum answers a question nobody asked and tells most
 * readers they are at the bottom.
 */
export const ACTIVITY_TIERS = [
  "Bronze I",
  "Bronze II",
  "Silver",
  "Gold",
  "Platinum",
] as const;

export type ActivityTier = (typeof ACTIVITY_TIERS)[number];

/** Where a tier sits on the ladder. Unknown tiers sort last. */
export function tierRank(tier: string): number {
  const index = ACTIVITY_TIERS.indexOf(tier as ActivityTier);
  return index === -1 ? ACTIVITY_TIERS.length : index;
}

/** Group reference activities by tier, in ladder order. */
export function groupByTier<T extends { tier: string; order: number }>(
  activities: readonly T[],
): Array<{ tier: string; activities: T[] }> {
  const groups = new Map<string, T[]>();

  for (const activity of activities) {
    const group = groups.get(activity.tier) ?? [];
    group.push(activity);
    groups.set(activity.tier, group);
  }

  return [...groups.entries()]
    .map(([tier, list]) => ({
      tier,
      activities: [...list].sort(
        (a, b) => a.order - b.order || a.tier.localeCompare(b.tier),
      ),
    }))
    .sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || a.tier.localeCompare(b.tier));
}
