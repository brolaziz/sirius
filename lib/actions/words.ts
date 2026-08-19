"use server";

/**
 * Word-bank mutations.
 *
 * Words are saved from the dictionary popover while a student reads. The
 * dictionary itself is a static JSON file, but a *saved* word is per-user state,
 * so it lives in Postgres.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { lookupWord } from "@/lib/vocabulary";
import type { ActionResult } from "@/lib/actions/roadmap";

const wordSchema = z
  .string()
  .min(1)
  .max(80)
  // Letters, apostrophes and hyphens only — this is a dictionary word, not free
  // text, and the constraint keeps junk out of the word bank.
  .regex(/^[A-Za-z][A-Za-z'’-]*$/, "That does not look like a word.");

/**
 * Save a word to the signed-in student's word bank.
 *
 * Idempotent: saving the same word twice succeeds silently, thanks to the
 * `@@unique([userId, word])` constraint and an upsert.
 */
export async function saveWord(word: string): Promise<ActionResult> {
  const parsed = wordSchema.safeParse(word.trim());
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid word." };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const normalised = parsed.data.toLowerCase();

  // Link to the `Vocabulary` row when the dictionary has been seeded into
  // Postgres; the static file remains the source of truth for display either
  // way, so a missing row is not an error.
  const entry = lookupWord(normalised);
  const vocabularyRow = entry
    ? await prisma.vocabulary.findUnique({
        where: { englishWord: entry.word },
        select: { id: true },
      })
    : null;

  await prisma.savedWord.upsert({
    where: { userId_word: { userId, word: normalised } },
    create: {
      userId,
      word: normalised,
      vocabularyId: vocabularyRow?.id ?? null,
    },
    update: { vocabularyId: vocabularyRow?.id ?? null },
  });

  revalidatePath("/words");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Remove a word from the word bank. */
export async function removeSavedWord(word: string): Promise<ActionResult> {
  const parsed = wordSchema.safeParse(word.trim());
  if (!parsed.success) return { ok: false, error: "Invalid word." };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  await prisma.savedWord.deleteMany({
    where: { userId, word: parsed.data.toLowerCase() },
  });

  revalidatePath("/words");
  revalidatePath("/dashboard");
  return { ok: true };
}
