/**
 * The full-sitting rules.
 *
 * The deadline tests are the ones that matter: they are the specification for
 * "too late", and every write in `lib/actions/attempts.ts` is checked against
 * exactly this function. If it drifts, a paused tab becomes extra time again.
 */

import { describe, expect, it } from "vitest";

import {
  BREAK_MINUTES,
  DEADLINE_GRACE_SECONDS,
  MOCK_MODULES,
  MOCK_TESTING_MINUTES,
  MOCK_TOTAL_MINUTES,
  MOCK_TOTAL_QUESTIONS,
  assembleMockFromBank,
  buildModulePlan,
  mockAvailability,
  questionsNeeded,
  hasNextModule,
  isModuleExpired,
  isPastDeadline,
  moduleAt,
  moduleDeadline,
  parseModulePlan,
  questionIdsAt,
  remainingSeconds,
  scoreMock,
  selectModule2,
  specForPlanIndex,
  mergeModuleAnswers,
  readAttemptClock,
} from "@/lib/mock";

const start = new Date("2026-09-01T09:00:00.000Z");

function at(minutes: number, seconds = 0): Date {
  return new Date(start.getTime() + minutes * 60_000 + seconds * 1_000);
}

describe("the sitting", () => {
  it("is four modules: two Reading & Writing, two Math", () => {
    expect(MOCK_MODULES).toHaveLength(4);
    expect(MOCK_MODULES.map((module) => module.section)).toEqual([
      "READING",
      "READING",
      "MATH",
      "MATH",
    ]);
  });

  it("breaks once, between the sections", () => {
    const breaks = MOCK_MODULES.filter((module) => module.breakMinutes > 0);
    expect(breaks).toHaveLength(1);
    expect(breaks[0].index).toBe(1);
    expect(breaks[0].breakMinutes).toBe(BREAK_MINUTES);
  });

  it("runs to the official length", () => {
    // 32 + 32 + 10 + 35 + 35
    expect(MOCK_TOTAL_MINUTES).toBe(144);
  });

  it("knows where it ends", () => {
    expect(moduleAt(0)?.section).toBe("READING");
    expect(moduleAt(3)?.module).toBe("MODULE_2");
    expect(moduleAt(4)).toBeNull();
    expect(hasNextModule(2)).toBe(true);
    expect(hasNextModule(3)).toBe(false);
  });
});

describe("the clock", () => {
  const first = MOCK_MODULES[0];

  it("ends the module its own length after it started", () => {
    expect(moduleDeadline(start, first).toISOString()).toBe(
      at(first.minutes).toISOString(),
    );
  });

  it("is not expired a second before the deadline", () => {
    expect(isModuleExpired(at(first.minutes, -1), start, first)).toBe(false);
  });

  it("forgives a submission arriving within the grace period", () => {
    expect(
      isModuleExpired(at(first.minutes, DEADLINE_GRACE_SECONDS - 1), start, first),
    ).toBe(false);
  });

  it("is expired once the grace period has passed", () => {
    expect(
      isModuleExpired(at(first.minutes, DEADLINE_GRACE_SECONDS + 1), start, first),
    ).toBe(true);
  });

  it("uses one definition of late for practice tests too", () => {
    const deadline = at(20);
    expect(isPastDeadline(at(19), deadline)).toBe(false);
    expect(isPastDeadline(at(20, DEADLINE_GRACE_SECONDS + 1), deadline)).toBe(true);
  });

  it("never reports negative time left", () => {
    expect(remainingSeconds(start, start, first)).toBe(first.minutes * 60);
    expect(remainingSeconds(at(999), start, first)).toBe(0);
  });
});

describe("buildModulePlan", () => {
  const questions = [
    { id: "rw1a", section: "READING" as const, module: "MODULE_1" as const },
    { id: "rw1b", section: "READING" as const, module: "MODULE_1" as const },
    { id: "rw2a", section: "READING" as const, module: "MODULE_2" as const },
    { id: "m1a", section: "MATH" as const, module: "MODULE_1" as const },
  ];

  it("files each question under its own module, in order", () => {
    const plan = buildModulePlan(questions);

    expect(plan).toEqual([
      { module: 0, questionIds: ["rw1a", "rw1b"] },
      { module: 1, questionIds: ["rw2a"] },
      { module: 2, questionIds: ["m1a"] },
    ]);
  });

  it("leaves out a module the bank cannot fill", () => {
    const plan = buildModulePlan(questions);
    expect(plan.map((entry) => entry.module)).not.toContain(3);
  });

  it("drops questions with no section rather than guessing one", () => {
    const plan = buildModulePlan([
      { id: "orphan", section: null, module: "MODULE_1" },
    ]);

    expect(plan).toEqual([]);
  });

  it("returns nothing for a test with no taxonomy at all", () => {
    expect(buildModulePlan([])).toEqual([]);
  });
});

describe("parseModulePlan", () => {
  it("reads back what it wrote", () => {
    const plan = buildModulePlan([
      { id: "a", section: "MATH", module: "MODULE_1" },
    ]);

    expect(parseModulePlan(JSON.parse(JSON.stringify(plan)))).toEqual(plan);
  });

  it("survives a malformed column instead of throwing", () => {
    expect(parseModulePlan(null)).toEqual([]);
    expect(parseModulePlan("nonsense")).toEqual([]);
    expect(parseModulePlan([{ module: "one", questionIds: [] }])).toEqual([]);
    expect(parseModulePlan([{ module: 99, questionIds: ["x"] }])).toEqual([]);
    expect(parseModulePlan([{ module: 0, questionIds: ["x", 7] }])).toEqual([
      { module: 0, questionIds: ["x"] },
    ]);
  });

  it("resolves a position back to its spec and questions", () => {
    const plan = [{ module: 2, questionIds: ["m1"] }];

    expect(specForPlanIndex(plan, 0)?.section).toBe("MATH");
    expect(specForPlanIndex(plan, 1)).toBeNull();
    expect(questionIdsAt(plan, 0)).toEqual(["m1"]);
    expect(questionIdsAt(plan, 5)).toEqual([]);
  });
});

describe("selectModule2", () => {
  it("routes everyone to the standard module until difficulty is measured", () => {
    expect(selectModule2({ correct: 27, total: 27 })).toBe("STANDARD");
    expect(selectModule2({ correct: 0, total: 27 })).toBe("STANDARD");
  });
});

describe("scoreMock", () => {
  it("scores each section on its own scale and adds them", () => {
    const score = scoreMock([
      { section: "READING", correct: true },
      { section: "READING", correct: true },
      { section: "MATH", correct: true },
      { section: "MATH", correct: false },
    ]);

    expect(score.readingWriting).toBe(800);
    expect(score.math).toBe(500);
    expect(score.total).toBe(1300);
    expect(score.correct).toBe(3);
    expect(score.totalQuestions).toBe(4);
  });

  it("doubles a single section rather than counting the missing half as zero", () => {
    const score = scoreMock([
      { section: "READING", correct: true },
      { section: "READING", correct: false },
    ]);

    expect(score.readingWriting).toBe(500);
    expect(score.math).toBeNull();
    expect(score.total).toBe(1000);
  });

  it("floors an empty sitting at 400 without inventing a section", () => {
    const score = scoreMock([]);

    expect(score.sections).toEqual([]);
    expect(score.readingWriting).toBeNull();
    expect(score.math).toBeNull();
    expect(score.total).toBe(400);
  });
});

describe("readAttemptClock", () => {
  const plan = [
    { module: 0, questionIds: ["rw1"] },
    { module: 1, questionIds: ["rw2"] },
    { module: 2, questionIds: ["m1"] },
  ];

  it("gives a single-module test one clock, from the attempt's start", () => {
    const clock = readAttemptClock(
      { modulePlan: null, moduleIndex: 0, moduleStartedAt: null, startedAt: start },
      32,
      at(10),
    );

    expect(clock.modular).toBe(false);
    expect(clock.deadlineMs).toBe(at(32).getTime());
    expect(clock.expired).toBe(false);
    expect(clock.hasNext).toBe(false);
  });

  it("expires a single-module test once its duration has passed", () => {
    const clock = readAttemptClock(
      { modulePlan: null, moduleIndex: 0, moduleStartedAt: null, startedAt: start },
      32,
      at(33),
    );

    expect(clock.expired).toBe(true);
  });

  it("times a module from when that module started, not the sitting", () => {
    const clock = readAttemptClock(
      {
        modulePlan: plan,
        moduleIndex: 2,
        moduleStartedAt: at(80),
        startedAt: start,
      },
      32,
      at(90),
    );

    expect(clock.modular).toBe(true);
    expect(clock.moduleSpec).toBe(2);
    // Math is 35 minutes, from minute 80.
    expect(clock.deadlineMs).toBe(at(115).getTime());
    expect(clock.expired).toBe(false);
    expect(clock.questionIds).toEqual(["m1"]);
    expect(clock.hasNext).toBe(false);
  });

  it("falls back to the sitting's start on a row written before modules existed", () => {
    const clock = readAttemptClock(
      { modulePlan: plan, moduleIndex: 0, moduleStartedAt: null, startedAt: start },
      32,
      at(1),
    );

    expect(clock.moduleStartedAtMs).toBe(start.getTime());
  });

  it("accepts nothing once the plan has run out", () => {
    const clock = readAttemptClock(
      { modulePlan: plan, moduleIndex: 3, moduleStartedAt: at(80), startedAt: start },
      32,
      at(81),
    );

    expect(clock.expired).toBe(true);
    expect(clock.questionIds).toEqual([]);
    expect(clock.moduleSpec).toBeNull();
  });

  it("knows there is a module still to come", () => {
    const clock = readAttemptClock(
      { modulePlan: plan, moduleIndex: 0, moduleStartedAt: start, startedAt: start },
      32,
      at(1),
    );

    expect(clock.hasNext).toBe(true);
  });
});

describe("mergeModuleAnswers", () => {
  const plan = [
    { module: 0, questionIds: ["rw1", "rw2"] },
    { module: 2, questionIds: ["m1"] },
  ];

  const openOnFirst = readAttemptClock(
    { modulePlan: plan, moduleIndex: 0, moduleStartedAt: start, startedAt: start },
    32,
    at(1),
  );

  it("replaces everything on a single-module test", () => {
    const clock = readAttemptClock(
      { modulePlan: null, moduleIndex: 0, moduleStartedAt: null, startedAt: start },
      32,
      at(1),
    );

    expect(mergeModuleAnswers({ a: "A" }, { b: "B" }, clock)).toEqual({ b: "B" });
  });

  it("keeps answers from modules whose time has passed", () => {
    expect(
      mergeModuleAnswers({ m1: "C" }, { rw1: "A" }, openOnFirst),
    ).toEqual({ m1: "C", rw1: "A" });
  });

  it("refuses to write a module that is not open", () => {
    expect(
      mergeModuleAnswers({}, { m1: "D" }, openOnFirst),
    ).toEqual({});
  });

  it("lets the open module clear an answer", () => {
    // The student crossed out the option they had selected.
    expect(
      mergeModuleAnswers({ rw1: "A", rw2: "B" }, { rw2: "B" }, openOnFirst),
    ).toEqual({ rw2: "B" });
  });
});

/* -------------------------------------------------------------------------- */
/* The blueprint, and being honest about what the bank can fill                */
/* -------------------------------------------------------------------------- */

describe("the Digital SAT blueprint", () => {
  it("is 98 questions across four modules", () => {
    expect(MOCK_TOTAL_QUESTIONS).toBe(98);
    expect(MOCK_MODULES.map(questionsNeeded)).toEqual([27, 27, 22, 22]);
  });

  it("is 134 minutes of testing and 144 with the break", () => {
    expect(MOCK_TESTING_MINUTES).toBe(134);
    expect(MOCK_TOTAL_MINUTES).toBe(144);
    expect(MOCK_TOTAL_MINUTES - MOCK_TESTING_MINUTES).toBe(BREAK_MINUTES);
  });
});

describe("mockAvailability", () => {
  const full = [
    { section: "READING" as const, module: "MODULE_1" as const, count: 27 },
    { section: "READING" as const, module: "MODULE_2" as const, count: 27 },
    { section: "MATH" as const, module: "MODULE_1" as const, count: 22 },
    { section: "MATH" as const, module: "MODULE_2" as const, count: 22 },
  ];

  it("reports a complete bank as complete", () => {
    const result = mockAvailability(full);
    expect(result.complete).toBe(true);
    expect(result.shortTotal).toBe(0);
    expect(result.availableTotal).toBe(98);
  });

  it("reports an empty bank as 98 short, not as zero modules", () => {
    const result = mockAvailability([]);
    expect(result.complete).toBe(false);
    expect(result.shortTotal).toBe(98);
    expect(result.modules).toHaveLength(4);
  });

  /*
   * The state the product is actually in: 20 Reading and 20 Math questions,
   * all of them module 1. This is the case the practice page has to describe
   * honestly rather than serve as "a full mock".
   */
  it("describes today's bank exactly", () => {
    const result = mockAvailability([
      { section: "READING", module: "MODULE_1", count: 20 },
      { section: "MATH", module: "MODULE_1", count: 20 },
    ]);

    expect(result.complete).toBe(false);
    expect(result.availableTotal).toBe(40);
    expect(result.shortTotal).toBe(58);
    expect(result.modules.map((m) => m.short)).toEqual([7, 27, 2, 22]);
  });

  it("does not let a surplus in one module hide a shortfall in another", () => {
    const result = mockAvailability([
      { section: "READING", module: "MODULE_1", count: 500 },
    ]);

    expect(result.availableTotal).toBe(27);
    expect(result.complete).toBe(false);
    expect(result.shortTotal).toBe(71);
  });
});

describe("assembleMockFromBank", () => {
  const pool = [
    ...Array.from({ length: 40 }, (_, i) => ({
      id: `rw1-${i}`,
      section: "READING" as const,
      module: "MODULE_1" as const,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `m1-${i}`,
      section: "MATH" as const,
      module: "MODULE_1" as const,
    })),
  ];

  it("fills a module to the blueprint and no further", () => {
    const plan = assembleMockFromBank(pool);
    const reading = plan.find((entry) => entry.module === 0);
    expect(reading?.questionIds).toHaveLength(27);
  });

  it("includes a short module at what it holds rather than dropping it", () => {
    const plan = assembleMockFromBank(pool);
    const math = plan.find((entry) => entry.module === 2);
    expect(math?.questionIds).toHaveLength(5);
  });

  it("omits a module the bank cannot supply at all", () => {
    const plan = assembleMockFromBank(pool);
    expect(plan.find((entry) => entry.module === 1)).toBeUndefined();
    expect(plan.find((entry) => entry.module === 3)).toBeUndefined();
  });

  it("draws across tests, not from one", () => {
    // Every id here would live under a different `testId` in the database;
    // assembly only cares about section and module.
    const plan = assembleMockFromBank(pool);
    expect(plan.flatMap((entry) => entry.questionIds).length).toBe(32);
  });
});
