import { createHash } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";
import { resolveCorrectAnswerLabel, type ImportTest } from "@/lib/validation/test-import";

export class QuestionRevisionConflict extends Error {}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => `${JSON.stringify(key)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/** Content IDs remain immutable; revised material gets a new external ID. */
export async function upsertImmutableQuestion(tx: Prisma.TransactionClient, testId: string, externalId: string,
  fields: Omit<Prisma.QuestionUncheckedCreateInput, "testId" | "externalId">) {
  // Upsert with an empty update also serializes concurrent imports of the same key.
  const row = await tx.question.upsert({ where: { testId_externalId: { testId, externalId } },
    create: { testId, externalId, ...fields }, update: {},
  });
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && canonical(row[key as keyof typeof row]) !== canonical(value)) {
      throw new QuestionRevisionConflict(`Question ${externalId} already exists with different ${key}. Use a new externalId for a content revision; existing history is preserved.`);
    }
  }
  return row;
}

export async function importTest(tx: Prisma.TransactionClient, test: ImportTest) {
  if (test.externalId) {
    const previous = await tx.test.findUnique({ where: { externalId: test.externalId }, select: { id: true, type: true } });
    if (previous) {
      await tx.$queryRaw`SELECT id FROM tests WHERE id = ${previous.id} FOR UPDATE`;
      const locked = await tx.test.findUniqueOrThrow({ where: { id: previous.id }, select: { type: true, _count: { select: { attempts: true, results: true } } } });
      if (locked.type !== test.type && (locked._count.attempts || locked._count.results)) {
        throw new QuestionRevisionConflict("A test with attempt history cannot change type. Use a new test externalId.");
      }
    }
  }
  const data = { title: test.title, description: test.description ?? null, type: test.type,
    isPublished: test.isPublished, durationMinutes: test.durationMinutes,
    ...(test.sourceName ? { sourceName: test.sourceName } : {}), ...(test.rightsNote ? { rightsNote: test.rightsNote } : {}) };
  const record = test.externalId ? await tx.test.upsert({ where: { externalId: test.externalId },
    create: { ...data, externalId: test.externalId }, update: data,
  }) : await tx.test.create({ data });
  // Starting a sitting and editing its container use the same lock.
  await tx.$queryRaw`SELECT id FROM tests WHERE id = ${record.id} FOR UPDATE`;
  const before = await tx.question.count({ where: { testId: record.id } });
  for (const question of test.questions) {
    const taxonomy = question.skillCode ? await tx.skill.findUnique({ where: { code: question.skillCode },
      select: { id: true, name: true, domain: { select: { name: true } } } }) : null;
    if (question.skillCode && !taxonomy) throw new QuestionRevisionConflict(`Unknown skillCode: ${question.skillCode}. Import the taxonomy before these questions.`);
    const fields = { order: question.order, module: question.module,
      passageText: question.passageText ?? null, passageTitle: question.passageTitle ?? null,
      questionText: question.questionText, format: question.format, options: question.options ?? [],
      correctAnswer: resolveCorrectAnswerLabel(question), acceptedAnswers: question.acceptedAnswers,
      explanation: question.explanation ?? null, domain: taxonomy?.domain.name ?? question.domain ?? null,
      skill: taxonomy?.name ?? question.skill ?? null,
      ...(taxonomy ? { skillId: taxonomy.id } : {}),
      difficulty: question.difficulty ?? null };
    const externalId = question.externalId ?? `content-${createHash("sha256").update(canonical(fields)).digest("hex")}`;
    await upsertImmutableQuestion(tx, record.id, externalId, fields);
  }
  const after = await tx.question.count({ where: { testId: record.id } });
  return { id: record.id, externalId: record.externalId, title: record.title, type: record.type,
    isPublished: record.isPublished, questionsImported: test.questions.length,
    questionsAdded: after - before, questionsRetained: before, questionsReplaced: 0 };
}
