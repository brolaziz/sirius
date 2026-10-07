import { afterEach, describe, expect, it, vi } from "vitest";
import { studyPreferencesSchema } from "@/lib/validation/study-preferences";

const input = { currentScore: 1100, targetScore: 1400, examDate: "2027-02-28", weeklyStudyMinutes: 300 };
afterEach(() => vi.useRealTimers());
describe("preparation settings", () => {
  it("accepts an unknown baseline without manufacturing a diagnostic score", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-05T12:00:00Z"));
    expect(studyPreferencesSchema.parse({ ...input, currentScore: null }).currentScore).toBeNull();
  });
  it("rejects impossible dates, past dates and malformed text without throwing", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-05T12:00:00Z"));
    for (const examDate of ["2027-02-31", "2026-01-01", "invalid"]) {
      expect(studyPreferencesSchema.safeParse({ ...input, examDate }).success).toBe(false);
    }
  });
  it("rejects inconsistent goals and invalid time budgets", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-05T12:00:00Z"));
    expect(studyPreferencesSchema.safeParse({ ...input, targetScore: 1000 }).success).toBe(false);
    for (const weeklyStudyMinutes of [0, 31, 3000]) expect(studyPreferencesSchema.safeParse({ ...input, weeklyStudyMinutes }).success).toBe(false);
    expect(studyPreferencesSchema.safeParse(input).success).toBe(true);
  });
});
