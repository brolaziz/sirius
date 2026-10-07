import { describe, expect, it } from "vitest";
import { scheduleWordReview } from "@/lib/word-review";
const now = new Date("2026-10-05T12:00:00Z");
describe("word recall schedule", () => {
  it("returns a forgotten word in ten minutes and resets the repetition count", () => {
    const result = scheduleWordReview({ repetitions: 8, intervalDays: 100 }, "again", now);
    expect(result.repetitions).toBe(0); expect(result.intervalDays).toBe(0);
    expect(result.nextReviewAt.getTime() - now.getTime()).toBe(600_000);
  });
  it("spaces successful recalls and keeps hard recalls closer than easy ones", () => {
    const first = scheduleWordReview({ repetitions: 0, intervalDays: 0 }, "good", now);
    const second = scheduleWordReview(first, "good", now);
    expect(first.intervalDays).toBe(1); expect(second.intervalDays).toBe(3);
    expect(scheduleWordReview(second, "hard", now).intervalDays).toBeLessThan(scheduleWordReview(second, "easy", now).intervalDays);
  });
  it("caps intervals at one year", () => {
    expect(scheduleWordReview({ repetitions: 100, intervalDays: 365 }, "easy", now).intervalDays).toBe(365);
  });
});
