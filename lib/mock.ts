/**
 * The shape of a full Digital SAT sitting: four modules, one break, and a
 * clock that belongs to the server.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THE TIMER LIVES HERE AND NOT IN THE COUNTDOWN COMPONENT
 *
 * The countdown a student watches is a rendering of a deadline, not the
 * deadline itself. The deadline is `moduleStartedAt + minutes`, held on the
 * server, and every write is checked against it — because the alternative is a
 * timer that can be paused by pausing JavaScript.
 *
 * `isModuleExpired` is therefore the single definition of "too late", and the
 * actions call it before they accept anything.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * WHAT IS DELIBERATELY NOT HERE
 *
 * Adaptive module selection. The real exam picks an easier or harder second
 * module from how the first one went, and Sirius will too — but guessing at the
 * routing rule before there is a calibrated question bank would bake a fiction
 * into the scores. `selectModule2` is the seam: it exists, it is called, and it
 * returns `STANDARD` until there is something real to put behind it.
 */

import type { TestModule } from "@/lib/generated/prisma/enums";
import {
  MODULE_MINUTES,
  MODULE_QUESTION_COUNT,
  estimateScaledScore,
} from "@/lib/sat";

/** The two halves of the exam. Matches `TestType`'s first two values. */
export type MockSection = "READING" | "MATH";

export interface MockModuleSpec {
  /** 0-based position in the sitting. */
  index: number;
  section: MockSection;
  /** Which of the section's two modules this is. */
  module: TestModule;
  minutes: number;
  /** Minutes of break *after* this module. Zero when the next follows on. */
  breakMinutes: number;
}

/**
 * The break between the two sections. Ten minutes on the real test, and the
 * only pause in it — there is none between a section's two modules.
 */
export const BREAK_MINUTES = 10;

/** The sitting, in order. */
export const MOCK_MODULES: readonly MockModuleSpec[] = [
  {
    index: 0,
    section: "READING",
    module: "MODULE_1",
    minutes: MODULE_MINUTES.READING,
    breakMinutes: 0,
  },
  {
    index: 1,
    section: "READING",
    module: "MODULE_2",
    minutes: MODULE_MINUTES.READING,
    breakMinutes: BREAK_MINUTES,
  },
  {
    index: 2,
    section: "MATH",
    module: "MODULE_1",
    minutes: MODULE_MINUTES.MATH,
    breakMinutes: 0,
  },
  {
    index: 3,
    section: "MATH",
    module: "MODULE_2",
    minutes: MODULE_MINUTES.MATH,
    breakMinutes: 0,
  },
];

/** Total time a sitting takes, breaks included. */
export const MOCK_TOTAL_MINUTES = MOCK_MODULES.reduce(
  (running, module) => running + module.minutes + module.breakMinutes,
  0,
);

/** The module at a position, or null once the sitting is over. */
export function moduleAt(index: number): MockModuleSpec | null {
  return MOCK_MODULES[index] ?? null;
}

/** Is there another module after this one? */
export function hasNextModule(index: number): boolean {
  return index + 1 < MOCK_MODULES.length;
}

/* -------------------------------------------------------------------------- */
/* The clock                                                                   */
/* -------------------------------------------------------------------------- */

const MS_PER_MINUTE = 60_000;

/**
 * Grace period on the deadline, in seconds.
 *
 * A student who clicks "submit" as the clock hits zero should not lose the
 * module to network latency. It is small enough to be worth nothing to somebody
 * trying to game it and large enough to cover a slow round trip.
 */
export const DEADLINE_GRACE_SECONDS = 5;

export function moduleDeadline(startedAt: Date, module: MockModuleSpec): Date {
  return new Date(startedAt.getTime() + module.minutes * MS_PER_MINUTE);
}

/**
 * Has this module's time run out?
 *
 * The one definition of "too late" in the product. Answers arriving after this
 * are refused rather than saved, which is what stops a paused tab from being
 * extra time.
 */
export function isModuleExpired(
  now: Date,
  startedAt: Date,
  module: MockModuleSpec,
): boolean {
  return isPastDeadline(now, moduleDeadline(startedAt, module));
}

/**
 * Is a deadline past, allowing for the grace period?
 *
 * The single-module practice tests have a deadline too — `startedAt +
 * durationMinutes` — and they are enforced by this same comparison, so there is
 * one definition of late in the product rather than two.
 */
export function isPastDeadline(now: Date, deadline: Date): boolean {
  return now.getTime() > deadline.getTime() + DEADLINE_GRACE_SECONDS * 1_000;
}

/** Seconds left in the module, never negative. For display only. */
export function remainingSeconds(
  now: Date,
  startedAt: Date,
  module: MockModuleSpec,
): number {
  const left = moduleDeadline(startedAt, module).getTime() - now.getTime();
  return Math.max(0, Math.floor(left / 1_000));
}

/* -------------------------------------------------------------------------- */
/* The module plan                                                             */
/* -------------------------------------------------------------------------- */

/**
 * One module of a sitting: which spec it is, and what it asks.
 *
 * A type alias rather than an interface on purpose: the plan is written to a
 * Json column, and Prisma only accepts object types that carry an implicit
 * index signature — which interfaces do not have.
 */
export type MockModulePlanEntry = {
  /** Index into `MOCK_MODULES`. */
  module: number;
  questionIds: string[];
};

/**
 * The sitting as actually assembled, stored on the attempt.
 *
 * It is a *plan*, decided once when the attempt starts, because the server has
 * to be able to answer "is this question in the module that is currently open?"
 * on every autosave without joining three tables to find out.
 */
export type MockModulePlan = MockModulePlanEntry[];

/**
 * Assemble a sitting from a test's questions.
 *
 * A module with no questions is left out rather than shown empty: the question
 * bank is not yet large enough for a real four-module sitting, and a plan that
 * promises a Math module it cannot fill is worse than one that admits it has
 * only Reading.
 *
 * Returns an empty plan when nothing could be placed — a test whose questions
 * carry no taxonomy, which is every test imported before skills existed. The
 * caller treats that as "not a modular sitting" and runs the single-clock
 * practice flow instead, which is what those tests have always been.
 */
export function buildModulePlan(
  questions: ReadonlyArray<{
    id: string;
    section: MockSection | null;
    module: TestModule;
  }>,
): MockModulePlan {
  const plan: MockModulePlan = [];

  for (const spec of MOCK_MODULES) {
    const questionIds = questions
      .filter(
        (question) =>
          question.section === spec.section && question.module === spec.module,
      )
      .map((question) => question.id);

    if (questionIds.length > 0) {
      plan.push({ module: spec.index, questionIds });
    }
  }

  return plan;
}

/**
 * Read the `modulePlan` JSON column defensively — the same posture
 * `parseQuestionOptions` takes. A malformed value yields no plan, which falls
 * back to the single-clock flow rather than throwing mid-sitting.
 */
export function parseModulePlan(value: unknown): MockModulePlan {
  if (!Array.isArray(value)) return [];

  const plan: MockModulePlan = [];

  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;

    const record = entry as Record<string, unknown>;
    // Not `module`: Next forbids that name for a local, since it shadows the
    // CommonJS global the bundler rewrites.
    const moduleIndex = record.module;
    const ids = record.questionIds;

    if (typeof moduleIndex !== "number" || !Array.isArray(ids)) continue;
    if (!moduleAt(moduleIndex)) continue;

    plan.push({
      module: moduleIndex,
      questionIds: ids.filter((id): id is string => typeof id === "string"),
    });
  }

  return plan;
}

/** The spec for a position in the plan, or null when the sitting is over. */
export function specForPlanIndex(
  plan: MockModulePlan,
  index: number,
): MockModuleSpec | null {
  const entry = plan[index];
  return entry ? moduleAt(entry.module) : null;
}

/** The questions a position in the plan asks. */
export function questionIdsAt(plan: MockModulePlan, index: number): string[] {
  return plan[index]?.questionIds ?? [];
}

/* -------------------------------------------------------------------------- */
/* Where an attempt is, and what it will accept                                */
/* -------------------------------------------------------------------------- */

/** The stored fields the clock is read from. */
export interface AttemptState {
  modulePlan: unknown;
  moduleIndex: number;
  moduleStartedAt: Date | null;
  startedAt: Date;
}

/** Where an attempt is: which module is open, and when its time runs out. */
export interface AttemptClock {
  /** True for a full sitting, false for a single-module practice test. */
  modular: boolean;
  /** Position within the plan. Always 0 when not modular. */
  moduleIndex: number;
  /** Index into `MOCK_MODULES`, or null when nothing is open. */
  moduleSpec: number | null;
  moduleStartedAtMs: number;
  deadlineMs: number;
  expired: boolean;
  /** Questions the open module asks. Empty when not modular. */
  questionIds: string[];
  /** Is there another module after this one? */
  hasNext: boolean;
}

/**
 * Work out an attempt's clock.
 *
 * One function, used by every write in `lib/actions/attempts.ts`, so "is it too
 * late" cannot be answered two different ways in two different actions. Pure,
 * so the answer can be tested at the minute rather than inferred from a UI.
 */
export function readAttemptClock(
  attempt: AttemptState,
  durationMinutes: number,
  now: Date,
): AttemptClock {
  const plan = parseModulePlan(attempt.modulePlan);

  if (plan.length === 0) {
    const deadline = new Date(
      attempt.startedAt.getTime() + durationMinutes * MS_PER_MINUTE,
    );

    return {
      modular: false,
      moduleIndex: 0,
      moduleSpec: null,
      moduleStartedAtMs: attempt.startedAt.getTime(),
      deadlineMs: deadline.getTime(),
      expired: isPastDeadline(now, deadline),
      questionIds: [],
      hasNext: false,
    };
  }

  const spec = specForPlanIndex(plan, attempt.moduleIndex);

  // Past the end of the plan: nothing is open, so nothing can be accepted.
  if (!spec) {
    return {
      modular: true,
      moduleIndex: attempt.moduleIndex,
      moduleSpec: null,
      moduleStartedAtMs: attempt.startedAt.getTime(),
      deadlineMs: attempt.startedAt.getTime(),
      expired: true,
      questionIds: [],
      hasNext: false,
    };
  }

  const startedAt = attempt.moduleStartedAt ?? attempt.startedAt;
  const deadline = moduleDeadline(startedAt, spec);

  return {
    modular: true,
    moduleIndex: attempt.moduleIndex,
    moduleSpec: spec.index,
    moduleStartedAtMs: startedAt.getTime(),
    deadlineMs: deadline.getTime(),
    expired: isPastDeadline(now, deadline),
    questionIds: questionIdsAt(plan, attempt.moduleIndex),
    hasNext: attempt.moduleIndex + 1 < plan.length,
  };
}

/**
 * Fold the browser's answers into the stored ones.
 *
 * On a modular sitting only the open module may be written, and within that
 * module the payload is authoritative — including for clearing an answer, which
 * a student does by crossing out the option they had selected. Answers to other
 * modules are left exactly as they were, because their time has passed.
 */
export function mergeModuleAnswers(
  stored: Readonly<Record<string, string>>,
  incoming: Readonly<Record<string, string>>,
  clock: AttemptClock,
): Record<string, string> {
  if (!clock.modular) return { ...incoming };

  const open = new Set(clock.questionIds);
  const merged: Record<string, string> = {};

  for (const [questionId, answer] of Object.entries(stored)) {
    if (!open.has(questionId)) merged[questionId] = answer;
  }

  for (const [questionId, answer] of Object.entries(incoming)) {
    if (open.has(questionId)) merged[questionId] = answer;
  }

  return merged;
}

/* -------------------------------------------------------------------------- */
/* Adaptive routing — the seam                                                 */
/* -------------------------------------------------------------------------- */

/** Which second module a student is routed to. */
export type ModuleRouting = "STANDARD" | "EASIER" | "HARDER";

export interface ModuleOutcome {
  correct: number;
  total: number;
}

/**
 * Choose the second module of a section from how the first one went.
 *
 * v1 always answers `STANDARD`, and that is a decision rather than a stub: the
 * bank has no calibrated difficulty on its questions yet (`Question.difficulty`
 * is null on every imported row), so any routing rule would be sorting
 * questions by a property nobody has measured.
 *
 * Everything the real rule needs is already in the signature. When difficulty
 * exists, this function changes and nothing else has to.
 */
export function selectModule2(outcome: ModuleOutcome): ModuleRouting {
  /*
   * The outcome is accepted and deliberately unused: the call site is already
   * passing everything the real rule needs, so turning this on later is a
   * change to this function and to nothing else.
   */
  void outcome;
  return "STANDARD";
}

/* -------------------------------------------------------------------------- */
/* What the bank can actually fill                                             */
/* -------------------------------------------------------------------------- */

/**
 * How many questions one module of the blueprint wants.
 *
 * Reads from `MODULE_QUESTION_COUNT`, so the blueprint is stated once: 27 per
 * Reading & Writing module, 22 per Math module, four modules, 98 in total.
 */
export function questionsNeeded(spec: MockModuleSpec): number {
  return MODULE_QUESTION_COUNT[spec.section === "READING" ? "READING" : "MATH"];
}

/** Total questions in a complete sitting: 27 + 27 + 22 + 22. */
export const MOCK_TOTAL_QUESTIONS = MOCK_MODULES.reduce(
  (sum, spec) => sum + questionsNeeded(spec),
  0,
);

/**
 * Testing minutes in a complete sitting, break excluded: 32 + 32 + 35 + 35 =
 * 134. Distinct from `MOCK_TOTAL_MINUTES` above, which adds the 10-minute break
 * and is what a student should budget — 144. The brief quotes both, and telling
 * someone a mock takes 134 minutes when they will be sitting for 144 is the
 * kind of small dishonesty this section is meant to avoid.
 */
export const MOCK_TESTING_MINUTES = MOCK_MODULES.reduce(
  (sum, spec) => sum + spec.minutes,
  0,
);

/** How many questions the bank holds for one section-and-module slot. */
export type BankCounts = ReadonlyArray<{
  section: MockSection;
  module: TestModule;
  count: number;
}>;

export interface ModuleAvailability {
  index: number;
  section: MockSection;
  module: TestModule;
  needed: number;
  available: number;
  /** Zero when the slot is full. */
  short: number;
}

export interface MockAvailability {
  modules: ModuleAvailability[];
  neededTotal: number;
  availableTotal: number;
  shortTotal: number;
  /** True only when every module can be filled to blueprint. */
  complete: boolean;
}

/**
 * Compare the bank against the blueprint, module by module.
 *
 * This exists so the practice page can say what is missing instead of quietly
 * serving whatever it has. A student who is told "this is a full mock" and sits
 * 40 questions learns two false things: what a mock is, and what their score
 * means. Being short is not the failure — pretending otherwise is.
 *
 * Pure, so it is the same answer in a test, in a Server Component and in a
 * script that checks whether an import was enough.
 */
export function mockAvailability(counts: BankCounts): MockAvailability {
  const modules = MOCK_MODULES.map((spec) => {
    const needed = questionsNeeded(spec);
    const available =
      counts.find(
        (row) => row.section === spec.section && row.module === spec.module,
      )?.count ?? 0;

    return {
      index: spec.index,
      section: spec.section,
      module: spec.module,
      needed,
      available,
      short: Math.max(0, needed - available),
    };
  });

  const neededTotal = modules.reduce((sum, m) => sum + m.needed, 0);
  const availableTotal = modules.reduce(
    (sum, m) => sum + Math.min(m.available, m.needed),
    0,
  );

  return {
    modules,
    neededTotal,
    availableTotal,
    shortTotal: modules.reduce((sum, m) => sum + m.short, 0),
    complete: modules.every((m) => m.short === 0),
  };
}

/**
 * Assemble a sitting from the whole question bank.
 *
 * `buildModulePlan` above takes the questions of one *test*, which is how the
 * mock worked when a test was a fixed list someone had curated. This one takes
 * every question the bank holds and fills each module of the blueprint to its
 * own count — so importing more questions makes the mock longer without anyone
 * editing a list.
 *
 * A module is filled to `needed` and no further: a bank with 200 Math questions
 * still yields a 22-question Math module, because the blueprint is the exam's
 * shape and not a function of what we happen to have.
 *
 * Short modules are included at whatever they hold rather than dropped. The
 * caller is expected to have asked `mockAvailability` first and told the
 * student what they are about to sit; dropping a module here would hide that
 * from a caller who did ask.
 *
 * `pick` decides which questions from a slot are used — a seeded shuffle in
 * production, identity in tests. Kept as a parameter so assembly is
 * deterministic under test without a global.
 */
export function assembleMockFromBank(
  pool: ReadonlyArray<{
    id: string;
    section: MockSection | null;
    module: TestModule;
  }>,
  pick: (ids: string[], take: number) => string[] = (ids, take) =>
    ids.slice(0, take),
): MockModulePlan {
  const plan: MockModulePlan = [];

  for (const spec of MOCK_MODULES) {
    const candidates = pool
      .filter(
        (question) =>
          question.section === spec.section && question.module === spec.module,
      )
      .map((question) => question.id);

    if (candidates.length === 0) continue;

    plan.push({
      module: spec.index,
      questionIds: pick(candidates, questionsNeeded(spec)),
    });
  }

  return plan;
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                     */
/* -------------------------------------------------------------------------- */

export interface MockSectionScore {
  section: MockSection;
  correct: number;
  total: number;
  /** 200–800. */
  scaled: number;
}

export interface MockScore {
  sections: MockSectionScore[];
  /** 200–800, or null when the sitting had no questions from that section. */
  readingWriting: number | null;
  math: number | null;
  /** 400–1600. The sum of the two sections, or a single section doubled. */
  total: number;
  correct: number;
  totalQuestions: number;
}

/**
 * Turn per-question results into section scores and a total.
 *
 * Scaling reuses `estimateScaledScore` rather than growing a second conversion:
 * one section's raw score maps onto 200–800 exactly as a single-section
 * practice test already does, and the caveat printed next to that number
 * applies here unchanged — it is an estimate, not an equated score.
 *
 * A sitting missing one section (which is what the current bank can fill)
 * scores the section it has and doubles it for the total, rather than
 * reporting a 1600-scale number that silently counts the missing half as zero.
 */
export function scoreMock(
  results: ReadonlyArray<{ section: MockSection; correct: boolean }>,
): MockScore {
  const sections: MockSectionScore[] = [];

  for (const section of ["READING", "MATH"] as const) {
    const rows = results.filter((result) => result.section === section);
    if (rows.length === 0) continue;

    const correct = rows.filter((row) => row.correct).length;
    sections.push({
      section,
      correct,
      total: rows.length,
      scaled: estimateScaledScore(correct, rows.length, section),
    });
  }

  const reading =
    sections.find((section) => section.section === "READING")?.scaled ?? null;
  const math =
    sections.find((section) => section.section === "MATH")?.scaled ?? null;

  const present = sections.map((section) => section.scaled);
  const total =
    present.length === 2
      ? present[0] + present[1]
      : present.length === 1
        ? present[0] * 2
        : 400;

  return {
    sections,
    readingWriting: reading,
    math,
    total,
    correct: results.filter((result) => result.correct).length,
    totalQuestions: results.length,
  };
}
