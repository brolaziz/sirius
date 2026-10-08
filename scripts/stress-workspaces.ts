/** Bounded concurrency audit. Never falls back to a production or local PGlite target. */
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { createEssayDraft, saveEssayDraft, saveApplication, setWorkspaceArchived } from "../lib/private-workspaces";
import { getWorkspaceOverview } from "../lib/queries/workspace";
import { previewContentImport } from "../lib/content-management";
import { getProductAnalytics } from "../lib/queries/product-analytics";
import type { ApplicationInput } from "../lib/validation/workspaces";

const url = process.env.DATABASE_URL;
const host = process.argv.find(arg => arg.startsWith("--dev-host="))?.split("=")[1];
if (!url || process.env.DATABASE_ENV !== "dev" || !host || new URL(url).hostname !== host || !host.endsWith(".neon.tech")) {
  throw Error("Requires a human-confirmed Neon dev branch, DATABASE_ENV=dev, and matching --dev-host. No writes performed.");
}
const origin = process.argv.find(arg => arg.startsWith("--origin="))?.slice(9);
if (origin && !["http://localhost:3000", "http://127.0.0.1:3000"].includes(origin)) throw Error("HTTP audit is limited to the local Sirius server.");
const mode = process.argv.find(arg => arg.startsWith("--server-mode="))?.slice(14) ?? "unspecified";
if (!["dev", "production", "unspecified"].includes(mode)) throw Error("Server mode must be dev or production.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 8 }) });
const prefix = `stress-${randomUUID()}`;
const users: string[] = [];
const samples: Record<string, number[]> = {};
let assertions = 0;
async function measured<T>(name: string, action: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try { return await action(); } finally { (samples[name] ??= []).push(performance.now() - start); }
}
function check(value: unknown, message: string) { assertions++; assert.ok(value, message); }
async function settleAll<T>(operations: Promise<T>[]): Promise<T[]> {
  const settled = await Promise.allSettled(operations);
  const failed = settled.find(result => result.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
  return settled.map(result => (result as PromiseFulfilledResult<T>).value);
}
async function fixture(index: number) {
  const owner = await db.user.create({ data: { email: `${prefix}-${index}@fixture.invalid`, name: "Stress fixture", onboardingCompletedAt: new Date() } });
  users.push(owner.id);
  const foreign = await db.user.create({ data: { email: `${prefix}-${index}-foreign@fixture.invalid` } });
  users.push(foreign.id);
  const input = { title: `Fixture ${index}`, prompt: "Test only", content: "Initial fixture", wordLimit: 650 };
  const draft = await createEssayDraft(db, owner.id, input, null);
  check(draft.ok, "Draft must be created"); if (!draft.ok) return;
  const appInput: ApplicationInput = { universityName: "Stress fixture college", intake: "Test", deadline: new Date().toISOString().slice(0, 10), status: "PLANNING", activityIds: [], checklist: [], notes: "" };
  const application = await saveApplication(db, owner.id, null, 0, appInput);
  check(application.ok, "Application must be created"); if (!application.ok) return;
  for (let revision = 0; revision < 3; revision++) {
    const writes = await settleAll(Array.from({ length: 6 }, (_, n) => measured("draft-write", () => saveEssayDraft(db, owner.id, draft.id, revision, { ...input, content: `Round ${revision}, competing writer ${n}` }))));
    check(writes.filter(r => r.ok).length === 1, "Exactly one competing draft save wins");
    check(writes.filter(r => !r.ok && r.conflict).length === 5, "Every stale draft write must conflict");
    const applications = await settleAll(Array.from({ length: 6 }, (_, n) => measured("application-write", () => saveApplication(db, owner.id, application.id, revision, { ...appInput, notes: `Writer ${n}`, checklist: [{ id: `round-${revision}`, title: "Test task", done: true }] }))));
    check(applications.filter(r => r.ok).length === 1, "Exactly one application save wins");
  }
  check(await db.essayDraftRevision.count({ where: { draftId: draft.id } }) === 4, "No duplicate or lost essay revisions");
  check(await db.learningEvent.count({ where: { userId: owner.id, type: "application_task_completed" } }) === 3, "Checklist events recorded once per task");
  check(!(await saveEssayDraft(db, foreign.id, draft.id, 3, input)).ok, "Foreign draft writes denied");
  check(!(await saveApplication(db, foreign.id, application.id, 3, appInput)).ok, "Foreign application writes denied");
  check(!(await previewContentImport(db, owner.id, "{}")).ok, "Student content access denied");
  check(await getProductAnalytics(db, owner.id) === null, "Student analytics access denied");
  const reads = await settleAll(Array.from({ length: 12 }, () => measured("workspace-read", () => getWorkspaceOverview(db, owner.id))));
  check(reads.every(row => row.draftCount === 1 && row.applicationCount === 1 && row.drafts[0]?.id === draft.id && row.deadline?.id === application.id), "Parallel overview reads preserve ownership and today's deadline");
  const empty = await getWorkspaceOverview(db, foreign.id);
  check(empty.draftCount === 0 && empty.applicationCount === 0 && empty.deadline === null, "No cross-account content in overview");
  check((await setWorkspaceArchived(db, owner.id, "draft", draft.id, 3, true)).ok, "Archival succeeds");
  check((await getWorkspaceOverview(db, owner.id)).draftCount === 0, "Archived draft hidden");
  check((await setWorkspaceArchived(db, owner.id, "draft", draft.id, 4, false)).ok, "Restore succeeds");
  if (origin) {
    const token = randomUUID();
    await db.session.create({ data: { userId: owner.id, sessionToken: token, expires: new Date(Date.now() + 600_000) } });
    // Ordinary database sessions belonging only to fixtures; never real-account tokens.
    const cases = [
      { path: "/explore", status: 200, cookie: `authjs.session-token=${token}` },
      { path: "/admin/content", status: 404, cookie: `authjs.session-token=${token}` },
      { path: "/api/analytics/export", status: 403, cookie: `authjs.session-token=${token}` },
      { path: "/admin/content", status: 307, cookie: "" },
      { path: "/admin/content", status: 307, cookie: "authjs.session-token=invalid-fixture-token" },
    ];
    await settleAll(cases.map(test => measured(`http-${test.path}-${test.status}`, async () => {
      const response = await fetch(`${origin}${test.path}`, { headers: test.cookie ? { cookie: test.cookie } : {}, redirect: "manual", signal: AbortSignal.timeout(30_000) });
      await response.arrayBuffer();
      check(response.status === test.status, `HTTP ${test.path} expected ${test.status}, got ${response.status}`);
      if (test.status === 307) check(response.headers.get("location")?.includes("/admin/login"), "Anonymous and forged sessions return to admin login");
    })));
  }
}
async function main() {
let report: object | undefined;
const started = performance.now();
try {
  // Two fixture workers, six conflicting writes each; pool capped at eight.
  for (let batch = 0; batch < 4; batch++) {
    const completed = await Promise.allSettled([fixture(batch * 2), fixture(batch * 2 + 1)]);
    const failed = completed.find(result => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
    console.log(`Completed fixture batch ${batch + 1}/4.`);
  }
  report = { date: new Date().toISOString(), environment: "confirmed Neon dev branch", stressClientPool: 8, appPoolDefaultForNeon: 4, serverMode: origin ? mode : "no HTTP server", fixtureWorkers: 2, competingWriters: 6, fixtureOwners: 8, assertions, elapsedSeconds: +( (performance.now() - started) / 1000).toFixed(2), samples: Object.fromEntries(Object.entries(samples).map(([name, values]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return [name, { count: values.length, p50Ms: Math.round(sorted[Math.ceil(sorted.length * .5) - 1]), p95Ms: Math.round(sorted[Math.ceil(sorted.length * .95) - 1]), maxMs: Math.round(sorted.at(-1)!) }];
  })), limits: "Bounded workspace contention and route authorization; not saturation, prolonged soak, OAuth-provider or full SAT load testing." };

} finally {
  await db.user.deleteMany({ where: { id: { in: users }, email: { startsWith: prefix, endsWith: "@fixture.invalid" } } });
  const remaining = await db.user.count({ where: { email: { startsWith: prefix } } });
  await db.$disconnect();
  assert.equal(remaining, 0, "Stress fixture cleanup failed");
  console.log("Scoped fixture cleanup verified.");
}
if (report) {
  report = { ...report, fixtureCleanupVerified: true };
  await writeFile("docs/workspace-stress-latest.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}

}
void main().catch(error => { console.error(error instanceof Error ? error.message : "Stress audit failed"); process.exitCode = 1; });
