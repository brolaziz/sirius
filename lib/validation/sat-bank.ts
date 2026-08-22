/**
 * Validation for the SAT question bank shipped in `prisma/data/sat/*.json`.
 *
 * This is the *bank* importer, and it is deliberately stricter than the public
 * one in `test-import.ts`. That module exists to accept a stranger's JSON and
 * bend it into shape; this one reads files that live in the repository, where a
 * surprise is a mistake rather than a dialect. So:
 *
 *   • the shape is fixed — no field aliases, no inferred formats;
 *   • `topic` must resolve through the taxonomy in `lib/taxonomy.ts`, and a
 *     label that does not is a rejected question, never a new skill;
 *   • one bad question is skipped and reported, not fatal — a typo in question
 *     14 must not keep the other 39 out of the database.
 *
 * Everything here is pure: no database, no filesystem. `scripts/import-sat-bank.ts`
 * does the I/O, which is what makes the rules testable without a Postgres.
 */

import { z } from "zod";

import type { QuestionFormat } from "@/lib/generated/prisma/enums";
import { isNumericAnswer } from "@/lib/sat";
import {
  resolveSkill,
  type Section,
  type SkillCode,
  type SkillResolutionSource,
} from "@/lib/taxonomy";

/* -------------------------------------------------------------------------- */
/* The file format                                                             */
/* -------------------------------------------------------------------------- */

/** The `subject` field of a bank file. */
export type BankSubject = "English" | "Math";

/** Which section of the test a bank file belongs to. */
export const SUBJECT_SECTION: Readonly<Record<BankSubject, Section>> = {
  English: "READING",
  Math: "MATH",
};

/**
 * The envelope. `questions` is left as `unknown[]` on purpose: validating each
 * question separately is what lets a single malformed entry be reported and
 * skipped instead of failing the whole file.
 */
const bankFileSchema = z.object({
  subject: z.enum(["English", "Math"]),
  questions: z.array(z.unknown()).min(1, "a bank file needs at least one question"),
});

const bankQuestionSchema = z.object({
  id: z.string().min(1).max(100),
  topic: z.string().min(1).max(200),
  type: z.enum(["multiple_choice", "grid_in"]),
  passage: z.string().max(20_000).optional(),
  question: z.string().min(1).max(5_000),
  options: z.record(z.string(), z.string().min(1).max(2_000)).optional(),
  answer: z.string().min(1).max(200),
});

export type BankQuestion = z.infer<typeof bankQuestionSchema>;

/* -------------------------------------------------------------------------- */
/* The prepared shape                                                          */
/* -------------------------------------------------------------------------- */

/**
 * An answer option, in the canonical shape `Question.options` stores.
 *
 * A type alias rather than an interface on purpose: `Question.options` is a
 * Json column, and Prisma's `InputJsonValue` only accepts object types that
 * carry an implicit index signature — which interfaces do not have.
 */
export type PreparedOption = {
  label: string;
  text: string;
};

/** One question, validated and ready to persist. */
export interface PreparedQuestion {
  /** The source file's own id ("eng-4"), unique per test. */
  externalId: string;
  order: number;
  format: QuestionFormat;
  passageText: string | null;
  questionText: string;
  options: PreparedOption[];
  /** The canonical answer, shown on the results screen. */
  correctAnswer: string;
  /** Every accepted form. Empty for multiple choice. */
  acceptedAnswers: string[];
  /** Authoritative taxonomy key — the `code` of a `Skill` row. */
  skillCode: SkillCode;
  /**
   * Whether the code came from the question's own label or from the
   * per-question override table. The import report counts the overrides, so
   * that a table nobody remembers writing does not go unnoticed.
   */
  skillVia: SkillResolutionSource;
  /** The raw `topic` string, kept for auditing the mapping. */
  sourceTopic: string;
}

/** A question that will not be imported, and why. */
export interface RejectedQuestion {
  /** The source id, when the row had one worth quoting. */
  externalId: string | null;
  reason: string;
}

export interface PreparedBank {
  subject: BankSubject;
  section: Section;
  prepared: PreparedQuestion[];
  rejected: RejectedQuestion[];
}

export type BankParseResult =
  | { ok: true; bank: PreparedBank }
  | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/* Answers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Split a source answer into every form it accepts.
 *
 * The banks write alternatives as prose — `"0.35 or 7/20"` — and some exports
 * use `|` or `;`. A comma is **not** a separator: `"1,200"` is one number, and
 * splitting on it would turn a correct answer into two wrong ones.
 */
export function splitAcceptedAnswers(raw: string): string[] {
  const parts = raw
    .split(/\s+or\s+|[|;]/i)
    .map((part) => part.trim())
    .filter((part) => part !== "");

  // Preserve order while dropping repeats ("0.5 or 0.5").
  return [...new Set(parts)];
}

/**
 * The position a question takes inside its test.
 *
 * Bank ids carry it (`eng-7` is the seventh), and honouring that keeps the two
 * files of one subject in a single sequence rather than restarting at 1
 * halfway through. Ids without a trailing number fall back to file order.
 */
export function orderFromExternalId(externalId: string, index: number): number {
  const match = /(\d+)\s*$/.exec(externalId);
  if (!match) return index + 1;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : index + 1;
}

/* -------------------------------------------------------------------------- */
/* Preparation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Validate one bank file and prepare its questions.
 *
 * `ok: false` means the *file* is unusable (wrong envelope, unknown subject).
 * A file that parses always returns `ok: true`, with per-question failures in
 * `bank.rejected` — the caller prints them and carries on.
 */
export function prepareBank(raw: unknown): BankParseResult {
  const file = bankFileSchema.safeParse(raw);
  if (!file.success) {
    return {
      ok: false,
      error: file.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; "),
    };
  }

  const subject = file.data.subject;
  const prepared: PreparedQuestion[] = [];
  const rejected: RejectedQuestion[] = [];

  file.data.questions.forEach((rawQuestion, index) => {
    const result = prepareQuestion(rawQuestion, index);
    if (result.ok) prepared.push(result.question);
    else rejected.push(result.rejection);
  });

  return {
    ok: true,
    bank: {
      subject,
      section: SUBJECT_SECTION[subject],
      prepared,
      rejected,
    },
  };
}

type QuestionResult =
  | { ok: true; question: PreparedQuestion }
  | { ok: false; rejection: RejectedQuestion };

function prepareQuestion(raw: unknown, index: number): QuestionResult {
  const parsed = bankQuestionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      rejection: {
        externalId: readIdForReporting(raw),
        reason: parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
          .join("; "),
      },
    };
  }

  const question = parsed.data;
  const reject = (reason: string): QuestionResult => ({
    ok: false,
    rejection: { externalId: question.id, reason },
  });

  const resolved = resolveSkill(question.topic, question.id);
  if (!resolved) {
    return reject(
      `topic "${question.topic}" is not in the taxonomy — add it to ` +
        "SOURCE_TOPIC_MAP in lib/taxonomy.ts",
    );
  }

  const shared = {
    externalId: question.id,
    order: orderFromExternalId(question.id, index),
    passageText: question.passage?.trim() || null,
    questionText: question.question,
    skillCode: resolved.code,
    skillVia: resolved.via,
    sourceTopic: question.topic,
  };

  if (question.type === "multiple_choice") {
    const options = toOptions(question.options);
    if (options.length < 2) {
      return reject("a multiple-choice question needs at least 2 options");
    }

    const label = resolveOptionLabel(options, question.answer);
    if (!label) {
      return reject(
        `answer "${question.answer}" matches none of the options ` +
          `(${options.map((option) => option.label).join(", ")})`,
      );
    }

    return {
      ok: true,
      question: {
        ...shared,
        format: "MULTIPLE_CHOICE",
        options,
        correctAnswer: label,
        acceptedAnswers: [],
      },
    };
  }

  /*
   * Grid-in. Options on a grid-in question mean the source file contradicts
   * itself about what kind of question this is, and guessing which half is
   * right is how a student ends up typing an answer into a question that has
   * choices.
   */
  if (question.options && Object.keys(question.options).length > 0) {
    return reject("a grid_in question must not carry options");
  }

  const acceptedAnswers = splitAcceptedAnswers(question.answer);
  if (acceptedAnswers.length === 0) {
    return reject("answer is empty");
  }

  if (!acceptedAnswers.some(isNumericAnswer)) {
    return reject(
      `answer "${question.answer}" has no numeric form — a grid-in answer is ` +
        "always a number",
    );
  }

  return {
    ok: true,
    question: {
      ...shared,
      format: "SPR",
      options: [],
      correctAnswer: acceptedAnswers[0],
      acceptedAnswers,
    },
  };
}

/** `{ "A": "Cats" }` -> `[{ label: "A", text: "Cats" }]`, labels upper-cased. */
function toOptions(
  options: Record<string, string> | undefined,
): PreparedOption[] {
  if (!options) return [];

  return Object.entries(options)
    .map(([label, text]) => ({
      label: label.trim().toUpperCase(),
      text: text.trim(),
    }))
    .filter((option) => option.label !== "" && option.text !== "");
}

/**
 * Resolve the answer to an option label. Accepts either the label itself
 * ("B") or the option's full text, which is how some exports write it.
 */
function resolveOptionLabel(
  options: PreparedOption[],
  answer: string,
): string | null {
  const wanted = answer.trim().toLowerCase();

  const byLabel = options.find(
    (option) => option.label.toLowerCase() === wanted,
  );
  if (byLabel) return byLabel.label;

  const byText = options.find(
    (option) => option.text.trim().toLowerCase() === wanted,
  );
  return byText ? byText.label : null;
}

/**
 * Best-effort id for a row that failed schema validation — the report is much
 * more useful saying which question broke than saying "question 12 of 20".
 */
function readIdForReporting(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null) return null;
  const id = (raw as Record<string, unknown>).id;
  return typeof id === "string" && id.trim() !== "" ? id : null;
}
