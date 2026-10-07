import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportPayload } from "@/lib/validation/test-import";

describe("delivered JSON import contract", () => {
  it("accepts the actual guide template including an empty full container", () => {
    const body = JSON.parse(readFileSync("docs/content/sirius-questions-template.json", "utf8"));
    const parsed = parseImportPayload(body);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error("Template invalid");
    expect(parsed.data.tests[0].questions).toHaveLength(2);
    expect(parsed.data.tests[0].questions[1].acceptedAnswers).toEqual(["0.75"]);
    expect(parsed.data.tests[1].questions).toEqual([]);
    expect(parsed.data.tests[1].isPublished).toBe(false);
  });
  it("refuses empty section tests and ambiguous multiple-choice labels", () => {
    expect(parseImportPayload({ type: "MATH", title: "Fixture", questions: [] }).ok).toBe(false);
    expect(parseImportPayload({ type: "MATH", title: "Fixture", questions: [{ questionText: "Fixture", correctAnswer: "A", options: [{ label: "A", text: "2" }, { label: "a", text: "3" }] }] }).ok).toBe(false);
  });
  it("does not accept review or role claims from JSON", () => {
    const parsed = parseImportPayload({ type: "MATH", title: "Fixture", role: "ADMIN", questions: [{ questionText: "Fixture", correctAnswer: "2", reviewStatus: "VERIFIED", reviewedById: "forged" }] });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error("Fixture invalid");
    expect(parsed.data.tests[0]).not.toHaveProperty("role");
    expect(parsed.data.tests[0].questions[0]).not.toHaveProperty("reviewStatus");
    expect(parsed.data.tests[0].questions[0]).not.toHaveProperty("reviewedById");
  });
});
