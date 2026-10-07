import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { parseImportPayload } from "@/lib/validation/test-import";
import { importTest, QuestionRevisionConflict } from "@/lib/question-import";
import { mockAvailability } from "@/lib/mock";

export function canEditContent(role: string | undefined) { return role === "EDITOR" || role === "ADMIN"; }
async function roleFor(db: Prisma.TransactionClient | PrismaClient, actorId: string) {
  return (await db.user.findUnique({ where: { id: actorId }, select: { role: true } }))?.role;
}
const denied = { ok: false as const, error: "Forbidden." };
function parseDraft(text: string) {
  if (Buffer.byteLength(text, "utf8") > 8_000_000) return { ok: false as const, error: "JSON exceeds 8 MB." };
  let body: unknown;
  try { body = JSON.parse(text); } catch { return { ok: false as const, error: "Invalid JSON." }; }
  const parsed = parseImportPayload(body);
  if (!parsed.ok) return { ok: false as const, error: parsed.issues.map((i) => `${i.path}: ${i.message}`).join("\n") };
  const keys = parsed.data.tests.map((t) => t.externalId);
  if (keys.some((id) => !id) || new Set(keys).size !== keys.length) return { ok: false as const, error: "Each test needs a unique externalId." };
  for (const test of parsed.data.tests) {
    const ids = test.questions.map((q) => q.externalId);
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return { ok: false as const, error: `Each question in ${test.externalId} needs a unique externalId.` };
  }
  return { ok: true as const, tests: parsed.data.tests };
}

export async function previewContentImport(db: PrismaClient, actorId: string, text: string) {
  if (!canEditContent(await roleFor(db, actorId))) return denied;
  const parsed = parseDraft(text);
  if (!parsed.ok) return parsed;
  const codes = [...new Set(parsed.tests.flatMap((t) => t.questions.flatMap((q) => q.skillCode ? [q.skillCode] : [])))];
  const skills = await db.skill.findMany({ where: { code: { in: codes } }, select: { code: true } });
  const known = new Set(skills.map((s) => s.code));
  const unknown = codes.filter((code) => !known.has(code));
  if (unknown.length) return { ok: false as const, error: `Unknown skillCode: ${unknown.join(", ")}` };
  return { ok: true as const, tests: parsed.tests.map((t) => ({ externalId: t.externalId!, title: t.title, questions: t.questions.length,
    explained: t.questions.filter((q) => q.explanation?.trim()).length, mapped: t.questions.filter((q) => q.skillCode).length,
    provenance: !!(t.sourceName && t.rightsNote) })) };
}

/** Privilege is read inside the transaction; JSON can never supply its own role or review status. */
export async function stageContentImport(db: PrismaClient, actorId: string, text: string) {
  const parsed = parseDraft(text);
  if (!parsed.ok) return parsed;
  try {
    return await db.$transaction(async (tx) => {
      if (!canEditContent(await roleFor(tx, actorId))) return denied;
      const rows = [];
      for (const test of parsed.tests) {
        const row = await importTest(tx, { ...test, isPublished: false });
        rows.push(row);
        await tx.contentAuditEvent.create({ data: { actorId, action: "IMPORT_DRAFT", entityId: row.id } });
      }
      return { ok: true as const, imported: rows.length };
    }, { timeout: 60_000 });
  } catch (error) {
    if (error instanceof QuestionRevisionConflict) return { ok: false as const, error: error.message };
    throw error;
  }
}

export async function reviewContentQuestion(db: PrismaClient, actorId: string, id: string, status: "VERIFIED" | "REJECTED") {
  if (!["VERIFIED", "REJECTED"].includes(status)) return { ok: false as const, error: "Invalid review." };
  return db.$transaction(async (tx) => {
    if (!canEditContent(await roleFor(tx, actorId))) return denied;
    await tx.$queryRaw`SELECT id FROM questions WHERE id = ${id} FOR UPDATE`;
    const question = await tx.question.findUnique({ where: { id }, include: { test: true, skillRef: { include: { domain: true } } } });
    if (!question) return { ok: false as const, error: "Question not found." };
    if (status === "VERIFIED" && (!question.explanation?.trim() || !question.skillRef || !question.test.sourceName?.trim() || !question.test.rightsNote?.trim())) {
      return { ok: false as const, error: "Verification requires explanation, skillCode, source and permission details." };
    }
    const section = question.skillRef?.domain.section;
    if (status === "VERIFIED" && question.test.type !== "FULL" && section !== (question.test.type === "READING" ? "RW" : "MATH")) {
      return { ok: false as const, error: "Skill section does not match test type." };
    }
    if (question.reviewStatus === status) return { ok: true as const };
    await tx.question.update({ where: { id }, data: { reviewStatus: status, reviewedAt: new Date(), reviewedById: actorId } });
    await tx.contentAuditEvent.create({ data: { actorId, action: `QUESTION_${status}`, entityId: id } });
    return { ok: true as const };
  });
}

export async function publishContentTest(db: PrismaClient, actorId: string, id: string, published: boolean) {
  return db.$transaction(async (tx) => {
    if (await roleFor(tx, actorId) !== "ADMIN") return denied;
    await tx.$queryRaw`SELECT id FROM tests WHERE id = ${id} FOR UPDATE`;
    const test = await tx.test.findUnique({ where: { id }, include: { questions: { select: { reviewStatus: true } } } });
    if (!test) return { ok: false as const, error: "Test not found." };
    if (published) {
      if (!test.sourceName?.trim() || !test.rightsNote?.trim()) return { ok: false as const, error: "Source and permission details are required." };
      if (test.type === "FULL") {
        const pool = await tx.question.findMany({ where: { reviewStatus: "VERIFIED", skillId: { not: null } },
          select: { module: true, skillRef: { select: { domain: { select: { section: true } } } } } });
        const counts = ["RW", "MATH"].flatMap((section) => ["MODULE_1", "MODULE_2"].map((module) => ({
          section: (section === "RW" ? "READING" : "MATH") as "READING" | "MATH", module: module as "MODULE_1" | "MODULE_2",
          count: pool.filter((q) => q.module === module && q.skillRef?.domain.section === section).length,
        })));
        if (!mockAvailability(counts).complete) return { ok: false as const, error: "The verified bank cannot fill all four modules." };
      } else if (!test.questions.length || test.questions.some((q) => q.reviewStatus !== "VERIFIED")) {
        return { ok: false as const, error: "Every question must be verified before publishing this test." };
      }
    }
    if (test.isPublished === published) return { ok: true as const };
    await tx.test.update({ where: { id }, data: { isPublished: published } });
    await tx.contentAuditEvent.create({ data: { actorId, action: published ? "TEST_PUBLISHED" : "TEST_UNPUBLISHED", entityId: id } });
    return { ok: true as const };
  });
}
