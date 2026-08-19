/**
 * `POST /api/tests/import` — load your own SAT question bank into Sirius.
 *
 * Sirius ships with no question content: you own that. This endpoint is the
 * seam. It accepts loosely-shaped JSON (see `lib/validation/test-import.ts` for
 * the aliases it understands), validates it, and writes it to Postgres.
 *
 * Idempotency: a test is identified by `externalId`. Re-posting the same
 * payload updates the existing test in place rather than creating a duplicate,
 * so the endpoint is safe to wire into a script you run repeatedly. Questions
 * are replaced wholesale on each import — the payload is the source of truth for
 * a test's content.
 *
 * Auth: send `Authorization: Bearer $TEST_IMPORT_TOKEN`. In development the
 * token may be unset for convenience; in production a missing token makes the
 * endpoint refuse every request, so an unconfigured deployment cannot have its
 * question bank overwritten by an anonymous caller.
 *
 * Example:
 *   curl -X POST http://localhost:3000/api/tests/import \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer $TEST_IMPORT_TOKEN" \
 *     --data-binary @my-questions.json
 *
 * `GET` on this route returns a machine-readable description of the accepted
 * payload, so you can check the contract without reading the source.
 */

import { timingSafeEqual } from "node:crypto";

import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import {
  parseImportPayload,
  resolveCorrectAnswerLabel,
  type ImportTest,
} from "@/lib/validation/test-import";

/** Cap the request body so a malformed or hostile payload cannot exhaust memory. */
const MAX_BODY_BYTES = 8 * 1024 * 1024; // 8 MB

/** Constant-time string comparison, to avoid leaking the token via timing. */
function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

type AuthOutcome = { ok: true } | { ok: false; status: number; message: string };

function authorise(request: Request): AuthOutcome {
  const expected = process.env.TEST_IMPORT_TOKEN?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!expected) {
    if (isProduction) {
      return {
        ok: false,
        status: 503,
        message:
          "TEST_IMPORT_TOKEN is not configured on the server, so imports are " +
          "disabled. Set it in the environment and redeploy.",
      };
    }
    // Development convenience: no token configured, no token required.
    return { ok: true };
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();

  if (!provided || !tokensMatch(provided, expected)) {
    return {
      ok: false,
      status: 401,
      message:
        "Missing or invalid bearer token. Send `Authorization: Bearer " +
        "$TEST_IMPORT_TOKEN`.",
    };
  }

  return { ok: true };
}

/** Persist one validated test, replacing any previous content under the same id. */
async function upsertTest(test: ImportTest) {
  return prisma.$transaction(
    async (tx) => {
      const data = {
        title: test.title,
        description: test.description ?? null,
        type: test.type,
        isPublished: test.isPublished,
        durationMinutes: test.durationMinutes,
      };

      // `externalId` is what makes re-imports idempotent. Without one we can
      // only ever create a new test.
      const record = test.externalId
        ? await tx.test.upsert({
            where: { externalId: test.externalId },
            create: { ...data, externalId: test.externalId },
            update: data,
          })
        : await tx.test.create({ data });

      // The payload defines the test's content, so clear what was there before.
      const removed = await tx.question.deleteMany({
        where: { testId: record.id },
      });

      await tx.question.createMany({
        data: test.questions.map((question) => ({
          testId: record.id,
          externalId: question.externalId ?? null,
          order: question.order,
          module: question.module,
          passageText: question.passageText ?? null,
          passageTitle: question.passageTitle ?? null,
          questionText: question.questionText,
          format: question.format,
          options: question.options ?? undefined,
          // Store the label, never the option text, so grading is a simple
          // label comparison regardless of how the payload expressed it.
          correctAnswer: resolveCorrectAnswerLabel(question),
          explanation: question.explanation ?? null,
          domain: question.domain ?? null,
          skill: question.skill ?? null,
          difficulty: question.difficulty,
        })),
      });

      return {
        id: record.id,
        externalId: record.externalId,
        title: record.title,
        type: record.type,
        isPublished: record.isPublished,
        questionsImported: test.questions.length,
        questionsReplaced: removed.count,
      };
    },
    // A few hundred questions across several tests can outrun the default 5s.
    { timeout: 30_000 },
  );
}

export async function POST(request: Request) {
  const auth = authorise(request);
  if (!auth.ok) {
    return Response.json(
      { ok: false, error: auth.message },
      { status: auth.status },
    );
  }

  if (!isDatabaseConfigured()) {
    return Response.json(
      {
        ok: false,
        error:
          "No database configured. Set DATABASE_URL in .env and run " +
          "`npx prisma db push`, then retry.",
      },
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json(
      {
        ok: false,
        error: `Payload too large. The limit is ${MAX_BODY_BYTES / 1024 / 1024} MB; split the import into batches.`,
      },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Request body is not valid JSON." },
      { status: 400 },
    );
  }

  const parsed = parseImportPayload(body);
  if (!parsed.ok) {
    return Response.json(
      {
        ok: false,
        error: "Validation failed. No changes were written.",
        issues: parsed.issues,
      },
      { status: 422 },
    );
  }

  try {
    // Sequential rather than parallel: each test is its own transaction, and
    // serialising them keeps the connection pool and error attribution simple.
    const imported = [];
    for (const test of parsed.data.tests) {
      imported.push(await upsertTest(test));
    }

    const questionCount = imported.reduce(
      (total, test) => total + test.questionsImported,
      0,
    );

    return Response.json({
      ok: true,
      summary: {
        testsImported: imported.length,
        questionsImported: questionCount,
      },
      tests: imported,
    });
  } catch (error) {
    console.error("[tests/import] failed to write import", error);
    return Response.json(
      {
        ok: false,
        error:
          "The payload was valid but could not be written to the database. " +
          "Check the server logs and that `npx prisma db push` has been run.",
      },
      { status: 500 },
    );
  }
}

/** Self-describing contract, so the importer can be used without reading code. */
export function GET() {
  return Response.json({
    endpoint: "POST /api/tests/import",
    auth: "Authorization: Bearer $TEST_IMPORT_TOKEN",
    idempotency:
      "Tests are keyed on `externalId`. Re-posting the same payload updates " +
      "the test in place and replaces its questions.",
    accepts: [
      "{ tests: [ <test>, … ] }",
      "[ <test>, … ]",
      "<test>",
      "{ test: <test>, questions: [ <question>, … ] }",
    ],
    test: {
      externalId: "string (optional, but required for idempotent re-import)",
      title: "string (required)",
      description: "string (optional)",
      type: "'reading' | 'math' | 'full' — aliases accepted (rw, verbal, maths…)",
      isPublished: "boolean (default true)",
      durationMinutes: "integer (default 32, or 35 for math)",
      questions: "array (required, 1–200)",
    },
    question: {
      externalId: "string (optional)",
      order: "integer (defaults to array position)",
      module: "1 | 2 | 'MODULE_1' | 'MODULE_2' (default MODULE_1)",
      passageText: "string (optional) — shown in the simulator's left pane",
      passageTitle: "string (optional)",
      questionText: "string (required) — aliases: question, prompt, stem",
      format:
        "'multiple_choice' | 'spr' — inferred from the presence of options if omitted",
      options: [
        "['first', 'second']  → labelled A, B, …",
        "[{ label: 'A', text: 'first' }]",
        "{ A: 'first', B: 'second' }",
      ],
      correctAnswer:
        "option label ('B'), option text, or for SPR the accepted value. " +
        "Use 'a|b' to accept several values.",
      explanation: "string (optional) — shown on the review screen",
      domain: "string (optional) e.g. 'Information and Ideas'",
      skill: "string (optional)",
      difficulty: "'easy' | 'medium' | 'hard' | 1 | 2 | 3 (default medium)",
    },
    example: {
      externalId: "sat-practice-1",
      title: "Practice Test 1 — Reading & Writing",
      type: "reading",
      isPublished: true,
      questions: [
        {
          externalId: "q1",
          module: 1,
          passageText:
            "The ubiquitous presence of plastic in the ocean is a resilient problem…",
          questionText:
            "Which choice best states the main idea of the passage?",
          options: {
            A: "Plastic pollution is easily reversed.",
            B: "Plastic persists in marine environments.",
            C: "Ocean currents are poorly understood.",
            D: "Marine life is unaffected by plastic.",
          },
          correctAnswer: "B",
          explanation:
            "The passage emphasises persistence, which choice B restates.",
          domain: "Information and Ideas",
          difficulty: "medium",
        },
      ],
    },
  });
}
