import { describe, expect, it } from "vitest";
import { actionErrorText } from "@/lib/i18n/action-errors";
describe("student-facing action errors", () => {
  it("explains a known save conflict in Uzbek", () => {
    expect(actionErrorText("Newer progress has already been saved. Reload this attempt.", "Xatolik", "uz")).toContain("sahifani yangilang");
  });
  it("uses the localized fallback for unknown server validation messages", () => {
    expect(actionErrorText("Invalid input: expected number", "Maydonlarni tekshiring.", "uz")).toBe("Maydonlarni tekshiring.");
    expect(actionErrorText("Session not found.", "Failed", "en")).toBe("Session not found.");
  });
});
