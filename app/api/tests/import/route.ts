/**
 * `POST /api/tests/import` — load your own SAT question bank into Sirius.
 *
 * Sirius ships with no question content: you own that. This endpoint is the
 * seam. It accepts loosely-shaped JSON (see `lib/validation/test-import.ts` for
 * the aliases it understands), validates it, and writes it to Postgres.
 *
 * Idempotency: a test is identified by `externalId`. Re-posting the same
 * payload updates the existing test in place rather than creating a duplicate,
 * so the endpoint is safe to wire into a script you run repeatedly. Questions retain their IDs and content. Content revisions use a new question
 * externalId; questions omitted from later imports are retained.
 *
 * Auth: send `Authorization: Bearer $TEST_IMPORT_TOKEN`. A missing token
 * disables imports in every environment. Imports are drafts; review and
 * publishing require the authenticated content-management workflow.
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

import { importTest, QuestionRevisionConflict } from "@/lib/question-import";
import { timingSafeEqual } from "node:crypto";

import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import {
  parseImportPayload,
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
  if (!expected) {
      return {
        ok: false,
        status: 503,
        message:
          "TEST_IMPORT_TOKEN is not configured on the server, so imports are " +
          "disabled. Set it in the environment and redeploy.",
      };
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
    const imported = await prisma.$transaction(async (tx) => {
      const rows = [];
      for (const test of parsed.data.tests) rows.push(await importTest(tx, { ...test, isPublished: false }));
      return rows;
    }, { timeout: 60_000 });

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
    if (error instanceof QuestionRevisionConflict) return Response.json({ ok: false, error: error.message }, { status: 409 });
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
      "the container in place. Question IDs and content are preserved; revisions require a new question externalId. Missing questions are retained.",
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
      sourceName: "string (source or author; required for review and publishing)",
      rightsNote: "string (permission or ownership details; required for review and publishing)",
      type: "'reading' | 'math' | 'full' — aliases accepted (rw, verbal, maths…)",
      isPublished: "Imports are always drafts regardless of this input. Publish through /content.",
      durationMinutes: "integer (default 32, 35 for math, 144 for full)",
      questions: "array (1–200 for section tests; FULL containers may be empty)",
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
      acceptedAnswers: "string[] (optional, alternate SPR answers)",
      explanation: "string (optional) — shown on the review screen",
      domain: "string (optional) e.g. 'Information and Ideas'",
      skill: "string (optional)",
      skillCode: "string (optional taxonomy code; required for placement in full mock modules)",
      difficulty: "'easy' | 'medium' | 'hard' | 1 | 2 | 3 (unrated when omitted)",
    },
    example: {
      externalId: "sat-practice-1",
      title: "Practice Test 1 — Reading & Writing",
      type: "reading",
      isPublished: false,
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
