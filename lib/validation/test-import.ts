/**
 * Validation and normalisation for `POST /api/tests/import`.
 *
 * The point of this module is that **you should not have to reshape your JSON to
 * fit Sirius**. Question banks come out of spreadsheets, scrapers and other
 * apps, all with different conventions, so the importer runs in two stages:
 *
 *   1. **Normalise** (plain TypeScript) — resolve field aliases
 *      (`question_text` / `questionText` / `prompt` / `stem`), coerce enums from
 *      loose strings or numbers (`"reading"`, `1`, `"module_2"`), and rewrite
 *      answer options from any of three common shapes into one.
 *   2. **Validate** (zod) — check the canonical shape and reject anything that
 *      would produce an unanswerable question, with a path-accurate error.
 *
 * Doing it in this order means error messages describe the caller's real
 * problem ("correctAnswer 'E' is not one of the options A–D") rather than a
 * type mismatch on a field they have never heard of.
 */

import { z } from "zod";

import type {
  Difficulty,
  QuestionFormat,
  TestModule,
  TestType,
} from "@/lib/generated/prisma/enums";

/* -------------------------------------------------------------------------- */
/* Alias resolution                                                            */
/* -------------------------------------------------------------------------- */

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Read the first present, non-empty value among a set of candidate keys.
 * Comparison is on the exact key, plus a snake_case/camelCase-insensitive
 * fallback, so `passage_text`, `passageText` and `PassageText` all resolve.
 */
function pick(source: UnknownRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }

  // Fallback: compare with separators and case stripped.
  const flatten = (key: string) => key.replace(/[_\-\s]/g, "").toLowerCase();
  const wanted = new Set(keys.map(flatten));
  for (const [key, value] of Object.entries(source)) {
    if (
      wanted.has(flatten(key)) &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return undefined;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

function asOptionalInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }
  return undefined;
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (["true", "yes", "1", "published"].includes(lower)) return true;
    if (["false", "no", "0", "draft"].includes(lower)) return false;
  }
  if (typeof value === "number") return value !== 0;
  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Enum coercion                                                               */
/* -------------------------------------------------------------------------- */

/** `"reading"`, `"Reading & Writing"`, `"rw"`, `"verbal"` -> `READING`. */
function coerceTestType(value: unknown): TestType | undefined {
  const raw = asOptionalString(value)?.toLowerCase().replace(/[^a-z]/g, "");
  if (!raw) return undefined;

  if (["reading", "readingwriting", "rw", "verbal", "english"].includes(raw)) {
    return "READING";
  }
  if (["math", "maths", "mathematics", "quant"].includes(raw)) return "MATH";
  if (["full", "fulltest", "complete", "both", "mock"].includes(raw)) {
    return "FULL";
  }
  return undefined;
}

/** `1`, `"1"`, `"module 1"`, `"MODULE_1"`, `"first"` -> `MODULE_1`. */
function coerceModule(value: unknown): TestModule | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  const numeric = asOptionalInt(value);
  if (numeric === 1) return "MODULE_1";
  if (numeric === 2) return "MODULE_2";

  const raw = asOptionalString(value)?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!raw) return undefined;
  if (raw.includes("2") || raw.includes("second")) return "MODULE_2";
  if (raw.includes("1") || raw.includes("first")) return "MODULE_1";
  return undefined;
}

/** `"mcq"`, `"multiple choice"` -> MULTIPLE_CHOICE; `"spr"`, `"grid-in"` -> SPR. */
function coerceFormat(value: unknown): QuestionFormat | undefined {
  const raw = asOptionalString(value)?.toLowerCase().replace(/[^a-z]/g, "");
  if (!raw) return undefined;

  if (
    ["spr", "studentproducedresponse", "gridin", "freeresponse", "fr"].includes(
      raw,
    )
  ) {
    return "SPR";
  }
  if (["multiplechoice", "mcq", "mc", "choice", "select"].includes(raw)) {
    return "MULTIPLE_CHOICE";
  }
  return undefined;
}

function coerceDifficulty(value: unknown): Difficulty | undefined {
  const raw = asOptionalString(value)?.toLowerCase().replace(/[^a-z]/g, "");
  if (!raw) {
    // Numeric difficulty scales (1–3) are common in exported banks.
    const numeric = asOptionalInt(value);
    if (numeric === 1) return "EASY";
    if (numeric === 2) return "MEDIUM";
    if (numeric === 3) return "HARD";
    return undefined;
  }
  if (["easy", "e", "low", "beginner"].includes(raw)) return "EASY";
  if (["medium", "m", "moderate", "mid", "average"].includes(raw)) {
    return "MEDIUM";
  }
  if (["hard", "h", "difficult", "high", "advanced"].includes(raw)) {
    return "HARD";
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Options normalisation                                                       */
/* -------------------------------------------------------------------------- */

/** The canonical answer-option shape stored in `Question.options`. */
export interface NormalisedOption {
  label: string;
  text: string;
}

const DEFAULT_LABELS = ["A", "B", "C", "D", "E", "F"];

/**
 * Accept any of the three shapes seen in the wild and return `{label, text}[]`:
 *
 *   `["Cats", "Dogs"]`                        -> labels assigned A, B, …
 *   `[{ label: "A", text: "Cats" }]`          -> used as-is
 *   `{ "A": "Cats", "B": "Dogs" }`            -> keys become labels
 */
function normaliseOptions(value: unknown): NormalisedOption[] | undefined {
  if (value === undefined || value === null) return undefined;

  if (Array.isArray(value)) {
    const options = value
      .map((item, index): NormalisedOption | null => {
        if (typeof item === "string" || typeof item === "number") {
          return {
            label: DEFAULT_LABELS[index] ?? String(index + 1),
            text: String(item).trim(),
          };
        }
        if (isRecord(item)) {
          const text = asOptionalString(
            pick(item, "text", "value", "content", "option", "answer", "body"),
          );
          const label =
            asOptionalString(pick(item, "label", "key", "id", "letter")) ??
            DEFAULT_LABELS[index] ??
            String(index + 1);
          if (!text) return null;
          return { label: label.trim().toUpperCase(), text };
        }
        return null;
      })
      .filter((option): option is NormalisedOption => option !== null);

    return options.length > 0 ? options : undefined;
  }

  if (isRecord(value)) {
    const options = Object.entries(value)
      .map(([label, text]): NormalisedOption | null => {
        const asText = asOptionalString(text);
        if (!asText) return null;
        return { label: label.trim().toUpperCase(), text: asText };
      })
      .filter((option): option is NormalisedOption => option !== null);

    return options.length > 0 ? options : undefined;
  }

  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Canonical schemas                                                           */
/* -------------------------------------------------------------------------- */

const questionSchema = z
  .object({
    externalId: z.string().min(1).max(200).optional(),
    order: z.number().int().min(1).max(1000),
    module: z.enum(["MODULE_1", "MODULE_2"]),
    passageText: z.string().max(20_000).optional(),
    passageTitle: z.string().max(300).optional(),
    questionText: z.string().min(1, "questionText must not be empty").max(5_000),
    format: z.enum(["MULTIPLE_CHOICE", "SPR"]),
    options: z
      .array(
        z.object({
          label: z.string().min(1).max(8),
          text: z.string().min(1).max(2_000),
        }),
      )
      .max(6)
      .optional(),
    correctAnswer: z.string().min(1, "correctAnswer is required").max(200),
    explanation: z.string().max(10_000).optional(),
    domain: z.string().max(200).optional(),
    skill: z.string().max(200).optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  })
  /*
   * Cross-field rules. These are the checks that stop an unanswerable question
   * reaching the database — the failure mode that would otherwise surface as a
   * student staring at a question with no correct option.
   */
  .refine(
    (question) =>
      question.format !== "MULTIPLE_CHOICE" ||
      (question.options?.length ?? 0) >= 2,
    {
      error: "a multiple-choice question needs at least 2 options",
      path: ["options"],
    },
  )
  .refine(
    (question) => {
      if (question.format !== "MULTIPLE_CHOICE" || !question.options) {
        return true;
      }
      const labels = question.options.map((option) =>
        option.label.toLowerCase(),
      );
      // The answer may name a label ("B") or repeat the option's text.
      const texts = question.options.map((option) =>
        option.text.trim().toLowerCase(),
      );
      const answer = question.correctAnswer.trim().toLowerCase();
      return labels.includes(answer) || texts.includes(answer);
    },
    {
      error: "correctAnswer must match one of the option labels or texts",
      path: ["correctAnswer"],
    },
  );

const testSchema = z.object({
  externalId: z.string().min(1).max(200).optional(),
  title: z.string().min(1, "title is required").max(300),
  description: z.string().max(2_000).optional(),
  type: z.enum(["READING", "MATH", "FULL"]),
  isPublished: z.boolean(),
  durationMinutes: z.number().int().min(1).max(600),
  questions: z
    .array(questionSchema)
    .min(1, "a test needs at least one question")
    .max(200),
});

/** A validated, ready-to-persist test. */
export type ImportTest = z.infer<typeof testSchema>;
export type ImportQuestion = z.infer<typeof questionSchema>;

/* -------------------------------------------------------------------------- */
/* Normalisation entry points                                                  */
/* -------------------------------------------------------------------------- */

function normaliseQuestion(raw: unknown, index: number): UnknownRecord {
  if (!isRecord(raw)) return {};

  const passageText = asOptionalString(
    pick(raw, "passageText", "passage_text", "passage", "stimulus", "context"),
  );

  const questionText = asOptionalString(
    pick(
      raw,
      "questionText",
      "question_text",
      "question",
      "prompt",
      "stem",
      "text",
    ),
  );

  const options = normaliseOptions(
    pick(raw, "options", "choices", "answers", "answerChoices", "answer_choices"),
  );

  const correctAnswer = asOptionalString(
    pick(
      raw,
      "correctAnswer",
      "correct_answer",
      "answer",
      "correct",
      "correctOption",
      "correct_option",
      "key",
    ),
  );

  // Infer the format when the payload does not say: no options means the
  // student has to type the answer, which is an SPR question.
  const format =
    coerceFormat(pick(raw, "format", "questionType", "question_type", "type")) ??
    (options && options.length > 0 ? "MULTIPLE_CHOICE" : "SPR");

  return {
    externalId: asOptionalString(
      pick(raw, "externalId", "external_id", "id", "questionId", "uid"),
    ),
    order:
      asOptionalInt(pick(raw, "order", "position", "index", "number", "no")) ??
      index + 1,
    module: coerceModule(pick(raw, "module", "moduleNumber", "section_module")) ??
      "MODULE_1",
    passageText,
    passageTitle: asOptionalString(
      pick(raw, "passageTitle", "passage_title", "title", "source"),
    ),
    questionText,
    format,
    options,
    correctAnswer,
    explanation: asOptionalString(
      pick(raw, "explanation", "rationale", "solution", "why"),
    ),
    domain: asOptionalString(pick(raw, "domain", "category", "topic", "area")),
    skill: asOptionalString(pick(raw, "skill", "subskill", "sub_skill", "tag")),
    /*
     * No fallback: a payload that does not rate its questions leaves
     * `difficulty` null, which reads as "not rated yet". Defaulting to MEDIUM
     * would record a guess as a fact, and the adaptive module selection that
     * will read this column later cannot tell the two apart.
     */
    difficulty: coerceDifficulty(pick(raw, "difficulty", "level", "diff")),
  };
}

function normaliseTest(raw: unknown): UnknownRecord {
  if (!isRecord(raw)) return {};

  /*
   * Accept both a nested envelope and a flat object:
   *   { test: { title, … }, questions: [ … ] }
   *   { title, …, questions: [ … ] }
   */
  const envelope = isRecord(raw.test) ? raw.test : raw;

  const rawQuestions = pick(raw, "questions", "items", "problems") ??
    pick(envelope, "questions", "items", "problems");

  const questions = Array.isArray(rawQuestions)
    ? rawQuestions.map(normaliseQuestion)
    : [];

  const type =
    coerceTestType(pick(envelope, "type", "section", "testType", "test_type")) ??
    // Fall back to inspecting the questions: a bank with passages is Reading.
    (questions.some((question) => Boolean(question.passageText))
      ? "READING"
      : "FULL");

  const durationMinutes =
    asOptionalInt(
      pick(envelope, "durationMinutes", "duration_minutes", "duration", "minutes"),
    ) ?? (type === "MATH" ? 35 : 32);

  return {
    externalId: asOptionalString(
      pick(envelope, "externalId", "external_id", "id", "slug", "code"),
    ),
    title:
      asOptionalString(pick(envelope, "title", "name", "label")) ??
      "Untitled test",
    description: asOptionalString(
      pick(envelope, "description", "summary", "about"),
    ),
    type,
    isPublished:
      asOptionalBoolean(
        pick(envelope, "isPublished", "is_published", "published", "live"),
      ) ?? true,
    durationMinutes,
    questions,
  };
}

/** Result of a successful parse. */
export interface ParsedImport {
  tests: ImportTest[];
}

/** A single validation failure, addressed to the caller's payload. */
export interface ImportIssue {
  /** Dotted path into the submitted JSON, e.g. `tests.0.questions.3.options`. */
  path: string;
  message: string;
}

export type ImportParseResult =
  | { ok: true; data: ParsedImport }
  | { ok: false; issues: ImportIssue[] };

/**
 * Parse and validate an import payload.
 *
 * Accepts, in order of preference:
 *   `{ tests: [ … ] }`          — batch
 *   `[ … ]`                     — bare array of tests
 *   `{ test: {…}, questions: [] }` or `{ title, questions: [] }` — single test
 */
export function parseImportPayload(body: unknown): ImportParseResult {
  let rawTests: unknown[];

  if (Array.isArray(body)) {
    rawTests = body;
  } else if (isRecord(body) && Array.isArray(body.tests)) {
    rawTests = body.tests;
  } else if (isRecord(body)) {
    rawTests = [body];
  } else {
    return {
      ok: false,
      issues: [
        {
          path: "",
          message:
            "expected a JSON object or array describing one or more tests",
        },
      ],
    };
  }

  if (rawTests.length === 0) {
    return {
      ok: false,
      issues: [{ path: "tests", message: "no tests found in payload" }],
    };
  }

  const parsed = z
    .array(testSchema)
    .max(50, "import at most 50 tests per request")
    .safeParse(rawTests.map(normaliseTest));

  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        path: ["tests", ...issue.path].join("."),
        message: issue.message,
      })),
    };
  }

  return { ok: true, data: { tests: parsed.data } };
}

/**
 * Resolve a `correctAnswer` that was given as option text into its label, so
 * grading only ever compares labels. Returns the input unchanged for SPR
 * questions or when it already names a label.
 */
export function resolveCorrectAnswerLabel(question: ImportQuestion): string {
  if (question.format !== "MULTIPLE_CHOICE" || !question.options) {
    return question.correctAnswer;
  }

  const answer = question.correctAnswer.trim().toLowerCase();

  const byLabel = question.options.find(
    (option) => option.label.toLowerCase() === answer,
  );
  if (byLabel) return byLabel.label;

  const byText = question.options.find(
    (option) => option.text.trim().toLowerCase() === answer,
  );
  return byText ? byText.label : question.correctAnswer;
}
