"use server";

/**
 * The student's own Common Application activities list.
 *
 * Ten lines, 150 characters each — the Common App's limits, not ours, which is
 * why they live in `lib/admissions.ts` next to a comment saying whose they are.
 * They are enforced here as well as in the form: a Server Action is an open
 * HTTP endpoint, and a limit the browser checks is a hint.
 *
 * Every write scopes by `userId` inside the `where`, so an id from the client
 * can only ever address a row the signed-in student owns.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import {
  ACTIVITY_DESCRIPTION_LIMIT,
  MAX_ACTIVITIES,
  activityProblem,
} from "@/lib/admissions";
import type { ActionResult } from "@/lib/actions/roadmap";

const activitySchema = z.object({
  title: z.string().min(1).max(100),
  organisation: z.string().max(120).nullable().optional(),
  role: z.string().max(120).nullable().optional(),
  description: z.string().max(ACTIVITY_DESCRIPTION_LIMIT).nullable().optional(),
  hoursPerWeek: z.number().int().min(0).max(168).nullable().optional(),
  weeksPerYear: z.number().int().min(0).max(52).nullable().optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;

/* -------------------------------------------------------------------------- */
/* Add                                                                         */
/* -------------------------------------------------------------------------- */

export async function addActivity(input: ActivityInput): Promise<ActionResult> {
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid activity." };
  }

  const problem = activityProblem(parsed.data);
  if (problem) return { ok: false, error: problem };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const existing = await prisma.userActivity.findMany({
    where: { userId },
    select: { position: true },
    orderBy: { position: "asc" },
  });

  if (existing.length >= MAX_ACTIVITIES) {
    return {
      ok: false,
      error: `The Common App allows ${MAX_ACTIVITIES} activities. Remove one first.`,
    };
  }

  /*
   * The first free position rather than "count + 1": deleting the third of four
   * activities and adding another must not collide with the row that still
   * holds position 4.
   */
  const taken = new Set(existing.map((activity) => activity.position));
  let position = 1;
  while (taken.has(position)) position += 1;

  await prisma.userActivity.create({
    data: {
      userId,
      position,
      title: parsed.data.title.trim(),
      organisation: parsed.data.organisation?.trim() || null,
      role: parsed.data.role?.trim() || null,
      description: parsed.data.description?.trim() || null,
      hoursPerWeek: parsed.data.hoursPerWeek ?? null,
      weeksPerYear: parsed.data.weeksPerYear ?? null,
    },
  });

  revalidatePath("/activities");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Update                                                                      */
/* -------------------------------------------------------------------------- */

const updateSchema = activitySchema.extend({
  id: z.string().min(1).max(60),
});

export async function updateActivity(
  input: z.infer<typeof updateSchema>,
): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid activity." };
  }

  const problem = activityProblem(parsed.data);
  if (problem) return { ok: false, error: problem };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const updated = await prisma.userActivity.updateMany({
    where: { id: parsed.data.id, userId },
    data: {
      title: parsed.data.title.trim(),
      organisation: parsed.data.organisation?.trim() || null,
      role: parsed.data.role?.trim() || null,
      description: parsed.data.description?.trim() || null,
      hoursPerWeek: parsed.data.hoursPerWeek ?? null,
      weeksPerYear: parsed.data.weeksPerYear ?? null,
    },
  });

  if (updated.count === 0) {
    return { ok: false, error: "That activity is no longer there." };
  }

  revalidatePath("/activities");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Remove                                                                      */
/* -------------------------------------------------------------------------- */

export async function removeActivity(activityId: string): Promise<ActionResult> {
  const parsed = z.string().min(1).max(60).safeParse(activityId);
  if (!parsed.success) return { ok: false, error: "Invalid activity." };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  /*
   * `deleteMany` with the owner in the `where`, not `delete` after a read: the
   * id comes from the browser, and a check-then-delete leaves a window where it
   * is somebody else's row by the time the delete runs.
   */
  await prisma.userActivity.deleteMany({
    where: { id: parsed.data, userId },
  });

  revalidatePath("/activities");
  return { ok: true };
}
