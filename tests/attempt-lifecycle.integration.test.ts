import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { beginAttempt, writeAttempt } from "@/lib/attempt-lifecycle";
import { importTest, QuestionRevisionConflict } from "@/lib/question-import";
import { orderAttemptQuestions, questionIdsFrom } from "@/lib/attempt-questions";
import { parseImportPayload } from "@/lib/validation/test-import";
import { saveApplication, createEssayDraft, saveEssayDraft, restoreEssayDraft, reviewSavedWord, setWorkspaceArchived } from "@/lib/private-workspaces";
import { getLearningHistory } from "@/lib/queries/progress";
import { getMistakeQuestionIds } from "@/lib/queries/learning-evidence";
import { previewContentImport, stageContentImport, reviewContentQuestion, publishContentTest } from "@/lib/content-management";
import { recordLearningEvent } from "@/lib/learning-events";
import { getProductAnalytics } from "@/lib/queries/product-analytics";
import { answerOwnedPractice, finishOwnedPractice, recordPracticeExplanation } from "@/lib/practice-lifecycle";
import { getWorkspaceOverview } from "@/lib/queries/workspace";
import { productAnalyticsCsv } from "@/lib/analytics-csv";

const url = process.env.TEST_DATABASE_URL;
// Never silently fall back to the application's database.
if (url && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)) {
  throw new Error("Integration tests require a dedicated local TEST_DATABASE_URL.");
}
describe.skipIf(!url)("attempt lifecycle against Postgres", () => {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 1 }) });
  const prefix = `roadmap-${randomUUID()}`;
  const tests: string[] = [];
  const domains: string[] = [];
  const extraUsers: string[] = [];
  let userId: string;
  let fullId: string;
  let ids: string[];
  let answers: Record<string, string>;
  let importedTestId: string;
  const payload = (key = "2") => {
    const parsed = parseImportPayload({ externalId: `${prefix}-import`, title: "Fixture only", type: "math", questions: [
      { externalId: "stable-1", question: "Fixture 1 + 1", format: "spr", correctAnswer: key, acceptedAnswers: ["2.0"] },
    ] });
    if (!parsed.ok) throw new Error("Invalid fixture");
    return parsed.data.tests[0];
  };
  beforeAll(async () => {
    const user = await db.user.create({ data: { email: `${prefix}@fixture.invalid` } });
    userId = user.id;
    const full = await db.test.create({ data: { title: prefix, type: "FULL", isPublished: true, durationMinutes: 144 } });
    fullId = full.id; tests.push(fullId);
    // An empty published full container must not start with an incomplete bank.
    expect((await beginAttempt(db, userId, fullId)).ok).toBe(false);
    for (const section of ["RW", "MATH"] as const) {
      const domain = await db.domain.create({ data: { code: `${prefix}-${section}`, name: "Fixture", section, examWeight: 0.5 } });
      domains.push(domain.id);
      const skill = await db.skill.create({ data: { code: `${prefix}-skill-${section}`, name: "Fixture", domainId: domain.id, weightInDomain: 1, baseQuestionsToMastery: 10 } });
      const container = await db.test.create({ data: { title: `${prefix}-bank-${section}`, type: section === "RW" ? "READING" : "MATH", isPublished: false } });
      tests.push(container.id);
      for (const testModule of ["MODULE_1", "MODULE_2"] as const) {
        await db.question.createMany({ data: Array.from({ length: section === "RW" ? 27 : 22 }, (_, n) => ({
          testId: container.id, externalId: `${testModule}-${n}`, order: n + 1, module: testModule,
          questionText: "Fixture only", format: "SPR" as const, correctAnswer: "2", acceptedAnswers: ["2.0"], skillId: skill.id,
          reviewStatus: "VERIFIED" as const,
        })) });
      }
    }
    const started = await beginAttempt(db, userId, fullId);
    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error(started.error);
    const attempt = await db.testAttempt.findUniqueOrThrow({ where: { id: started.attemptId } });
    ids = questionIdsFrom(attempt.questionIds);
    expect(ids).toHaveLength(98);
    answers = Object.fromEntries(ids.map((id) => [id, "2.0"]));
    const imported = await db.$transaction((tx) => importTest(tx, payload()));
    importedTestId = imported.id; tests.push(importedTestId);
    await db.question.updateMany({ where: { testId: importedTestId }, data: { reviewStatus: "VERIFIED" } });
  }, 60_000);
  afterAll(async () => {
    await db.contentAuditEvent.deleteMany({ where: { actorId: { in: [userId, ...extraUsers].filter(Boolean) } } });
    if (userId) await db.user.deleteMany({ where: { id: userId, email: { endsWith: "@fixture.invalid" } } });
    await db.user.deleteMany({ where: { id: { in: extraUsers }, email: { endsWith: "@fixture.invalid" } } });
    await db.test.deleteMany({ where: { id: { in: tests } } });
    await db.domain.deleteMany({ where: { id: { in: domains } } });
    await db.$disconnect();
  });

  it("preserves question IDs and practice responses on reimport and rolls back changed keys", async () => {
    const q = await db.question.findFirstOrThrow({ where: { testId: importedTestId } });
    const session = await db.practiceSession.create({ data: { userId, source: "MIXED", questionIds: [q.id] } });
    await db.practiceResponse.create({ data: { sessionId: session.id, questionId: q.id, answer: "2.0", isCorrect: true, timeSpentSeconds: 10 } });
    await db.$transaction((tx) => importTest(tx, payload()));
    expect((await db.question.findFirstOrThrow({ where: { testId: importedTestId } })).id).toBe(q.id);
    expect(await db.practiceResponse.count({ where: { sessionId: session.id } })).toBe(1);
    await expect(db.$transaction((tx) => importTest(tx, payload("3")))).rejects.toBeInstanceOf(QuestionRevisionConflict);
    expect((await db.question.findUniqueOrThrow({ where: { id: q.id } })).correctAnswer).toBe("2");
  });
  it("does not skip a module when advance is retried; stale autosave cannot overwrite it", async () => {
    const started = await beginAttempt(db, userId, fullId);
    if (!started.ok) throw new Error(started.error);
    const input = { revision: 1, kind: "advance" as const, moduleIndex: 0, answers, flagged: [] };
    const outcomes = await Promise.all([writeAttempt(db, userId, started.attemptId, input), writeAttempt(db, userId, started.attemptId, input)]);
    expect(outcomes.filter((r) => r.ok)).toHaveLength(1);
    const row = await db.testAttempt.findUniqueOrThrow({ where: { id: started.attemptId } });
    expect(row.moduleIndex).toBe(1);
    expect(Object.keys(row.answers as object)).toHaveLength(27);
    expect((await writeAttempt(db, userId, row.id, { revision: 1, kind: "save", moduleIndex: 0, answers: {}, flagged: [] })).ok).toBe(false);
  });
  it("grades 98 cross-container questions once and returns the same result after a later retake", async () => {
    const started = await beginAttempt(db, userId, fullId);
    if (!started.ok) throw new Error(started.error);
    await db.testAttempt.update({ where: { id: started.attemptId }, data: { moduleIndex: 3, answers } });
    const input = { revision: 2, kind: "submit" as const, moduleIndex: 3, answers };
    const outcomes = await Promise.all([writeAttempt(db, userId, started.attemptId, input), writeAttempt(db, userId, started.attemptId, input)]);
    expect(outcomes[0]).toEqual(outcomes[1]);
    expect(await db.testResult.count({ where: { attemptId: started.attemptId } })).toBe(1);
    expect(await db.learningEvent.count({ where: { userId, type: "mock_completed", entityId: started.attemptId } })).toBe(1);
    const result = await db.testResult.findUniqueOrThrow({ where: { attemptId: started.attemptId } });
    expect(result.score).toBe(98); expect(result.totalQuestions).toBe(98);
    const reviewed = orderAttemptQuestions(questionIdsFrom(result.questionIds), await db.question.findMany({ where: { id: { in: ids } } }));
    expect(reviewed.map((q) => q.id)).toEqual(ids);
    const retake = await beginAttempt(db, userId, fullId);
    if (!retake.ok) throw new Error(retake.error);
    await writeAttempt(db, userId, retake.attemptId, { revision: 1, kind: "submit", moduleIndex: 0, answers: {} });
    expect(await writeAttempt(db, userId, started.attemptId, input)).toEqual({ ok: true, resultId: result.id });
    expect((await writeAttempt(db, "another-user", started.attemptId, input)).ok).toBe(false);
  });
  it("ignores out-of-order autosaves and foreign question IDs", async () => {
    const started = await beginAttempt(db, userId, importedTestId);
    if (!started.ok) throw new Error(started.error);
    const question = await db.question.findFirstOrThrow({ where: { testId: importedTestId } });
    expect((await writeAttempt(db, userId, started.attemptId, { revision: 2, kind: "save", moduleIndex: 0, answers: { [question.id]: "2", foreign: "A" }, flagged: ["foreign"] })).ok).toBe(true);
    expect((await writeAttempt(db, userId, started.attemptId, { revision: 1, kind: "save", moduleIndex: 0, answers: { [question.id]: "wrong" }, flagged: [] })).ok).toBe(false);
    const row = await db.testAttempt.findUniqueOrThrow({ where: { id: started.attemptId } });
    expect(row.answers).toEqual({ [question.id]: "2" }); expect(row.flagged).toEqual([]);
    await writeAttempt(db, userId, row.id, { revision: 3, kind: "submit", moduleIndex: 0, answers: { [question.id]: "2" } });
  });
  it("ignores late payloads and refuses autosave after closure", async () => {
    const started = await beginAttempt(db, userId, importedTestId);
    if (!started.ok) throw new Error(started.error);
    const question = await db.question.findFirstOrThrow({ where: { testId: importedTestId } });
    await db.testAttempt.update({ where: { id: started.attemptId }, data: { startedAt: new Date(Date.now() - 60 * 60_000) } });
    await writeAttempt(db, userId, started.attemptId, { revision: 1, kind: "submit", moduleIndex: 0, answers: { [question.id]: "2" } });
    const result = await db.testResult.findUniqueOrThrow({ where: { attemptId: started.attemptId } });
    expect(result.score).toBe(0);
    expect((await writeAttempt(db, userId, started.attemptId, { revision: 1, kind: "save", moduleIndex: 0, answers: {}, flagged: [] })).ok).toBe(false);
  });
  it("combines owned practice and tests and clears a mistake after a later correct answer", async () => {
    const question = await db.question.findFirstOrThrow({ where: { testId: importedTestId } });
    expect(await getMistakeQuestionIds(userId, db)).toContain(question.id);
    const session = await db.practiceSession.create({ data: { userId, source: "REVIEW", questionIds: [question.id], completedAt: new Date() } });
    await db.practiceResponse.create({ data: { sessionId: session.id, questionId: question.id, answer: "2", isCorrect: true, timeSpentSeconds: 5, answeredAt: new Date(Date.now() + 1000) } });
    expect(await getMistakeQuestionIds(userId, db)).not.toContain(question.id);
    const history = await getLearningHistory(userId, 20, db);
    expect(history.some((r) => r.kind === "test")).toBe(true);
    expect(history.find((r) => r.id === session.id)).toMatchObject({ kind: "review", scaledScore: null, correct: 1 });
    expect(await getLearningHistory("another-user", 20, db)).toEqual([]);
  });
  it("protects application ownership and refuses foreign activities and stale updates", async () => {
    const other = await db.user.create({ data: { email: `${prefix}-other@fixture.invalid` } }); extraUsers.push(other.id);
    const activity = await db.userActivity.create({ data: { userId: other.id, position: 1, title: "Other account fixture" } });
    const data = { universityName: "Fixture university", intake: "2027 Fall", deadline: null, status: "PLANNING" as const,
      checklist: [{ id: "essay", title: "Essay", done: false }], activityIds: [], notes: "Private fixture" };
    expect((await saveApplication(db, userId, null, 0, { ...data, activityIds: [activity.id] })).ok).toBe(false);
    const created = await saveApplication(db, userId, null, 0, data);
    if (!created.ok) throw new Error(created.error);
    expect((await saveApplication(db, other.id, created.id, 0, data)).ok).toBe(false);
    const outcomes = await Promise.all([saveApplication(db, userId, created.id, 0, { ...data, notes: "First" }), saveApplication(db, userId, created.id, 0, { ...data, notes: "Second" })]);
    expect(outcomes.filter((r) => r.ok)).toHaveLength(1);
    expect((await db.personalApplication.findUniqueOrThrow({ where: { id: created.id } })).revision).toBe(1);
  });
  it("stores and restores essay versions atomically without exposing another owner's draft", async () => {
    const data = { title: "Private fixture", prompt: "Original writing", content: "", wordLimit: 650 };
    const created = await createEssayDraft(db, userId, data, null);
    if (!created.ok) throw new Error(created.error);
    expect((await saveEssayDraft(db, "another-user", created.id, 0, { ...data, content: "Intrusion" })).ok).toBe(false);
    expect((await createEssayDraft(db, "another-user", data, (await db.personalApplication.findFirstOrThrow({ where: { userId } })).id)).ok).toBe(false);
    expect((await saveEssayDraft(db, userId, created.id, 0, { ...data, content: "My first paragraph." })).ok).toBe(true);
    expect((await saveEssayDraft(db, userId, created.id, 0, { ...data, content: "Stale paragraph." })).ok).toBe(false);
    expect((await restoreEssayDraft(db, "another-user", created.id, 1, 0)).ok).toBe(false);
    expect((await restoreEssayDraft(db, userId, created.id, 1, 0)).ok).toBe(true);
    const draft = await db.essayDraft.findUniqueOrThrow({ where: { id: created.id } });
    expect(draft.content).toBe(""); expect(draft.revision).toBe(2);
    expect(await db.essayDraftRevision.count({ where: { draftId: created.id } })).toBe(3);
  });
  it("schedules an owned word exactly once and rejects replayed or foreign ratings", async () => {
    const due = new Date(Date.now() - 1000);
    const word = await db.savedWord.create({ data: { userId, word: "scrutinize", nextReviewAt: due } });
    expect((await reviewSavedWord(db, "another-user", word.id, due.toISOString(), "good")).ok).toBe(false);
    const outcomes = await Promise.all([reviewSavedWord(db, userId, word.id, due.toISOString(), "good"), reviewSavedWord(db, userId, word.id, due.toISOString(), "good")]);
    expect(outcomes.filter((r) => r.ok)).toHaveLength(1);
    expect((await db.savedWord.findUniqueOrThrow({ where: { id: word.id } })).repetitions).toBe(1);
    expect(await db.learningEvent.count({ where: { userId, type: "word_review_completed", entityId: `${word.id}:${due.toISOString()}` } })).toBe(1);
  });
  it("rejects type changes for a test with history", async () => {
    await expect(db.$transaction((tx) => importTest(tx, { ...payload(), type: "READING" }))).rejects.toBeInstanceOf(QuestionRevisionConflict);
    expect((await db.test.findUniqueOrThrow({ where: { id: importedTestId } })).type).toBe("MATH");
  });
  it("enforces preview, review and publish permissions with an audit trail", async () => {
    const editor = await db.user.create({ data: { email: `${prefix}-editor@fixture.invalid`, role: "EDITOR" } }); extraUsers.push(editor.id);
    const admin = await db.user.create({ data: { email: `${prefix}-admin@fixture.invalid`, role: "ADMIN" } }); extraUsers.push(admin.id);
    const skill = await db.skill.findFirstOrThrow({ where: { code: `${prefix}-skill-MATH` } });
    const body = { ...payload(), externalId: `${prefix}-cms`, sourceName: "Original test fixture", rightsNote: "Test fixture only",
      questions: [{ externalId: "cms-1", questionText: "Fixture", format: "SPR", correctAnswer: "2", skillCode: skill.code, explanation: "Fixture rationale" }] };
    const text = JSON.stringify(body);
    expect((await previewContentImport(db, userId, text)).ok).toBe(false);
    expect((await stageContentImport(db, userId, text)).ok).toBe(false);
    expect((await previewContentImport(db, editor.id, text)).ok).toBe(true);
    expect(await db.test.count({ where: { externalId: body.externalId } })).toBe(0);
    expect((await stageContentImport(db, editor.id, text)).ok).toBe(true);
    const test = await db.test.findUniqueOrThrow({ where: { externalId: body.externalId } }); tests.push(test.id);
    const question = await db.question.findFirstOrThrow({ where: { testId: test.id } });
    expect(test.isPublished).toBe(false); expect(question.reviewStatus).toBe("UNREVIEWED");
    expect((await publishContentTest(db, admin.id, test.id, true)).ok).toBe(false);
    expect((await reviewContentQuestion(db, userId, question.id, "VERIFIED")).ok).toBe(false);
    expect((await reviewContentQuestion(db, editor.id, question.id, "VERIFIED")).ok).toBe(true);
    expect((await publishContentTest(db, editor.id, test.id, true)).ok).toBe(false);
    expect((await publishContentTest(db, admin.id, test.id, true)).ok).toBe(true);
    expect((await db.question.findUniqueOrThrow({ where: { id: question.id } })).reviewedById).toBe(editor.id);
    expect(await db.contentAuditEvent.count({ where: { entityId: { in: [test.id, question.id] } } })).toBe(3);
    // A revoked editor cannot mutate content through an already rendered UI.
    await db.user.update({ where: { id: editor.id }, data: { role: "STUDENT" } });
    expect((await reviewContentQuestion(db, editor.id, question.id, "REJECTED")).ok).toBe(false);
    expect((await reviewContentQuestion(db, admin.id, question.id, "REJECTED")).ok).toBe(true);
    expect((await beginAttempt(db, userId, test.id)).ok).toBe(false);
  });
  it("requires provenance, taxonomy and explanation before verification", async () => {
    const admin = await db.user.findFirstOrThrow({ where: { email: `${prefix}-admin@fixture.invalid` } });
    const q = await db.question.findFirstOrThrow({ where: { testId: importedTestId } });
    expect((await reviewContentQuestion(db, admin.id, q.id, "VERIFIED")).ok).toBe(false);
    expect((await previewContentImport(db, admin.id, JSON.stringify({ ...payload(), externalId: undefined }))).ok).toBe(false);
    expect((await previewContentImport(db, admin.id, JSON.stringify({ ...payload(), questions: [{ ...payload().questions[0], skillCode: "not-a-skill" }] }))).ok).toBe(false);
  });
  it("records server events once, returns real counts and protects the analytics report", async () => {
    await db.$transaction(async (tx) => {
      await recordLearningEvent(tx, userId, "practice_started", `${prefix}-event`);
      await recordLearningEvent(tx, userId, "practice_started", `${prefix}-event`);
    });
    expect(await db.learningEvent.count({ where: { userId, type: "practice_started", entityId: `${prefix}-event` } })).toBe(1);
    expect(await getProductAnalytics(db, userId)).toBeNull();
    const admin = await db.user.findFirstOrThrow({ where: { email: `${prefix}-admin@fixture.invalid` } });
    const report = await getProductAnalytics(db, admin.id);
    expect(report?.events.find((event) => event.type === "practice_started")?.count).toBeGreaterThanOrEqual(1);
    expect(report?.firstPractice).toBeGreaterThanOrEqual(1);
    const future = new Date(Date.now() + 86400_000);
    await db.learningEvent.create({ data: { userId, type: "practice_started", entityId: `${prefix}-future`, createdAt: future } });
    const after = await getProductAnalytics(db, admin.id);
    expect(after?.events.find((event) => event.type === "practice_started")?.count).toBe(report?.events.find((event) => event.type === "practice_started")?.count);
  });
  it("imports a draft full mock container without inventing questions", async () => {
    const editor = await db.user.findFirstOrThrow({ where: { email: `${prefix}-admin@fixture.invalid` } });
    const body = { externalId: `${prefix}-full-cms`, title: "Fixture full container", type: "FULL", questions: [], sourceName: "Fixture", rightsNote: "Original fixture only" };
    const preview = await previewContentImport(db, editor.id, JSON.stringify(body));
    expect(preview.ok).toBe(true);
    expect((await stageContentImport(db, editor.id, JSON.stringify(body))).ok).toBe(true);
    const test = await db.test.findUniqueOrThrow({ where: { externalId: body.externalId } }); tests.push(test.id);
    expect(test.durationMinutes).toBe(144);
    expect((await publishContentTest(db, editor.id, test.id, true)).ok).toBe(true);
    // Removing even one required module question makes publish eligibility fail.
    const question = await db.question.findUniqueOrThrow({ where: { id: ids[0] } });
    await db.question.update({ where: { id: question.id }, data: { reviewStatus: "REJECTED" } });
    expect((await publishContentTest(db, editor.id, test.id, true)).ok).toBe(false);
    await db.question.update({ where: { id: question.id }, data: { reviewStatus: "VERIFIED" } });
  });
  it("archives and restores an owned application without dropping its linked drafts", async () => {
    const application = await db.personalApplication.findFirstOrThrow({ where: { userId } });
    const data = { title: "Linked private fixture", prompt: "Prompt", content: "Preserve this draft", wordLimit: null };
    const created = await createEssayDraft(db, userId, data, application.id);
    if (!created.ok) throw new Error(created.error);
    expect((await setWorkspaceArchived(db, "another-user", "application", application.id, application.revision, true)).ok).toBe(false);
    const archived = await setWorkspaceArchived(db, userId, "application", application.id, application.revision, true);
    if (!archived.ok) throw new Error(archived.error);
    expect((await db.essayDraft.findUniqueOrThrow({ where: { id: created.id } })).applicationId).toBe(application.id);
    expect((await createEssayDraft(db, userId, data, application.id)).ok).toBe(false);
    expect((await setWorkspaceArchived(db, userId, "application", application.id, application.revision, false)).ok).toBe(false);
    expect((await setWorkspaceArchived(db, userId, "application", application.id, archived.revision, false)).ok).toBe(true);
  });
  it("keeps the first graded answer on retries and closes sessions without leaking keys", async () => {
    const session = await db.practiceSession.create({ data: { userId, source: "MIXED", questionIds: ids.slice(0, 2) } });
    const input = { sessionId: session.id, questionId: ids[0], answer: "2", timeSpentSeconds: 12 };
    expect((await answerOwnedPractice(db, "another-user", input)).ok).toBe(false);
    expect((await answerOwnedPractice(db, userId, { ...input, questionId: ids[2] })).ok).toBe(false);
    const [first, duplicate] = await Promise.all([
      answerOwnedPractice(db, userId, input),
      answerOwnedPractice(db, userId, { ...input, answer: "3", timeSpentSeconds: 80 }),
    ]);
    expect(first).toEqual(duplicate);
    expect(first).toMatchObject({ ok: true, answer: "2", isCorrect: true, timeSpentSeconds: 12 });
    expect(await db.practiceResponse.count({ where: { sessionId: session.id } })).toBe(1);
    expect((await finishOwnedPractice(db, "another-user", session.id)).ok).toBe(false);
    expect((await finishOwnedPractice(db, userId, session.id)).ok).toBe(true);
    expect((await finishOwnedPractice(db, userId, session.id)).ok).toBe(true);
    expect(await answerOwnedPractice(db, userId, { ...input, answer: "3" })).toEqual(first);
    expect((await answerOwnedPractice(db, userId, { ...input, questionId: ids[1] })).ok).toBe(false);
    expect(await db.learningEvent.count({ where: { entityId: session.id, type: "practice_completed" } })).toBe(1);
    const empty = await db.practiceSession.create({ data: { userId, source: "MIXED", questionIds: [ids[0]] } });
    await finishOwnedPractice(db, userId, empty.id);
    expect(await db.learningEvent.count({ where: { entityId: empty.id, type: "practice_completed" } })).toBe(0);
  });
  it("records visible explanations only after an owned answer and once per question", async () => {
    await db.question.update({ where: { id: ids[0] }, data: { explanation: "Original fixture rationale" } });
    const session = await db.practiceSession.create({ data: { userId, source: "MIXED", questionIds: ids.slice(0, 2) } });
    expect((await recordPracticeExplanation(db, userId, session.id, ids[0])).ok).toBe(false);
    await answerOwnedPractice(db, userId, { sessionId: session.id, questionId: ids[0], answer: "2", timeSpentSeconds: 1 });
    expect((await recordPracticeExplanation(db, "another-user", session.id, ids[0])).ok).toBe(false);
    expect((await recordPracticeExplanation(db, userId, session.id, ids[0])).ok).toBe(true);
    await recordPracticeExplanation(db, userId, session.id, ids[0]);
    await answerOwnedPractice(db, userId, { sessionId: session.id, questionId: ids[1], answer: "2", timeSpentSeconds: 1 });
    expect((await recordPracticeExplanation(db, userId, session.id, ids[1])).ok).toBe(false);
    expect(await db.learningEvent.count({ where: { userId, type: "explanation_opened", entityId: `${session.id}:${ids[0]}` } })).toBe(1);
  });
  it("emits plan completion at the current plan threshold without crediting old plans", async () => {
    const user = await db.user.create({ data: { email: `${prefix}-plan-events@fixture.invalid` } }); extraUsers.push(user.id);
    const skillId = (await db.question.findUniqueOrThrow({ where: { id: ids[0] } })).skillId!;
    const now = new Date();
    const planData = { userId: user.id, targetScore: 1400, examDate: new Date(now.getTime() + 30 * 86400_000), weeklyStudyMinutes: 180, weeks: 4, weeklyQuestions: 2, totalQuestions: 8, onTrack: false };
    const old = await db.studyPlan.create({ data: { ...planData, createdAt: new Date(now.getTime() - 86400_000) } });
    const latest = await db.studyPlan.create({ data: planData });
    const taskData = { week: 1, startDate: new Date(now.getTime() - 60_000), dueDate: new Date(now.getTime() + 6 * 86400_000), skillId };
    const oldTask = await db.studyPlanTask.create({ data: { ...taskData, planId: old.id, targetQuestions: 1 } });
    const task = await db.studyPlanTask.create({ data: { ...taskData, planId: latest.id, targetQuestions: 2 } });
    const session = await db.practiceSession.create({ data: { userId: user.id, source: "MIXED", questionIds: ids.slice(0, 2) } });
    const input = { sessionId: session.id, questionId: ids[0], answer: "2", timeSpentSeconds: 1 };
    await answerOwnedPractice(db, user.id, input);
    expect(await db.learningEvent.count({ where: { userId: user.id, type: "plan_task_completed" } })).toBe(0);
    await answerOwnedPractice(db, user.id, { ...input, questionId: ids[1] });
    await answerOwnedPractice(db, user.id, input);
    expect(await db.learningEvent.count({ where: { userId: user.id, type: "plan_task_completed", entityId: task.id } })).toBe(1);
    expect(await db.learningEvent.count({ where: { userId: user.id, entityId: oldTask.id } })).toBe(0);
  });
  it("uses full D7/D14 observation windows and exports aggregate metrics only", async () => {
    const admin = await db.user.findFirstOrThrow({ where: { email: `${prefix}-admin@fixture.invalid` } });
    const now = new Date(); const day = 86400_000;
    async function activity(name: string, age: number, returns: number[], role: "STUDENT" | "EDITOR" = "STUDENT", type = "practice_completed") {
      const user = await db.user.create({ data: { email: `${prefix}-retention-${name}@fixture.invalid`, role } }); extraUsers.push(user.id);
      const first = now.getTime() - age * day;
      await db.learningEvent.createMany({ data: [0, ...returns].map((offset, i) => ({ userId: user.id, type, entityId: `${name}-${i}`, createdAt: new Date(first + offset * day) })) });
    }
    await activity("returned", 20, [7, 7.5, 14.001]);
    await activity("outside", 20, [8, 15]);
    await activity("d7-only", 10, [7]);
    await activity("immature", 7.5, [7]);
    await activity("old-cohort", 31, [7, 14]);
    await activity("editor", 20, [7, 14], "EDITOR");
    await activity("started-only", 20, [7, 14], "STUDENT", "practice_started");
    await activity("future-only", -1, [7, 14]);
    const report = await getProductAnalytics(db, admin.id, now);
    expect(report?.retention).toEqual([
      { day: 7, eligible: 3, returned: 2, rate: 2 / 3 },
      { day: 14, eligible: 2, returned: 1, rate: 0.5 },
    ]);
    if (!report) throw new Error("Missing report");
    const csv = productAnalyticsCsv(report);
    expect(csv).toContain('"retention_d7.returned","2"');
    expect(csv).not.toContain(prefix);
    expect(csv).not.toContain("fixture.invalid");
    expect(csv).not.toContain("Original fixture rationale");
  });
  it("keeps workspace totals and deadlines private, includes today and excludes archives", async () => {
    const mine = await db.user.create({ data: { email: `${prefix}-overview@fixture.invalid` } }); extraUsers.push(mine.id);
    const foreign = await db.user.create({ data: { email: `${prefix}-overview-other@fixture.invalid` } }); extraUsers.push(foreign.id);
    const now = new Date(); const today = new Date(now); today.setUTCHours(0,0,0,0);
    const tomorrow = new Date(today.getTime() + 86400_000);
    const due = await db.personalApplication.create({ data: { userId: mine.id, universityName: "My deadline", intake: "2027", deadline: today } });
    await db.personalApplication.create({ data: { userId: mine.id, universityName: "Later", intake: "2027", deadline: tomorrow } });
    await db.personalApplication.create({ data: { userId: mine.id, universityName: "Archived", intake: "2027", deadline: today, archivedAt: now } });
    await db.personalApplication.create({ data: { userId: foreign.id, universityName: "Other person's deadline", intake: "2027", deadline: today } });
    await db.essayDraft.create({ data: { userId: mine.id, title: "My draft" } });
    await db.essayDraft.create({ data: { userId: mine.id, title: "Archived draft", archivedAt: now } });
    await db.essayDraft.create({ data: { userId: foreign.id, title: "Private foreign draft" } });
    const report = await getWorkspaceOverview(db, mine.id, now);
    expect(report.applicationCount).toBe(2); expect(report.draftCount).toBe(1);
    expect(report.drafts.map(draft => draft.title)).toEqual(["My draft"]);
    expect(report.deadline?.id).toBe(due.id);
    expect(JSON.stringify(report)).not.toContain("Other person");
    expect(JSON.stringify(report)).not.toContain("Private foreign");
  });
  it("retains essay text and version history through archive and restore", async () => {
    const draft = await db.essayDraft.findFirstOrThrow({ where: { userId, content: "Preserve this draft" } });
    expect((await setWorkspaceArchived(db, "another-user", "draft", draft.id, draft.revision, true)).ok).toBe(false);
    const archived = await setWorkspaceArchived(db, userId, "draft", draft.id, draft.revision, true);
    if (!archived.ok) throw new Error(archived.error);
    expect((await saveEssayDraft(db, userId, draft.id, archived.revision, { title: draft.title, prompt: draft.prompt, content: "overwrite", wordLimit: draft.wordLimit })).ok).toBe(false);
    const restored = await setWorkspaceArchived(db, userId, "draft", draft.id, archived.revision, false);
    expect(restored.ok).toBe(true);
    expect((await db.essayDraft.findUniqueOrThrow({ where: { id: draft.id } })).content).toBe("Preserve this draft");
    expect(await db.essayDraftRevision.count({ where: { draftId: draft.id } })).toBe(3);
  });
});
