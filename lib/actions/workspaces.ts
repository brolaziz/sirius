"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { saveApplication, createEssayDraft, saveEssayDraft, restoreEssayDraft, reviewSavedWord, setWorkspaceArchived } from "@/lib/private-workspaces";
import { applicationInputSchema, draftInputSchema } from "@/lib/validation/workspaces";
import { WORD_RATINGS } from "@/lib/word-review";

const idSchema = z.string().min(1).max(60);
const revisionSchema = z.number().int().min(0).max(2147483646);
const applicationSchema = z.object({ id: idSchema.nullable(), revision: revisionSchema, data: applicationInputSchema });
const createSchema = z.object({ applicationId: idSchema.nullable(), data: draftInputSchema });
const saveSchema = z.object({ id: idSchema, revision: revisionSchema, data: draftInputSchema });
const restoreSchema = z.object({ id: idSchema, revision: revisionSchema, version: revisionSchema });
const wordSchema = z.object({ id: idSchema, expectedDue: z.iso.datetime(), rating: z.enum(WORD_RATINGS) });
const archiveSchema = z.object({ id: idSchema, revision: revisionSchema, kind: z.enum(["application", "draft"]), archived: z.boolean() });

export async function savePersonalApplication(input: z.infer<typeof applicationSchema>) {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid application." };
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false as const, error: "Not signed in." };
  const result = await saveApplication(prisma, userId, parsed.data.id, parsed.data.revision, parsed.data.data);
  if (result.ok) { revalidatePath("/applications/tracker"); revalidatePath("/dashboard"); revalidatePath("/admissions-analysis"); }
  return result;
}
export async function createPersonalEssay(input: z.infer<typeof createSchema>) {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid draft." };
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false as const, error: "Not signed in." };
  const result = await createEssayDraft(prisma, userId, parsed.data.data, parsed.data.applicationId);
  if (result.ok) { revalidatePath("/essay-editor"); revalidatePath("/dashboard"); revalidatePath("/admissions-analysis"); }
  return result;
}
export async function savePersonalEssay(input: z.infer<typeof saveSchema>) {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid draft." };
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false as const, error: "Not signed in." };
  const result = await saveEssayDraft(prisma, userId, parsed.data.id, parsed.data.revision, parsed.data.data);
  if (result.ok) { revalidatePath("/essay-editor"); revalidatePath("/dashboard"); revalidatePath(`/essays/drafts/${parsed.data.id}`); }
  return result;
}
export async function restorePersonalEssay(input: z.infer<typeof restoreSchema>) {
  const parsed = restoreSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid revision." };
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false as const, error: "Not signed in." };
  const result = await restoreEssayDraft(prisma, userId, parsed.data.id, parsed.data.revision, parsed.data.version);
  if (result.ok) { revalidatePath(`/essays/drafts/${parsed.data.id}`); revalidatePath("/essay-editor"); revalidatePath("/dashboard"); }
  return result;
}
export async function rateWordRecall(input: z.infer<typeof wordSchema>) {
  const parsed = wordSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid review." };
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false as const, error: "Not signed in." };
  const result = await reviewSavedWord(prisma, userId, parsed.data.id, parsed.data.expectedDue, parsed.data.rating);
  if (result.ok) { revalidatePath("/words"); revalidatePath("/words/review"); }
  return result;
}

export async function archivePersonalWorkspace(input: z.infer<typeof archiveSchema>) {
  const parsed = archiveSchema.safeParse(input); const userId = await getCurrentUserId();
  if (!parsed.success || !userId) return { ok: false as const, error: "Invalid request." };
  const result = await setWorkspaceArchived(prisma, userId, parsed.data.kind, parsed.data.id, parsed.data.revision, parsed.data.archived);
  if (result.ok) { revalidatePath("/applications/tracker"); revalidatePath("/essay-editor"); revalidatePath("/dashboard"); revalidatePath("/admissions-analysis"); revalidatePath(`/essays/drafts/${parsed.data.id}`); revalidatePath(`/applications/tracker/${parsed.data.id}`); }
  return result;
}
