/**
 * Simulator route — full screen, outside the app shell.
 *
 * Deliberately not inside the `(app)` route group: during a timed test the
 * sidebar and top bar are distractions, and Bluebook takes over the whole
 * display. `proxy.ts` still protects `/simulator/*`.
 *
 * Server responsibilities:
 *   1. Load the test and its questions, selecting **only** fields that are safe
 *      to send to the browser — `correctAnswer` and `explanation` are excluded.
 *   2. Start or resume the attempt, which fixes the timer's anchor server-side.
 *   3. Rehydrate any answers already saved, so a reload resumes cleanly.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { SimulatorEngine } from "@/components/simulator/simulator-engine";
import { Button } from "@/components/ui/button";
import { startAttempt } from "@/lib/actions/attempts";
import { getDictionary, getLang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/config";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/user";
import { parseQuestionOptions, type SimulatorQuestion } from "@/lib/simulator";
import {
  moduleDeadline,
  parseModulePlan,
  questionIdsAt,
  specForPlanIndex,
} from "@/lib/mock";

export const metadata: Metadata = {
  title: "Test in progress",
  // Keep an in-progress test out of search results and browser history previews.
  robots: { index: false, follow: false },
};

/** Coerce a Prisma `Json` column into `Record<string, string>`. */
function asAnswerMap(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") result[key] = entry;
  }
  return result;
}

/** Coerce a Prisma `Json` column into a list of flagged question ids. */
function asFlaggedList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/** Shown when something prevents the test from starting. */
function SimulatorError({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {body}
        </div>
        <Button asChild size="lg" className="mt-6 h-10">
          <Link href="/practice">Back to practice</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function SimulatorPage({
  params,
}: PageProps<"/simulator/[testId]">) {
  // This route is outside the `(app)` group, so it does not inherit that
  // layout's guard — it needs its own resource-based check.
  await requireUserId();

  // In Next.js 16 route params are a Promise and must be awaited.
  const { testId } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <SimulatorError
        title="No database connected"
        body={
          <>
            Set <code className="font-mono text-xs">DATABASE_URL</code> in{" "}
            <code className="font-mono text-xs">.env</code> and run{" "}
            <code className="font-mono text-xs">npx prisma db push</code> before
            starting a test.
          </>
        }
      />
    );
  }

  const test = await prisma.test.findFirst({
    where: { id: testId, isPublished: true },
    select: {
      id: true,
      title: true,
      type: true,
      durationMinutes: true,
      questions: {
        orderBy: [{ module: "asc" }, { order: "asc" }],
        // NOTE: `correctAnswer` and `explanation` are intentionally absent.
        // Selecting them here would ship the answer key in the RSC payload.
        select: {
          id: true,
          order: true,
          module: true,
          passageText: true,
          passageTitle: true,
          questionText: true,
          format: true,
          options: true,
          domain: true,
        },
      },
    },
  });

  if (!test) notFound();

  if (test.questions.length === 0) {
    return (
      <SimulatorError
        title="This test has no questions"
        body="Import a question bank for this test, then try again."
      />
    );
  }

  const started = await startAttempt(test.id);
  if (!started.ok || !started.attemptId || !started.startedAtMs) {
    return (
      <SimulatorError
        title="Could not start this test"
        body={started.error ?? "Something went wrong. Please try again."}
      />
    );
  }

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: started.attemptId },
    select: {
      answers: true,
      flagged: true,
      modulePlan: true,
      moduleIndex: true,
      moduleStartedAt: true,
      startedAt: true,
    },
  });

  /*
   * A full sitting is four timed modules and this page renders one of them. The
   * plan was decided when the attempt started and is stored on it, so a reload
   * lands in the same module with the same clock — see `TestAttempt.modulePlan`.
   *
   * A test with no plan is a single-module practice test, which is what every
   * test was before modules existed. It renders exactly as it always has.
   */
  const plan = parseModulePlan(attempt?.modulePlan);
  const spec = plan.length > 0 ? specForPlanIndex(plan, attempt?.moduleIndex ?? 0) : null;

  const moduleQuestionIds = spec
    ? new Set(questionIdsAt(plan, attempt?.moduleIndex ?? 0))
    : null;

  const visibleQuestions = moduleQuestionIds
    ? test.questions.filter((question) => moduleQuestionIds.has(question.id))
    : test.questions;

  if (spec && visibleQuestions.length === 0) {
    return (
      <SimulatorError
        title="This module has no questions"
        body="The sitting could not be assembled. Import more of the question bank and start again."
      />
    );
  }

  const moduleStartedAt = attempt?.moduleStartedAt ?? attempt?.startedAt ?? null;

  const t = getDictionary(await getLang());

  const moduleProps =
    spec && moduleStartedAt
      ? {
          /*
           * Was a hardcoded English template. An Uzbek student sat in a timed
           * test read "Section 1, Module 1" — in the one screen they cannot
           * leave, for two hours. The Uzbek string is also shorter, which is
           * what stops it truncating at 320px.
           */
          label: fill(t.simulator.sectionModule, {
            section: spec.section === "READING" ? 1 : 2,
            module: spec.module === "MODULE_1" ? 1 : 2,
          }),
          deadlineMs: moduleDeadline(moduleStartedAt, spec).getTime(),
          hasNext: (attempt?.moduleIndex ?? 0) + 1 < plan.length,
          breakMinutes: spec.breakMinutes,
        }
      : undefined;

  const questions: SimulatorQuestion[] = visibleQuestions.map((question) => ({
    id: question.id,
    order: question.order,
    module: question.module,
    passageText: question.passageText,
    passageTitle: question.passageTitle,
    questionText: question.questionText,
    format: question.format,
    options: parseQuestionOptions(question.options),
    domain: question.domain,
  }));

  return (
    <SimulatorEngine
      attemptId={started.attemptId}
      test={{
        id: test.id,
        title: test.title,
        type: test.type,
        durationMinutes: test.durationMinutes,
      }}
      questions={questions}
      startedAtMs={started.startedAtMs}
      module={moduleProps}
      initialAnswers={asAnswerMap(attempt?.answers)}
      initialFlagged={asFlaggedList(attempt?.flagged)}
    />
  );
}
