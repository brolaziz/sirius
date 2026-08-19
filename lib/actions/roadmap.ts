"use server";

/**
 * Roadmap checklist mutations.
 *
 * Security note that applies to every action in `lib/actions/`: a Server Action
 * is a public HTTP endpoint. The id arriving from the client is untrusted, so
 * ownership is enforced inside the query — `updateMany` with `userId` in
 * the `where` clause. Fetching the row, checking it in JS, then writing would
 * leave a window between check and write; scoping the write itself does not.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";

const toggleSchema = z.object({
  taskId: z.string().min(1).max(60),
  isDone: z.boolean(),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Tick or untick one roadmap task. */
export async function toggleRoadmapTask(
  input: z.infer<typeof toggleSchema>,
): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const { taskId, isDone } = parsed.data;

  const result = await prisma.roadmapTask.updateMany({
    // `userId` here is what stops one student ticking another's checklist.
    where: { id: taskId, userId },
    data: { isDone, doneAt: isDone ? new Date() : null },
  });

  if (result.count === 0) {
    return { ok: false, error: "Task not found." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
