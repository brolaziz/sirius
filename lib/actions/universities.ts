"use server";

/** Shortlist mutations for the university explorer. */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentUser } from "@/lib/user";
import type { ActionResult } from "@/lib/actions/roadmap";

const idSchema = z.string().min(1).max(60);

export interface ToggleShortlistResult extends ActionResult {
  /** The state after the toggle, so the client can confirm its optimistic guess. */
  shortlisted?: boolean;
}

/** Add a university to the student's shortlist, or remove it if already there. */
export async function toggleShortlist(
  universityId: string,
): Promise<ToggleShortlistResult> {
  const parsed = idSchema.safeParse(universityId);
  if (!parsed.success) return { ok: false, error: "Invalid university." };

  // `getOrCreateCurrentUser` rather than just the id: the shortlist row has a
  // foreign key to `users`, so the row must exist before we can insert.
  const user = await getOrCreateCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const existing = await prisma.universityShortlistEntry.findUnique({
    where: {
      userId_universityId: {
        userId: user.id,
        universityId: parsed.data,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.universityShortlistEntry.delete({
      where: { id: existing.id },
    });
    revalidatePath("/universities");
    revalidatePath("/dashboard");
    return { ok: true, shortlisted: false };
  }

  const university = await prisma.university.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });
  if (!university) return { ok: false, error: "University not found." };

  await prisma.universityShortlistEntry.create({
    data: { userId: user.id, universityId: university.id },
  });

  revalidatePath("/universities");
  revalidatePath("/dashboard");
  return { ok: true, shortlisted: true };
}
