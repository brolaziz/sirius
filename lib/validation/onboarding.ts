/**
 * The rules onboarding answers have to satisfy.
 *
 * One module, imported by both the form and the Server Action, because the two
 * must not be allowed to disagree. The form uses these to show a message next
 * to the field; the action uses them because a Server Action is an open HTTP
 * endpoint and the browser's copy of a rule protects nobody.
 *
 * Dates cross the boundary as `YYYY-MM-DD` strings rather than `Date` objects.
 * A `Date` serialises to an instant, and an instant carries a timezone: a
 * student in Tashkent picking the 7th would send the 6th at 19:00 UTC, and the
 * "not in the past" check would disagree with the calendar they were looking
 * at. A plain date has no such argument with itself.
 */

import { z } from "zod";

import { TOTAL_SCORE_MAX, TOTAL_SCORE_MIN } from "@/lib/sat";

/* -------------------------------------------------------------------------- */
/* Fields                                                                      */
/* -------------------------------------------------------------------------- */

export const GRADE_LEVELS = [
  "GRADE_9",
  "GRADE_10",
  "GRADE_11",
  "GRADE_12",
  "GRADUATED",
] as const;

export const STUDY_PRIORITIES = ["SAT", "ADMISSIONS", "BOTH"] as const;

export const gradeLevelSchema = z.enum(GRADE_LEVELS);
export const prioritySchema = z.enum(STUDY_PRIORITIES);

/** A score on the reported SAT scale: 400–1600, in steps of 10. */
export const satScoreSchema = z
  .number()
  .int()
  .min(TOTAL_SCORE_MIN, `Score must be at least ${TOTAL_SCORE_MIN}.`)
  .max(TOTAL_SCORE_MAX, `Score cannot exceed ${TOTAL_SCORE_MAX}.`)
  .refine((score) => score % 10 === 0, {
    error: "SAT scores go up in steps of 10.",
  });

/**
 * The current score, where null is a real answer — "I have not sat one yet".
 * It is not a missing value: it routes the student to a diagnostic instead of
 * to a plan built on a number they made up.
 */
export const currentScoreSchema = satScoreSchema.nullable();

/** How far ahead an exam date may be. Beyond this it is not a plan, it is a mood. */
const MAX_MONTHS_AHEAD = 36;

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

/** Today as `YYYY-MM-DD`, in the viewer's own calendar. */
export function todayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** The last date the form will accept, as `YYYY-MM-DD`. */
export function maxExamIsoDate(now: Date = new Date()): string {
  const limit = new Date(now.getTime());
  limit.setMonth(limit.getMonth() + MAX_MONTHS_AHEAD);
  return todayIsoDate(limit);
}

export const examDateSchema = z
  .string()
  .regex(isoDatePattern, "Pick a date.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), {
    error: "That is not a real date.",
  })
  /*
   * String comparison is the whole check: ISO dates sort chronologically, so
   * this needs no timezone arithmetic and cannot drift by a day.
   */
  .refine((value) => value >= todayIsoDate(), {
    error: "The exam date cannot be in the past.",
  })
  .refine((value) => value <= maxExamIsoDate(), {
    error: "Pick a date within the next three years.",
  });

/** Parse a validated `YYYY-MM-DD` into the UTC midnight it denotes. */
export function examDateToUtc(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Render a stored exam date back into the form's `YYYY-MM-DD`. */
export function examDateToIso(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The five questions, in order.
 *
 * Each step is saved on its own, so a student who closes the tab returns to the
 * step they stopped at. That is also why this is a discriminated union rather
 * than one big partial object: a step submits exactly its own field, and a
 * payload that names two of them is rejected instead of quietly writing both.
 */
export const ONBOARDING_STEPS = [
  "grade",
  "current-score",
  "target-score",
  "exam-date",
  "priority",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const onboardingStepSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal("grade"), gradeLevel: gradeLevelSchema }),
  z.object({ step: z.literal("current-score"), currentScore: currentScoreSchema }),
  z.object({ step: z.literal("target-score"), targetScore: satScoreSchema }),
  z.object({ step: z.literal("exam-date"), examDate: examDateSchema }),
  z.object({ step: z.literal("priority"), priority: prioritySchema }),
]);

export type OnboardingStepInput = z.infer<typeof onboardingStepSchema>;

/* -------------------------------------------------------------------------- */
/* The whole profile                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Everything onboarding has to have produced before it counts as finished.
 *
 * The cross-field rule lives here rather than on the target-score step because
 * a step cannot see the answer to another step. The action checks it twice
 * anyway — once when the target is entered, against the score already stored,
 * and once here — since a student can go back and raise their current score
 * after setting a target.
 */
export const onboardingProfileSchema = z
  .object({
    gradeLevel: gradeLevelSchema,
    currentScore: currentScoreSchema,
    targetScore: satScoreSchema,
    examDate: examDateSchema,
    priority: prioritySchema,
  })
  .refine(
    (profile) =>
      profile.currentScore === null ||
      profile.targetScore >= profile.currentScore,
    {
      error: "Your target cannot be lower than the score you already have.",
      path: ["targetScore"],
    },
  );

export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>;

/**
 * Is this target allowed, given what the student says they score today?
 *
 * Returns the message rather than a boolean so the caller can show it, and null
 * when the pair is fine.
 */
export function targetScoreProblem(
  targetScore: number,
  currentScore: number | null,
): string | null {
  if (currentScore === null) return null;
  if (targetScore >= currentScore) return null;

  return "Your target cannot be lower than the score you already have.";
}
