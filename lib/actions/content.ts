"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { previewContentImport, stageContentImport, reviewContentQuestion, publishContentTest } from "@/lib/content-management";
const textSchema = z.string().max(8_000_000);
const reviewSchema = z.object({ id: z.string().min(1).max(60), status: z.enum(["VERIFIED", "REJECTED"]) });
const publishSchema = z.object({ id: z.string().min(1).max(60), published: z.boolean() });
const denied = { ok: false as const, error: "Forbidden." };
function refreshContent() {
  for (const path of ["/admin/content", "/practice", "/dashboard", "/plan"]) revalidatePath(path);
}
export async function previewQuestionImport(text: string) {
  const userId = await getCurrentUserId(); const parsed = textSchema.safeParse(text);
  if (!userId || !parsed.success) return denied;
  return previewContentImport(prisma, userId, parsed.data);
}
export async function stageQuestionImport(text: string) {
  const userId = await getCurrentUserId(); const parsed = textSchema.safeParse(text);
  if (!userId || !parsed.success) return denied;
  const result = await stageContentImport(prisma, userId, parsed.data);
  if (result.ok) refreshContent();
  return result;
}
export async function reviewQuestion(input: z.infer<typeof reviewSchema>) {
  const userId = await getCurrentUserId(); const parsed = reviewSchema.safeParse(input);
  if (!userId || !parsed.success) return denied;
  const result = await reviewContentQuestion(prisma, userId, parsed.data.id, parsed.data.status);
  if (result.ok) refreshContent();
  return result;
}
export async function publishTest(input: z.infer<typeof publishSchema>) {
  const userId = await getCurrentUserId(); const parsed = publishSchema.safeParse(input);
  if (!userId || !parsed.success) return denied;
  const result = await publishContentTest(prisma, userId, parsed.data.id, parsed.data.published);
  if (result.ok) refreshContent();
  return result;
}
