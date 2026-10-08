import type { PrismaClient } from "@/lib/generated/prisma/client";
import { applicationInputSchema, draftInputSchema, type ApplicationInput, type DraftInput } from "@/lib/validation/workspaces";
import { scheduleWordReview, type WordRating } from "@/lib/word-review";
import { recordLearningEvent } from "@/lib/learning-events";

type WorkspaceResult = { ok: true; id: string; revision: number } | { ok: false; error: string; conflict?: boolean };
// Bounded budgets for networked Postgres and competing saves; row locks and
// revision checks remain inside each transaction. No automatic write retries.
const transactionOptions = { maxWait: 10_000, timeout: 15_000 };
const conflict = { ok: false as const, conflict: true, error: "This item changed in another tab. Reload before saving." };

export async function saveApplication(db: PrismaClient, userId: string, id: string | null, revision: number, input: ApplicationInput): Promise<WorkspaceResult> {
  const parsed = applicationInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid application." };
  return db.$transaction(async (tx) => {
    let previouslyDone = new Set<string>();
    if (id) {
      await tx.$queryRaw`SELECT id FROM personal_applications WHERE id = ${id} AND user_id = ${userId} FOR UPDATE`;
      const existing = await tx.personalApplication.findFirst({ where: { id, userId } });
      if (!existing) return { ok: false, error: "Application not found." };
      if (existing.archivedAt) return { ok: false, error: "Restore this application before editing." };
      if (existing.revision !== revision) return conflict;
      if (Array.isArray(existing.checklist)) previouslyDone = new Set(existing.checklist.flatMap((item) => item && typeof item === "object" && !Array.isArray(item) && item.done === true && typeof item.id === "string" ? [item.id] : []));
    }
    const owned = await tx.userActivity.count({ where: { userId, id: { in: parsed.data.activityIds } } });
    if (owned !== parsed.data.activityIds.length) return { ok: false, error: "An activity is not available in your account." };
    const data = { ...parsed.data, deadline: parsed.data.deadline ? new Date(`${parsed.data.deadline}T00:00:00Z`) : null };
    const row = id ? await tx.personalApplication.update({ where: { id }, data: { ...data, revision: { increment: 1 } } })
      : await tx.personalApplication.create({ data: { ...data, userId } });
    for (const item of parsed.data.checklist) if (item.done && !previouslyDone.has(item.id)) {
      await recordLearningEvent(tx, userId, "application_task_completed", `${row.id}:${item.id}`);
    }
    return { ok: true, id: row.id, revision: row.revision };
  }, transactionOptions);
}

export async function createEssayDraft(db: PrismaClient, userId: string, input: DraftInput, applicationId: string | null): Promise<WorkspaceResult> {
  const parsed = draftInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid draft." };
  return db.$transaction(async (tx) => {
    if (applicationId && !await tx.personalApplication.findFirst({ where: { id: applicationId, userId, archivedAt: null }, select: { id: true } })) {
      return { ok: false, error: "Application not found." };
    }
    const draft = await tx.essayDraft.create({ data: { ...parsed.data, userId, applicationId } });
    await tx.essayDraftRevision.create({ data: { ...parsed.data, draftId: draft.id, version: 0 } });
    return { ok: true, id: draft.id, revision: 0 };
  }, transactionOptions);
}

export async function saveEssayDraft(db: PrismaClient, userId: string, id: string, revision: number, input: DraftInput): Promise<WorkspaceResult> {
  const parsed = draftInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid draft." };
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM essay_drafts WHERE id = ${id} AND user_id = ${userId} FOR UPDATE`;
    const existing = await tx.essayDraft.findFirst({ where: { id, userId } });
    if (!existing) return { ok: false, error: "Draft not found." };
    if (existing.archivedAt) return { ok: false, error: "Restore this draft before editing." };
    if (existing.revision !== revision) return conflict;
    if (Object.entries(parsed.data).every(([key, value]) => existing[key as keyof typeof existing] === value)) {
      return { ok: true, id, revision };
    }
    const updated = await tx.essayDraft.update({ where: { id }, data: { ...parsed.data, revision: { increment: 1 } } });
    await tx.essayDraftRevision.create({ data: { ...parsed.data, draftId: id, version: updated.revision } });
    return { ok: true, id, revision: updated.revision };
  }, transactionOptions);
}

export async function restoreEssayDraft(db: PrismaClient, userId: string, id: string, revision: number, version: number): Promise<WorkspaceResult> {
  const old = await db.essayDraftRevision.findFirst({ where: { draftId: id, version, draft: { userId } },
    select: { title: true, prompt: true, content: true, wordLimit: true } });
  if (!old) return { ok: false, error: "Revision not found." };
  return saveEssayDraft(db, userId, id, revision, old);
}

export async function reviewSavedWord(db: PrismaClient, userId: string, id: string, expectedDue: string, rating: WordRating, now = new Date()) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM saved_words WHERE id = ${id} AND user_id = ${userId} FOR UPDATE`;
    const word = await tx.savedWord.findFirst({ where: { id, userId } });
    if (!word) return { ok: false as const, error: "Word not found." };
    if (word.nextReviewAt.toISOString() !== expectedDue || word.nextReviewAt > now) return conflict;
    await tx.savedWord.update({ where: { id }, data: scheduleWordReview(word, rating, now) });
    await recordLearningEvent(tx, userId, "word_review_completed", `${id}:${expectedDue}`);
    return { ok: true as const };
  }, transactionOptions);
}

/** Reversible archival retains content, links and all essay revisions. */
export async function setWorkspaceArchived(db: PrismaClient, userId: string, kind: "application" | "draft", id: string, revision: number, archived: boolean): Promise<WorkspaceResult> {
  return db.$transaction(async (tx) => {
    if (kind === "application") {
      await tx.$queryRaw`SELECT id FROM personal_applications WHERE id = ${id} AND user_id = ${userId} FOR UPDATE`;
      const row = await tx.personalApplication.findFirst({ where: { id, userId } });
      if (!row) return { ok: false, error: "Application not found." };
      if (row.revision !== revision) return conflict;
      if (!!row.archivedAt === archived) return { ok: true, id, revision };
      const updated = await tx.personalApplication.update({ where: { id }, data: { archivedAt: archived ? new Date() : null, revision: { increment: 1 } } });
      return { ok: true, id, revision: updated.revision };
    }
    if (kind !== "draft") return { ok: false, error: "Invalid workspace." };
    await tx.$queryRaw`SELECT id FROM essay_drafts WHERE id = ${id} AND user_id = ${userId} FOR UPDATE`;
    const row = await tx.essayDraft.findFirst({ where: { id, userId } });
    if (!row) return { ok: false, error: "Draft not found." };
    if (row.revision !== revision) return conflict;
    if (!!row.archivedAt === archived) return { ok: true, id, revision };
    const updated = await tx.essayDraft.update({ where: { id }, data: { archivedAt: archived ? new Date() : null, revision: { increment: 1 } } });
    // Keep version numbers aligned with the optimistic revision used by the editor.
    await tx.essayDraftRevision.create({ data: { draftId: id, version: updated.revision, title: row.title, prompt: row.prompt, content: row.content, wordLimit: row.wordLimit } });
    return { ok: true, id, revision: updated.revision };
  }, transactionOptions);
}
