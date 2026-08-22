/**
 * Preparing a bank file for the database.
 *
 * Two halves: hand-written cases for each way a question can be rejected, and a
 * pass over the real files in `prisma/data/sat/` asserting that the bank we
 * ship imports cleanly and completely.
 */

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  orderFromExternalId,
  prepareBank,
  splitAcceptedAnswers,
} from "@/lib/validation/sat-bank";

const DATA_DIR = fileURLToPath(new URL("../prisma/data/sat/", import.meta.url));

const multipleChoice = {
  id: "eng-1",
  topic: "Reading - Main Idea",
  type: "multiple_choice",
  passage: "A passage.",
  question: "What is the main idea?",
  options: { A: "First", B: "Second", C: "Third", D: "Fourth" },
  answer: "C",
};

const gridIn = {
  id: "math-18",
  topic: "Probability",
  type: "grid_in",
  question: "What is the probability?",
  answer: "0.35 or 7/20",
};

function bank(questions: unknown[], subject = "English") {
  return prepareBank({ subject, questions });
}

describe("splitAcceptedAnswers", () => {
  it("splits the prose the banks write alternatives in", () => {
    expect(splitAcceptedAnswers("0.35 or 7/20")).toEqual(["0.35", "7/20"]);
    expect(splitAcceptedAnswers("3/4|0.75")).toEqual(["3/4", "0.75"]);
    expect(splitAcceptedAnswers("1;2")).toEqual(["1", "2"]);
  });

  it("does not split a thousands separator", () => {
    expect(splitAcceptedAnswers("1,200")).toEqual(["1,200"]);
  });

  it("drops repeats and blanks", () => {
    expect(splitAcceptedAnswers("0.5 or 0.5")).toEqual(["0.5"]);
    expect(splitAcceptedAnswers("  ")).toEqual([]);
  });
});

describe("orderFromExternalId", () => {
  it("reads the position out of the id so two files stay in one sequence", () => {
    expect(orderFromExternalId("eng-7", 0)).toBe(7);
    expect(orderFromExternalId("math-20", 3)).toBe(20);
  });

  it("falls back to file order for an id without a number", () => {
    expect(orderFromExternalId("intro", 4)).toBe(5);
  });
});

describe("prepareBank — the envelope", () => {
  it("rejects a file that is not a bank file", () => {
    expect(prepareBank({ questions: [] }).ok).toBe(false);
    expect(prepareBank({ subject: "History", questions: [multipleChoice] }).ok).toBe(
      false,
    );
    expect(prepareBank(null).ok).toBe(false);
  });

  it("maps the subject onto a section", () => {
    const english = bank([multipleChoice]);
    expect(english.ok && english.bank.section).toBe("READING");

    const math = bank([gridIn], "Math");
    expect(math.ok && math.bank.section).toBe("MATH");
  });
});

describe("prepareBank — multiple choice", () => {
  it("keeps the options, the label and the taxonomy link", () => {
    const result = bank([multipleChoice]);
    if (!result.ok) throw new Error("expected the file to parse");

    const [question] = result.bank.prepared;
    expect(result.bank.rejected).toEqual([]);
    expect(question.format).toBe("MULTIPLE_CHOICE");
    expect(question.correctAnswer).toBe("C");
    expect(question.acceptedAnswers).toEqual([]);
    expect(question.options).toEqual([
      { label: "A", text: "First" },
      { label: "B", text: "Second" },
      { label: "C", text: "Third" },
      { label: "D", text: "Fourth" },
    ]);
    expect(question.skillCode).toBe("RW_INFO_IDEAS_CENTRAL_IDEAS");
    expect(question.skillVia).toBe("topic");
    expect(question.sourceTopic).toBe("Reading - Main Idea");
    expect(question.passageText).toBe("A passage.");
  });

  it("accepts an answer given as the option's text", () => {
    const result = bank([{ ...multipleChoice, answer: "Third" }]);
    if (!result.ok) throw new Error("expected the file to parse");
    expect(result.bank.prepared[0].correctAnswer).toBe("C");
  });

  it("rejects an answer that matches no option", () => {
    const result = bank([{ ...multipleChoice, answer: "E" }]);
    if (!result.ok) throw new Error("expected the file to parse");

    expect(result.bank.prepared).toEqual([]);
    expect(result.bank.rejected[0].externalId).toBe("eng-1");
    expect(result.bank.rejected[0].reason).toContain("matches none of the options");
  });

  it("rejects a question with fewer than two options", () => {
    const result = bank([{ ...multipleChoice, options: { A: "Only" }, answer: "A" }]);
    if (!result.ok) throw new Error("expected the file to parse");
    expect(result.bank.rejected[0].reason).toContain("at least 2 options");
  });
});

describe("prepareBank — grid-in", () => {
  it("splits every accepted form and keeps the first as canonical", () => {
    const result = bank([gridIn], "Math");
    if (!result.ok) throw new Error("expected the file to parse");

    const [question] = result.bank.prepared;
    expect(question.format).toBe("SPR");
    expect(question.correctAnswer).toBe("0.35");
    expect(question.acceptedAnswers).toEqual(["0.35", "7/20"]);
    expect(question.options).toEqual([]);
    expect(question.passageText).toBeNull();
  });

  it("keeps a zero answer, which is a value and not a blank", () => {
    const result = bank([{ ...gridIn, id: "math-11", answer: "0" }], "Math");
    if (!result.ok) throw new Error("expected the file to parse");
    expect(result.bank.prepared[0].acceptedAnswers).toEqual(["0"]);
  });

  it("rejects a grid-in that also carries options", () => {
    const result = bank(
      [{ ...gridIn, options: { A: "1", B: "2" } }],
      "Math",
    );
    if (!result.ok) throw new Error("expected the file to parse");
    expect(result.bank.rejected[0].reason).toContain("must not carry options");
  });

  it("rejects an answer with no numeric form", () => {
    const result = bank([{ ...gridIn, answer: "see the diagram" }], "Math");
    if (!result.ok) throw new Error("expected the file to parse");
    expect(result.bank.rejected[0].reason).toContain("no numeric form");
  });
});

describe("prepareBank — taxonomy", () => {
  it("files a question by override when its label is too coarse", () => {
    const result = prepareBank({
      subject: "Math",
      questions: [
        {
          id: "math-7",
          topic: "Linear Equations",
          type: "grid_in",
          question: "58 = 2x + 2y. The width is 14. What is the length?",
          answer: "15",
        },
      ],
    });
    if (!result.ok) throw new Error("expected the file to parse");

    const [question] = result.bank.prepared;
    expect(question.skillCode).toBe("MATH_ALGEBRA_LINEAR_EQ_TWO_VAR");
    expect(question.skillVia).toBe("override");
  });

  it("rejects an unmapped topic instead of inventing a skill", () => {
    const result = bank([{ ...multipleChoice, topic: "Vibes" }]);
    if (!result.ok) throw new Error("expected the file to parse");

    expect(result.bank.prepared).toEqual([]);
    expect(result.bank.rejected[0].reason).toContain("not in the taxonomy");
  });

  it("skips one bad question without losing the good ones", () => {
    const result = bank([
      multipleChoice,
      { ...multipleChoice, id: "eng-2", topic: "Vibes" },
      { ...multipleChoice, id: "eng-3" },
    ]);
    if (!result.ok) throw new Error("expected the file to parse");

    expect(result.bank.prepared.map((question) => question.externalId)).toEqual([
      "eng-1",
      "eng-3",
    ]);
    expect(result.bank.rejected).toHaveLength(1);
  });

  it("reports the id of a row that fails schema validation", () => {
    const result = bank([{ id: "eng-9", topic: "Reading - Inference" }]);
    if (!result.ok) throw new Error("expected the file to parse");
    expect(result.bank.rejected[0].externalId).toBe("eng-9");
  });
});

describe("the shipped bank", () => {
  const files = readdirSync(DATA_DIR).filter((name) => name.endsWith(".json"));

  it.each(files)("%s imports with nothing rejected", (file) => {
    const raw: unknown = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
    const result = prepareBank(raw);
    if (!result.ok) throw new Error(`${file}: ${result.error}`);

    expect(result.bank.rejected).toEqual([]);
    expect(result.bank.prepared.length).toBeGreaterThan(0);

    for (const question of result.bank.prepared) {
      expect(question.externalId).not.toBe("");
      expect(question.order).toBeGreaterThan(0);
      expect(question.skillCode).not.toBe("");

      if (question.format === "MULTIPLE_CHOICE") {
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.options.map((option) => option.label)).toContain(
          question.correctAnswer,
        );
      } else {
        expect(question.acceptedAnswers.length).toBeGreaterThan(0);
        expect(question.acceptedAnswers[0]).toBe(question.correctAnswer);
      }
    }
  });
});
