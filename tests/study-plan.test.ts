/**
 * The study plan model.
 *
 * The tests that matter here are the ones about *shape*: that returns diminish,
 * that the ceiling is never promised, and that a plan never schedules questions
 * the bank does not have. The exact constants are a calibration and will move
 * when Sirius has outcome data of its own — so almost nothing below asserts a
 * specific number of points.
 */

import { describe, expect, it } from "vitest";

import {
  MAX_PLAN_WEEKS,
  MINUTES_PER_QUESTION,
  SKILLS_PER_WEEK,
  buildStudyPlan,
  completedByTask,
  minutesToReach,
  planWeeks,
  planWindow,
  projectScore,
  scoreGain,
  splitProportionally,
  taskWindow,
  type AnsweredQuestion,
  type PlanSkill,
  type TaskWindow,
} from "@/lib/study-plan";

const day = 86_400_000;
const today = new Date("2026-09-01T00:00:00.000Z");

function inDays(days: number): Date {
  return new Date(today.getTime() + days * day);
}

const skills: PlanSkill[] = [
  { code: "MATH_ALGEBRA_LINEAR_EQ_ONE_VAR", examShare: 0.035, availableQuestions: 400 },
  { code: "MATH_ALGEBRA_LINEAR_FUNCTIONS", examShare: 0.044, availableQuestions: 400 },
  { code: "RW_CRAFT_WORDS_IN_CONTEXT", examShare: 0.07, availableQuestions: 400 },
  { code: "RW_EXPRESSION_TRANSITIONS", examShare: 0.055, availableQuestions: 400 },
  { code: "RW_CONVENTIONS_BOUNDARIES", examShare: 0.065, availableQuestions: 400 },
];

function plan(overrides: Partial<Parameters<typeof buildStudyPlan>[0]> = {}) {
  return buildStudyPlan({
    currentScore: 1000,
    targetScore: 1300,
    examDate: inDays(84), // 12 weeks
    today,
    weeklyStudyMinutes: 300,
    skills,
    ...overrides,
  });
}

describe("scoreGain", () => {
  it("returns less for the second hour than the first", () => {
    const first = scoreGain(1000, 600);
    const second = scoreGain(1000, 1200) - first;

    expect(second).toBeLessThan(first);
  });

  it("is worth less the closer the student already is", () => {
    expect(scoreGain(1450, 3_000)).toBeLessThan(scoreGain(1050, 3_000));
  });

  it("never reaches the ceiling, however much time is spent", () => {
    expect(projectScore(1000, 1_000_000)).toBeLessThanOrEqual(1600);
    // 100 000 minutes is 1 666 hours — more than any student will spend.
    expect(scoreGain(1000, 100_000)).toBeLessThan(600);
  });

  it("is zero without time, and for a student already at the ceiling", () => {
    expect(scoreGain(1000, 0)).toBe(0);
    expect(scoreGain(1600, 5_000)).toBe(0);
  });

  it("moves a beginner further than a straight line through the same first hour", () => {
    // The curve is concave: doubling the time does not double the gain.
    const single = scoreGain(1000, 3_000);
    expect(scoreGain(1000, 6_000)).toBeLessThan(single * 2);
  });
});

describe("minutesToReach", () => {
  it("is zero when the target is already met", () => {
    expect(minutesToReach(1300, 1300)).toBe(0);
    expect(minutesToReach(1400, 1200)).toBe(0);
  });

  it("agrees with the projection it inverts", () => {
    const minutes = minutesToReach(1000, 1300);
    expect(minutes).not.toBeNull();
    expect(projectScore(1000, minutes!)).toBeGreaterThanOrEqual(1300);
  });

  it("asks for more time the higher the target", () => {
    const modest = minutesToReach(1000, 1200)!;
    const ambitious = minutesToReach(1000, 1400)!;

    expect(ambitious).toBeGreaterThan(modest);
  });

  it("refuses to price a perfect score rather than quoting a huge number", () => {
    expect(minutesToReach(1000, 1600)).toBeNull();
  });
});

describe("planWeeks", () => {
  it("counts whole weeks to the exam", () => {
    expect(planWeeks(today, inDays(7))).toBe(1);
    expect(planWeeks(today, inDays(84))).toBe(12);
    expect(planWeeks(today, inDays(10))).toBe(2);
  });

  it("never plans past the horizon", () => {
    expect(planWeeks(today, inDays(365 * 2))).toBe(MAX_PLAN_WEEKS);
  });

  it("survives an exam date in the past", () => {
    expect(planWeeks(today, inDays(-30))).toBe(1);
  });
});

describe("splitProportionally", () => {
  it("always sums to the total", () => {
    expect(splitProportionally(10, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(10);
    expect(splitProportionally(7, [5, 3, 2]).reduce((a, b) => a + b, 0)).toBe(7);
    expect(splitProportionally(100, [0.5, 0.25, 0.25])).toEqual([50, 25, 25]);
  });

  it("gives the remainder to the largest fraction first", () => {
    expect(splitProportionally(10, [1, 1, 1])).toEqual([4, 3, 3]);
  });

  it("handles the degenerate inputs", () => {
    expect(splitProportionally(0, [1, 2])).toEqual([0, 0]);
    expect(splitProportionally(5, [])).toEqual([]);
    expect(splitProportionally(4, [0, 0])).toEqual([2, 2]);
  });
});

describe("buildStudyPlan", () => {
  it("plans one entry per week up to the exam", () => {
    const result = plan();

    expect(result.projection.weeks).toBe(12);
    expect(result.weeks).toHaveLength(12);
    expect(result.weeks[0].week).toBe(1);
  });

  it("never schedules a week past exam day", () => {
    const examDate = inDays(80);
    const result = plan({ examDate });

    const last = result.weeks[result.weeks.length - 1];
    expect(last.dueDate.getTime()).toBeLessThanOrEqual(examDate.getTime());
  });

  it("keeps a week to a handful of skills", () => {
    for (const week of plan().weeks) {
      expect(week.tasks.length).toBeGreaterThan(0);
      expect(week.tasks.length).toBeLessThanOrEqual(SKILLS_PER_WEEK);
    }
  });

  it("turns the stated study time into a weekly question count", () => {
    const result = plan({ weeklyStudyMinutes: 300 });
    expect(result.projection.weeklyQuestions).toBe(
      Math.floor(300 / MINUTES_PER_QUESTION),
    );
  });

  it("spends the most time on the skills worth the most marks", () => {
    const result = plan();

    const totals = new Map<string, number>();
    for (const week of result.weeks) {
      for (const task of week.tasks) {
        totals.set(task.skillCode, (totals.get(task.skillCode) ?? 0) + task.questions);
      }
    }

    // Words in Context carries the largest share of the exam in this fixture.
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    expect(ranked[0][0]).toBe("RW_CRAFT_WORDS_IN_CONTEXT");
  });

  it("is deterministic", () => {
    expect(JSON.stringify(plan())).toBe(JSON.stringify(plan()));
  });

  it("never asks for more questions of a skill than the bank holds", () => {
    const thin: PlanSkill[] = skills.map((skill) => ({
      ...skill,
      availableQuestions: 3,
    }));

    const result = plan({ skills: thin });

    for (const week of result.weeks) {
      for (const task of week.tasks) {
        expect(task.questions).toBeLessThanOrEqual(3);
      }
    }

    expect(result.projection.bankLimited).toBe(true);
  });

  it("covers the whole taxonomy rather than drilling the three heaviest topics", () => {
    /*
     * The first version of this allocator gave every week to the three skills
     * with the largest share, and with a small bank those three never ran out
     * of quota — so a twelve-week plan touched five skills out of twenty and
     * the rest were never scheduled at all.
     */
    const thin: PlanSkill[] = Array.from({ length: 20 }, (_, index) => ({
      code: `SKILL_${String(index).padStart(2, "0")}`,
      examShare: 0.05,
      availableQuestions: 3,
    }));

    const result = plan({ skills: thin });

    const touched = new Set(
      result.weeks.flatMap((week) => week.tasks.map((task) => task.skillCode)),
    );

    expect(touched.size).toBeGreaterThan(SKILLS_PER_WEEK * 2);
  });

  it("schedules each question once when the bank is the limit", () => {
    const thin: PlanSkill[] = skills.map((skill) => ({
      ...skill,
      availableQuestions: 4,
    }));

    const result = plan({ skills: thin });

    const perSkill = new Map<string, number>();
    for (const week of result.weeks) {
      for (const task of week.tasks) {
        perSkill.set(
          task.skillCode,
          (perSkill.get(task.skillCode) ?? 0) + task.questions,
        );
      }
    }

    for (const total of perSkill.values()) {
      expect(total).toBeLessThanOrEqual(4);
    }

    expect(result.projection.totalQuestions).toBeLessThanOrEqual(
      thin.length * 4,
    );
    expect(result.projection.bankLimited).toBe(true);
  });

  it("spreads a small bank across the weeks instead of front-loading it", () => {
    const thin: PlanSkill[] = skills.map((skill) => ({
      ...skill,
      availableQuestions: 8,
    }));

    const result = plan({ skills: thin });
    const scheduled = result.weeks.filter((week) => week.questions > 0);

    // 40 questions over 12 weeks: every week should get some of them.
    expect(scheduled.length).toBeGreaterThanOrEqual(result.weeks.length - 1);
  });

  it("says so when there is nothing to practise at all", () => {
    const result = plan({ skills: [] });

    expect(result.projection.bankLimited).toBe(true);
    expect(result.projection.totalQuestions).toBe(0);
    expect(result.weeks.every((week) => week.tasks.length === 0)).toBe(true);
  });

  it("refuses to project from a baseline it does not have", () => {
    const result = plan({ currentScore: null });

    expect(result.projection.projectedScore).toBeNull();
    expect(result.projection.requiredMinutes).toBeNull();
    expect(result.projection.onTrack).toBe(false);
    // The schedule itself does not depend on the score.
    expect(result.weeks.length).toBe(12);
  });

  it("reports how much more a week an out-of-reach target would need", () => {
    const rushed = plan({ examDate: inDays(21), targetScore: 1500 });

    expect(rushed.projection.onTrack).toBe(false);
    expect(rushed.projection.shortfallMinutesPerWeek).toBeGreaterThan(0);
  });

  it("calls a reachable target on track", () => {
    const generous = plan({
      currentScore: 1200,
      targetScore: 1210,
      weeklyStudyMinutes: 600,
      examDate: inDays(180),
    });

    expect(generous.projection.onTrack).toBe(true);
    expect(generous.projection.shortfallMinutesPerWeek).toBe(0);
  });

  it("counts scheduled minutes from the questions it actually scheduled", () => {
    const result = plan();

    expect(result.projection.scheduledMinutes).toBe(
      Math.round(result.projection.totalQuestions * MINUTES_PER_QUESTION),
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Derived completion                                                          */
/* -------------------------------------------------------------------------- */

/**
 * These are the tests that hold the shape decision in place: progress belongs
 * to the student and the calendar, not to whichever plan row was current. Every
 * case below is about what a rewritten plan must *not* be able to change.
 */
describe("completedByTask", () => {
  const monday = new Date("2026-09-07T00:00:00.000Z");

  /** A task for `skill`, in the week starting `weeksIn` weeks after `monday`. */
  function task(id: string, skillId: string, weeksIn = 0): TaskWindow {
    const startDate = new Date(monday.getTime() + weeksIn * 7 * day);

    return {
      id,
      skillId,
      startDate,
      dueDate: new Date(startDate.getTime() + 6 * day),
    };
  }

  function answered(skillId: string, at: string): AnsweredQuestion {
    return { skillId, answeredAt: new Date(at) };
  }

  it("counts a skill's answers inside the task's week", () => {
    const counts = completedByTask(
      [task("t1", "words")],
      [
        answered("words", "2026-09-07T09:00:00.000Z"),
        answered("words", "2026-09-09T21:30:00.000Z"),
      ],
    );

    expect(counts.get("t1")).toBe(2);
  });

  it("counts to the end of the calendar week, not to the plan's due date", () => {
    const counts = completedByTask(
      [task("t1", "words")],
      [
        // `dueDate` is midnight at the start of the 13th; both of these are
        // that day, and a window closing at `dueDate` would drop both.
        answered("words", "2026-09-13T00:00:00.000Z"),
        answered("words", "2026-09-13T23:59:59.000Z"),
        // The next week's first minute is not this week's.
        answered("words", "2026-09-14T00:00:00.000Z"),
      ],
    );

    expect(counts.get("t1")).toBe(2);
  });

  it("does not count another skill's work", () => {
    const counts = completedByTask(
      [task("t1", "words")],
      [answered("algebra", "2026-09-08T09:00:00.000Z")],
    );

    expect(counts.get("t1")).toBe(0);
  });

  it("keeps a past week's number true when the student catches up later", () => {
    const counts = completedByTask(
      [task("week1", "words", 0), task("week3", "words", 2)],
      [
        answered("words", "2026-09-08T09:00:00.000Z"),
        // Two weeks of catching up, all of it done in week 3.
        answered("words", "2026-09-22T09:00:00.000Z"),
        answered("words", "2026-09-23T09:00:00.000Z"),
        answered("words", "2026-09-24T09:00:00.000Z"),
      ],
    );

    // Week 1 stays at what actually happened in week 1.
    expect(counts.get("week1")).toBe(1);
    expect(counts.get("week3")).toBe(3);
  });

  it("never counts one answer twice", () => {
    const answers = [answered("words", "2026-09-08T09:00:00.000Z")];
    const counts = completedByTask(
      [task("week1", "words", 0), task("week2", "words", 1)],
      answers,
    );

    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    expect(total).toBe(answers.length);
  });

  it("does not reach back for work done before the plan existed", () => {
    const counts = completedByTask(
      [task("t1", "words")],
      [answered("words", "2026-08-30T09:00:00.000Z")],
    );

    expect(counts.get("t1")).toBe(0);
  });

  it("reports more than the target rather than clamping", () => {
    const counts = completedByTask(
      [task("t1", "words")],
      Array.from({ length: 50 }, () =>
        answered("words", "2026-09-08T09:00:00.000Z"),
      ),
    );

    expect(counts.get("t1")).toBe(50);
  });

  it("gives every task a number, including the untouched ones", () => {
    const counts = completedByTask(
      [task("t1", "words"), task("t2", "algebra")],
      [answered("words", "2026-09-08T09:00:00.000Z")],
    );

    expect(counts.get("t2")).toBe(0);
    expect([...counts.keys()].sort()).toEqual(["t1", "t2"]);
  });

  /**
   * THE INVARIANT. A plan rebuilt partway through a week must not move a single
   * number, and this is the case that caught the first version of the rule: a
   * plan written on the Friday counted the Saturday's practice, and rebuilding
   * it on the Monday did not.
   */
  it("does not move a number when the plan is rebuilt mid-week", () => {
    // Practised on the Tuesday...
    const tuesday = answered("words", "2026-09-08T20:06:00.000Z");

    // ...then the plan is rebuilt later in that same week. Every one of these
    // has to give the same answer, including the two written *after* the work
    // was done — which is exactly what a date-anchored window got wrong.
    const rebuiltOn = ["2026-09-07", "2026-09-09", "2026-09-11", "2026-09-13"];

    for (const day of rebuiltOn) {
      const counts = completedByTask(
        [{ ...task("t", "words"), startDate: new Date(`${day}T00:00:00.000Z`) }],
        [tuesday],
      );

      expect(counts.get("t"), `rebuilt on ${day}`).toBe(1);
    }
  });

  it("puts every day of one calendar week in the same window", () => {
    // Monday through Sunday: one window, whichever day the plan was written on.
    const days = [7, 8, 9, 10, 11, 12, 13].map(
      (date) => new Date(`2026-09-${String(date).padStart(2, "0")}T00:00:00.000Z`),
    );

    const windows = days.map((startDate) => taskWindow({ startDate }));

    for (const window of windows) {
      expect(window.from.toISOString()).toBe(windows[0].from.toISOString());
      expect(window.until.toISOString()).toBe(windows[0].until.toISOString());
    }

    // And the week after is the next window, not the same one.
    expect(taskWindow({ startDate: new Date("2026-09-14T00:00:00.000Z") }).from.toISOString())
      .toBe(windows[0].until.toISOString());
  });

  it("survives a plan being rewritten over the same weeks", () => {
    const answers = [
      answered("words", "2026-09-08T09:00:00.000Z"),
      answered("words", "2026-09-09T09:00:00.000Z"),
    ];

    const before = completedByTask([task("old", "words")], answers);
    const after = completedByTask([task("new", "words")], answers);

    expect(after.get("new")).toBe(before.get("old"));
  });
});

describe("planWindow", () => {
  it("spans from the first task's start to the end of the last one's due day", () => {
    const first = new Date("2026-09-07T00:00:00.000Z");
    const tasks: TaskWindow[] = [
      {
        id: "a",
        skillId: "words",
        startDate: first,
        dueDate: new Date(first.getTime() + 6 * day),
      },
      {
        id: "b",
        skillId: "algebra",
        startDate: new Date(first.getTime() + 7 * day),
        dueDate: new Date(first.getTime() + 13 * day),
      },
    ];

    const span = planWindow(tasks);

    expect(span?.from.toISOString()).toBe(first.toISOString());
    expect(span?.until.toISOString()).toBe(taskWindow(tasks[1]).until.toISOString());
  });

  it("has nothing to say about a plan with no tasks", () => {
    expect(planWindow([])).toBeNull();
  });
});

/**
 * The window is read straight off what `buildStudyPlan` writes, so the two have
 * to agree about what a week is. This is the test that fails if either moves.
 */
describe("the planner and the window agree", () => {
  it("covers every day of a plan with no gaps and no overlaps", () => {
    const result = buildStudyPlan({
      currentScore: 1100,
      targetScore: 1400,
      examDate: inDays(84),
      today,
      weeklyStudyMinutes: 300,
      skills,
    });

    const windows = result.weeks.map((week) => taskWindow(week));

    for (let index = 1; index < windows.length; index += 1) {
      expect(windows[index].from.getTime()).toBe(
        windows[index - 1].until.getTime(),
      );
    }
  });
});
