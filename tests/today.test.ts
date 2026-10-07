import { describe, expect, it } from "vitest";
import { chooseTodayAction } from "@/lib/today";
import type { StudyPlanView } from "@/lib/queries/study-plan";

const now = new Date("2026-10-05T12:00:00Z");
const plan: StudyPlanView = { id: "plan", createdAt: now, currentScore: null, targetScore: 1400,
  examDate: new Date("2027-01-01"), weeklyStudyMinutes: 300, weekCount: 1, weeksRemaining: 1,
  currentWeek: 1, weeklyQuestions: 10, totalQuestions: 10, projectedScore: null, onTrack: false,
  shortfallMinutesPerWeek: 0, bankLimited: false, weeks: [{ week: 1, startDate: new Date("2026-10-04"),
    dueDate: new Date("2026-10-10"), questions: 10, tasks: [{ id: "task", skillCode: "ALGEBRA", skillName: "Algebra",
      skillNameUz: "Algebra", domainName: "Math", targetQuestions: 10, completedQuestions: 4 }] }] };
const defaults = { resumes: [], plan, mockHref: "/simulator/mock", hasPractice: true, now };
describe("dashboard's real next action", () => {
  it("continues the most recent unfinished activity before offering a new task", () => {
    const action = chooseTodayAction({ ...defaults, resumes: [
      { href: "/practice/session/old", title: "Old", startedAt: new Date("2026-10-04") },
      { href: "/simulator/current", title: "Current", startedAt: now },
    ] });
    expect(action).toMatchObject({ kind: "resume", href: "/simulator/current" });
  });
  it("offers only the outstanding count on the actual current-week task", () => {
    expect(chooseTodayAction(defaults)).toMatchObject({ kind: "plan", taskId: "task", remaining: 6 });
  });
  it("does not invent more work when the week's task is done", () => {
    const done = { ...plan, weeks: plan.weeks.map((w) => ({ ...w, tasks: w.tasks.map((t) => ({ ...t, completedQuestions: 10 })) })) };
    expect(chooseTodayAction({ ...defaults, plan: done }).kind).toBe("done");
  });
  it("does not label a future week as today's task", () => {
    expect(chooseTodayAction({ ...defaults, now: new Date("2026-10-01") }).kind).toBe("mock");
  });
  it("uses practice or setup when no complete mock is available", () => {
    expect(chooseTodayAction({ ...defaults, plan: null, mockHref: null }).kind).toBe("practice");
    expect(chooseTodayAction({ ...defaults, plan: null, mockHref: null, hasPractice: false }).kind).toBe("setup");
  });
});
