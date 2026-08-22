/**
 * The mapping from source labels to skill codes, and its coverage of the
 * question bank actually in the repo.
 *
 * Two of these tests are the ones that matter. One reads the real
 * `prisma/data/sat/*.json` and asserts that every `topic` in them resolves —
 * it turns "the importer skips unmapped topics" from a silent behaviour into a
 * failing test the moment a bank file arrives with a label nobody has mapped.
 * The other asserts that every per-question override still names a question
 * that exists, so the override table cannot rot into a list of ids for
 * questions that were renamed or removed.
 *
 * What is *not* tested here is the taxonomy itself — the names and weights of
 * the 8 domains and 31 skills live in the database, and the importer checks
 * them against `SKILL_CODES` on every run.
 */

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  QUESTION_SKILL_OVERRIDES,
  SKILL_CODES,
  SOURCE_TOPIC_MAP,
  isSkillCode,
  normaliseTopic,
  resolveSkill,
} from "@/lib/taxonomy";

const DATA_DIR = fileURLToPath(new URL("../prisma/data/sat/", import.meta.url));

interface BankFile {
  questions: Array<{ id: string; topic: string }>;
}

const files = readdirSync(DATA_DIR).filter((name) => name.endsWith(".json"));

function questionsIn(file: string): BankFile["questions"] {
  const parsed: unknown = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
  return (parsed as BankFile).questions;
}

describe("the closed vocabulary", () => {
  it("has no duplicate codes", () => {
    expect(new Set(SKILL_CODES).size).toBe(SKILL_CODES.length);
  });

  it("matches the 31 skills the database carries", () => {
    expect(SKILL_CODES).toHaveLength(31);
  });

  it("recognises its own codes and nothing else", () => {
    expect(isSkillCode("RW_CRAFT_WORDS_IN_CONTEXT")).toBe(true);
    expect(isSkillCode("rw_craft_words_in_context")).toBe(false);
    expect(isSkillCode("MATH_VIBES")).toBe(false);
  });

  it("maps every source label to a code in the vocabulary", () => {
    for (const [topic, code] of Object.entries(SOURCE_TOPIC_MAP)) {
      expect(isSkillCode(code), `${topic} -> ${code}`).toBe(true);
    }
  });

  it("overrides only to codes in the vocabulary", () => {
    for (const [id, code] of Object.entries(QUESTION_SKILL_OVERRIDES)) {
      expect(isSkillCode(code), `${id} -> ${code}`).toBe(true);
    }
  });
});

describe("normaliseTopic", () => {
  it("ignores case, punctuation and the spelling of &", () => {
    expect(normaliseTopic("Percent, Ratio & Proportion")).toBe(
      normaliseTopic("percent ratio and proportion"),
    );
    expect(normaliseTopic("Writing - Boundaries (Punctuation)")).toBe(
      normaliseTopic("writing boundaries punctuation"),
    );
  });
});

describe("resolveSkill", () => {
  it("resolves a label to its skill code", () => {
    expect(resolveSkill("Reading - Main Idea")).toEqual({
      code: "RW_INFO_IDEAS_CENTRAL_IDEAS",
      via: "topic",
    });
  });

  it("resolves labels the source files spell inconsistently", () => {
    expect(resolveSkill("linear equations")?.code).toBe(
      "MATH_ALGEBRA_LINEAR_EQ_ONE_VAR",
    );
    expect(resolveSkill("Functions and Function Notation")?.code).toBe(
      "MATH_ADVANCED_NONLINEAR_FUNCTIONS",
    );
  });

  it("lets a per-question override beat the label", () => {
    // math-7 is labelled "Linear Equations" but has two variables.
    expect(resolveSkill("Linear Equations", "math-7")).toEqual({
      code: "MATH_ALGEBRA_LINEAR_EQ_TWO_VAR",
      via: "override",
    });
  });

  it("still resolves an id with no override through its label", () => {
    expect(resolveSkill("Linear Equations", "math-1")).toEqual({
      code: "MATH_ALGEBRA_LINEAR_EQ_ONE_VAR",
      via: "topic",
    });
  });

  it("returns null for a label nobody has mapped", () => {
    expect(resolveSkill("Rocket Surgery")).toBeNull();
    expect(resolveSkill("")).toBeNull();
  });
});

describe("coverage of the shipped question bank", () => {
  it("finds the bank files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("maps every topic in %s", (file) => {
    const unmapped = questionsIn(file)
      .filter((question) => resolveSkill(question.topic, question.id) === null)
      .map((question) => `${question.id}: "${question.topic}"`);

    expect(unmapped).toEqual([]);
  });

  it("overrides only questions that exist in the bank", () => {
    const ids = new Set(
      files.flatMap((file) => questionsIn(file).map((question) => question.id)),
    );

    const stale = Object.keys(QUESTION_SKILL_OVERRIDES).filter(
      (id) => !ids.has(id),
    );

    expect(stale).toEqual([]);
  });
});
