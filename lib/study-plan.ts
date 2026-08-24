/**
 * The study plan: how many questions of which skill, in which week.
 *
 * Pure arithmetic — no database, no React, no dates beyond the two it is given.
 * That is deliberate. This is the piece most likely to be replaced: the real
 * model is an IRT ability estimate updated per answer, and when that arrives it
 * should slot in behind the same signature rather than being untangled from a
 * page component.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THE SCORE MODEL, AND WHY IT IS NOT A STRAIGHT LINE
 *
 *   gain(m) = (1600 − current) × (1 − e^(−m / TAU))
 *
 * where `m` is minutes of focused practice and `TAU` is 12 000 minutes.
 *
 * A linear model — "every 10 hours is worth 40 points" — is wrong in the two
 * places it matters most. It promises a student at 1450 the same return as one
 * at 1050, and it promises that enough hours reach 1600. Both are false, and
 * both are the promises a student plans their year around.
 *
 * This one is the standard bounded learning curve. Two properties carry it:
 *
 *   • The first hours are worth the most. Each additional hour buys less than
 *     the one before it.
 *   • The closer to the ceiling, the smaller the return — the 1450 student and
 *     the 1050 student get very different answers from the same week of work,
 *     which is what actually happens.
 *
 * WHERE TAU COMES FROM. Closing half the distance to the ceiling takes
 * TAU × ln2 ≈ 8 300 minutes ≈ 139 hours. For a student at 1000 that is 1000 →
 * 1300 in about 140 hours, which sits inside the 100–200 hours that published
 * guidance puts on a 200–300 point gain. It is a calibration, not a
 * measurement: when Sirius has its own outcome data, this is the constant to
 * fit, and the shape of the curve should survive that fit unchanged.
 *
 * The model is deliberately blind to *which* questions get practised. Skill
 * selection below decides where the time goes; the curve only says what a given
 * quantity of focused time is worth.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { TOTAL_SCORE_MAX, TOTAL_SCORE_MIN } from "@/lib/sat";

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Minutes one practice question costs: roughly 90 seconds to answer and 60 to
 * read the explanation. Reviewing the answer is the part that teaches, so it is
 * counted as study time rather than treated as free.
 */
export const MINUTES_PER_QUESTION = 2.5;

/** Minutes to close 63% of the distance to the ceiling. See the header. */
export const EFFORT_CONSTANT_MINUTES = 12_000;

/**
 * The furthest ahead a plan is written. A student sitting the exam in two years
 * gets a plan for the next six months — beyond that the weekly detail is
 * fiction, and fiction in a plan is what makes students stop trusting it.
 */
export const MAX_PLAN_WEEKS = 26;

/**
 * How many skills one week may contain. Spreading a week across fifteen skills
 * produces a plan of two questions each, which teaches nothing and reads as
 * busywork.
 */
export const SKILLS_PER_WEEK = 3;

const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface PlanSkill {
  /** Taxonomy code, e.g. "RW_CRAFT_WORDS_IN_CONTEXT". */
  code: string;
  /**
   * Share of the whole exam, 0–1: `domain.examWeight × skill.weightInDomain`.
   * This is what decides where a student's time is worth spending.
   */
  examShare: number;
  /** How many questions the bank actually holds for this skill. */
  availableQuestions: number;
}

export interface StudyPlanInput {
  /** Null when the student does not know their score yet. */
  currentScore: number | null;
  targetScore: number;
  examDate: Date;
  today: Date;
  weeklyStudyMinutes: number;
  skills: readonly PlanSkill[];
}

export interface PlannedTask {
  skillCode: string;
  questions: number;
}

export interface PlannedWeek {
  /** 1-based. */
  week: number;
  startDate: Date;
  dueDate: Date;
  questions: number;
  tasks: PlannedTask[];
}

export interface StudyPlanProjection {
  weeks: number;
  /** Questions a week the student's stated time allows. */
  weeklyQuestions: number;
  /** Questions the plan actually schedules, which the bank may cap. */
  totalQuestions: number;
  scheduledMinutes: number;
  /** Null when the starting score is unknown — see `currentScore`. */
  projectedScore: number | null;
  /** Minutes the target needs. Null when unknown or unreachable. */
  requiredMinutes: number | null;
  onTrack: boolean;
  /** Extra minutes a week the target would need. Zero when on track. */
  shortfallMinutesPerWeek: number;
  /** True when the bank ran out of questions before the student ran out of time. */
  bankLimited: boolean;
}

export interface StudyPlanResult {
  projection: StudyPlanProjection;
  weeks: PlannedWeek[];
}

/* -------------------------------------------------------------------------- */
/* The score model                                                             */
/* -------------------------------------------------------------------------- */

function clampScore(score: number): number {
  return Math.min(Math.max(score, TOTAL_SCORE_MIN), TOTAL_SCORE_MAX);
}

/** SAT scores are reported in steps of 10, so projections are too. */
function roundToTen(score: number): number {
  return Math.round(score / 10) * 10;
}

/** Points `minutes` of practice are expected to be worth from `currentScore`. */
export function scoreGain(currentScore: number, minutes: number): number {
  const headroom = TOTAL_SCORE_MAX - currentScore;
  if (headroom <= 0 || minutes <= 0) return 0;

  return headroom * (1 - Math.exp(-minutes / EFFORT_CONSTANT_MINUTES));
}

/** Where `minutes` of practice is expected to land a student. */
export function projectScore(currentScore: number, minutes: number): number {
  return roundToTen(clampScore(currentScore + scoreGain(currentScore, minutes)));
}

/**
 * Minutes needed to reach `targetScore`.
 *
 * Null means the target is not reachable by adding time: 1600 is an asymptote,
 * so a student who asks for it is told the plan cannot promise it rather than
 * being given a very large number that looks like a promise.
 */
export function minutesToReach(
  currentScore: number,
  targetScore: number,
): number | null {
  if (targetScore <= currentScore) return 0;

  const headroom = TOTAL_SCORE_MAX - currentScore;
  const wanted = targetScore - currentScore;
  if (wanted >= headroom) return null;

  return Math.ceil(
    -EFFORT_CONSTANT_MINUTES * Math.log(1 - wanted / headroom),
  );
}

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * Monday 00:00 UTC of the week containing `date`. ISO weeks start on Monday.
 *
 * This is what makes a week a week rather than "seven days from whenever the
 * plan was last written" — see `taskWindow`.
 */
function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  // `getUTCDay` is 0 for Sunday; shift so Monday is 0.
  const offset = (day.getUTCDay() + 6) % 7;

  return new Date(day.getTime() - offset * MS_PER_DAY);
}

/**
 * Whole weeks of preparation left, clamped to something a plan can honestly
 * describe. An exam in the past — which validation should have caught — yields
 * one week rather than a negative plan.
 */
export function planWeeks(today: Date, examDate: Date): number {
  const days = Math.ceil(
    (startOfUtcDay(examDate).getTime() - startOfUtcDay(today).getTime()) /
      MS_PER_DAY,
  );
  if (days <= 0) return 1;

  return Math.min(MAX_PLAN_WEEKS, Math.max(1, Math.ceil(days / 7)));
}

/* -------------------------------------------------------------------------- */
/* Completion                                                                  */
/* -------------------------------------------------------------------------- */

/** One scheduled task, reduced to what deciding its progress needs. */
export interface TaskWindow {
  /** Whatever the caller identifies the task by. Comes back as the map key. */
  id: string;
  skillId: string;
  startDate: Date;
  dueDate: Date;
}

/** One question the student answered, reduced the same way. */
export interface AnsweredQuestion {
  skillId: string;
  answeredAt: Date;
}

/**
 * The half-open interval a task's work is counted in: the **calendar week**
 * containing its `startDate`, Monday 00:00 UTC to the next Monday.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THE CALENDAR AND NOT THE TASK'S OWN DATES
 *
 * The obvious window is `[startDate, dueDate]`, and it is wrong. A plan's weeks
 * are anchored to the day the plan was written — `buildStudyPlan` starts week 1
 * at `today` — so two plans written three days apart cut the same fortnight
 * into different weeks. Deriving progress from those dates puts an answer in
 * "this week" under one plan and "last week" under the next, and rebuilding
 * silently moves work out from under the student. Measured: a plan written on a
 * Friday counted a Saturday's practice; rebuilding it on the Monday did not,
 * and two answered questions became zero.
 *
 * Anchoring to the calendar removes the plan from the question entirely.
 * Monday is Monday no matter when anyone pressed save, so **rebuilding inside a
 * week cannot change a single number** — which is the whole property this is
 * for. Progress still resets when a new week starts, because that is what a new
 * week is.
 *
 * The cost, stated: a plan written mid-week displays its own dates ("26 Aug —
 * 1 Sep") while counting the calendar week that contains them (24 Aug — 30
 * Aug), so work from earlier that week counts toward its first task. Making the
 * two agree means anchoring `buildStudyPlan`'s week 1 to the calendar too —
 * worth doing, and a change to the planner rather than to this rule. See
 * `HANDOFF.md`.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Consecutive tasks are seven days apart, so their windows are consecutive
 * calendar weeks: no gaps, no overlaps, nothing counted twice.
 */
export function taskWindow(task: { startDate: Date }): {
  from: Date;
  until: Date;
} {
  const from = startOfUtcWeek(task.startDate);

  return { from, until: new Date(from.getTime() + MS_PER_WEEK) };
}

/**
 * The whole interval a plan's tasks can draw answers from, so a caller can
 * bound its read instead of fetching a student's entire history. Null when
 * there are no tasks.
 */
export function planWindow(
  tasks: readonly TaskWindow[],
): { from: Date; until: Date } | null {
  if (tasks.length === 0) return null;

  let from = Infinity;
  let until = -Infinity;

  for (const task of tasks) {
    const span = taskWindow(task);
    from = Math.min(from, span.from.getTime());
    until = Math.max(until, span.until.getTime());
  }

  return { from: new Date(from), until: new Date(until) };
}

/**
 * How much of each task the student has actually done.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS IS DERIVED AND NOT STORED
 *
 * Progress used to be a counter on the task row, incremented by any practice
 * session opened from that task. That made it a fact about the *plan* — and
 * plans here are append-only: changing a target writes a new one, the new one's
 * counters start at zero, and a student who had done 18 of 40 was told they had
 * done none. Copying the old counts across would only have made the counter a
 * copy of a copy, and copies drift from what they describe.
 *
 * "This student answered 18 questions of Words in Context in the week of the
 * 7th" is a fact about the student and the calendar. It survives a rewritten
 * plan, it cannot disagree with the answers it is counting, and it does not
 * care which session the answers came from: practice opened from the plan, from
 * the topic list, or mixed is all the same student doing the same work. It also
 * ends the case where a session opened before a target change credited a task
 * on a plan the app no longer shows — there is nothing left to credit.
 *
 * The rule is the plainest one available: an answer counts toward a task when
 * it is that task's skill and it lands inside that task's calendar week — see
 * `taskWindow`, which is where the word "week" is pinned down and why it is
 * pinned to the calendar rather than to the plan.
 * `@@unique([planId, week, skillId])` gives one task per skill per week and
 * weeks do not overlap, so no answer is counted twice.
 *
 * What it deliberately does *not* do is reach outside the week. Work done in
 * earlier weeks does not fill in a plan's first task, and catching up in week 3
 * does not retroactively complete week 1 — a past week's number stays the true
 * statement of what happened in it.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Counts are not capped at `targetQuestions`: 50 answered against a target of
 * 40 is a true thing to say about the week, and a progress bar can clamp its
 * own width.
 */
export function completedByTask(
  tasks: readonly TaskWindow[],
  answers: readonly AnsweredQuestion[],
): Map<string, number> {
  const counts = new Map<string, number>(tasks.map((task) => [task.id, 0]));

  /*
   * Grouped by skill before the sweep. A 26-week plan against a term of
   * answers is otherwise tasks × answers comparisons for a number that is
   * rendered on a page load.
   */
  const bySkill = new Map<string, TaskWindow[]>();
  for (const task of tasks) {
    const group = bySkill.get(task.skillId);
    if (group) group.push(task);
    else bySkill.set(task.skillId, [task]);
  }

  for (const answer of answers) {
    const group = bySkill.get(answer.skillId);
    if (!group) continue;

    const at = answer.answeredAt.getTime();

    for (const task of group) {
      const { from, until } = taskWindow(task);
      if (at < from.getTime() || at >= until.getTime()) continue;

      counts.set(task.id, (counts.get(task.id) ?? 0) + 1);
      // Windows do not overlap, so the first match is the only one.
      break;
    }
  }

  return counts;
}

/* -------------------------------------------------------------------------- */
/* Apportionment                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Split `total` into whole parts proportional to `weights`, giving the
 * remainders to the largest fractions first (Hamilton's method).
 *
 * Rounding each share on its own loses or invents questions; this always sums
 * to exactly `total`, which is what makes a week's numbers add up.
 */
export function splitProportionally(
  total: number,
  weights: readonly number[],
): number[] {
  if (weights.length === 0 || total <= 0) return weights.map(() => 0);

  const sum = weights.reduce((running, weight) => running + weight, 0);
  if (sum <= 0) {
    // No signal to apportion by: spread as evenly as the total allows.
    return weights.map((_, index) =>
      Math.floor(total / weights.length) +
      (index < total % weights.length ? 1 : 0),
    );
  }

  const exact = weights.map((weight) => (weight / sum) * total);
  const parts = exact.map((value) => Math.floor(value));
  let assigned = parts.reduce((running, part) => running + part, 0);

  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (const { index } of order) {
    if (assigned >= total) break;
    parts[index] += 1;
    assigned += 1;
  }

  return parts;
}

/* -------------------------------------------------------------------------- */
/* The plan                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Build a week-by-week plan.
 *
 * Two constraints decide the size of a plan, and the smaller one wins:
 *
 *   • the student's time — `weeks × weeklyQuestions`;
 *   • the question bank — every question scheduled once.
 *
 * Scheduling more questions than the bank holds would be a plan nobody can
 * follow, so `bankLimited` reports the shortfall instead. Pacing the smaller
 * budget evenly across the weeks is what keeps the last month of a plan from
 * being empty while the first week asks for everything.
 *
 * Within that budget, skills are given work in proportion to their share of the
 * exam, capped at what exists for them — a skill with four questions gets four,
 * and the share it could not use goes to the skills that can. Each week then
 * takes the `SKILLS_PER_WEEK` skills furthest from finishing their allocation,
 * which rotates the whole taxonomy through the plan rather than drilling the
 * three heaviest topics for three months.
 */
export function buildStudyPlan(input: StudyPlanInput): StudyPlanResult {
  const weeks = planWeeks(input.today, input.examDate);
  const weeklyQuestions = Math.max(
    1,
    Math.floor(input.weeklyStudyMinutes / MINUTES_PER_QUESTION),
  );

  const usable = input.skills.filter(
    (skill) => skill.examShare > 0 && skill.availableQuestions > 0,
  );

  const capacity = weeks * weeklyQuestions;
  const available = usable.reduce(
    (running, skill) => running + skill.availableQuestions,
    0,
  );
  const budget = Math.min(capacity, available);
  const bankLimited = budget < capacity;

  /* Spread the budget evenly rather than front-loading it. */
  const weeklyTarget = Math.max(1, Math.ceil(budget / Math.max(weeks, 1)));

  const remaining = allocate(usable, budget);

  const start = startOfUtcDay(input.today);
  const examDay = startOfUtcDay(input.examDate);
  const plannedWeeks: PlannedWeek[] = [];

  for (let week = 1; week <= weeks; week += 1) {
    const startDate = addDays(start, (week - 1) * 7);
    const rawDue = addDays(startDate, 6);
    // The last week ends on exam day, not after it.
    const dueDate = rawDue.getTime() > examDay.getTime() ? examDay : rawDue;

    const pool = pickSkills(usable, remaining);
    const questions = assignQuestions(pool, remaining, weeklyTarget);

    const tasks: PlannedTask[] = [];
    pool.forEach((skill, index) => {
      if (questions[index] <= 0) return;

      tasks.push({ skillCode: skill.code, questions: questions[index] });
      remaining.set(
        skill.code,
        (remaining.get(skill.code) ?? 0) - questions[index],
      );
    });

    plannedWeeks.push({
      week,
      startDate,
      dueDate,
      questions: tasks.reduce((running, task) => running + task.questions, 0),
      tasks,
    });
  }

  const totalQuestions = plannedWeeks.reduce(
    (running, week) => running + week.questions,
    0,
  );
  const scheduledMinutes = Math.round(totalQuestions * MINUTES_PER_QUESTION);

  const projectedScore =
    input.currentScore === null
      ? null
      : projectScore(input.currentScore, scheduledMinutes);

  const requiredMinutes =
    input.currentScore === null
      ? null
      : minutesToReach(input.currentScore, input.targetScore);

  const onTrack = projectedScore !== null && projectedScore >= input.targetScore;

  const shortfallMinutesPerWeek =
    onTrack || requiredMinutes === null
      ? 0
      : Math.max(0, Math.ceil((requiredMinutes - scheduledMinutes) / weeks));

  return {
    projection: {
      weeks,
      weeklyQuestions,
      totalQuestions,
      scheduledMinutes,
      projectedScore,
      requiredMinutes,
      onTrack,
      shortfallMinutesPerWeek,
      bankLimited,
    },
    weeks: plannedWeeks,
  };
}

/**
 * Divide the whole budget between skills, by share, capped at what each one
 * actually has.
 *
 * The loop is the capping: whatever a skill could not take is offered again to
 * the skills that still have room, until the budget is spent or nothing can
 * absorb it. One pass would leave the share of a thin skill unspent, and the
 * plan would quietly ask for less work than the student has time for.
 */
function allocate(
  usable: readonly PlanSkill[],
  budget: number,
): Map<string, number> {
  const quota = new Map<string, number>(usable.map((skill) => [skill.code, 0]));

  let pool = [...usable];
  let left = budget;

  while (left > 0 && pool.length > 0) {
    const parts = splitProportionally(
      left,
      pool.map((skill) => skill.examShare),
    );

    let given = 0;
    const next: PlanSkill[] = [];

    pool.forEach((skill, index) => {
      const already = quota.get(skill.code) ?? 0;
      const headroom = skill.availableQuestions - already;
      const take = Math.min(parts[index], headroom);

      quota.set(skill.code, already + take);
      given += take;

      if (headroom - take > 0) next.push(skill);
    });

    // Nobody could take anything: the rest of the budget has nowhere to go.
    if (given === 0) break;

    left -= given;
    pool = next;
  }

  return quota;
}

/**
 * The skills a week should cover: those furthest from finishing their
 * allocation, with ties broken by code so the same inputs always produce the
 * same plan.
 */
function pickSkills(
  usable: readonly PlanSkill[],
  remaining: ReadonlyMap<string, number>,
): PlanSkill[] {
  return usable
    .filter((skill) => (remaining.get(skill.code) ?? 0) > 0)
    .sort(
      (a, b) =>
        (remaining.get(b.code) ?? 0) - (remaining.get(a.code) ?? 0) ||
        a.code.localeCompare(b.code),
    )
    .slice(0, SKILLS_PER_WEEK);
}

/**
 * Hand out one week's questions among the chosen skills, never asking for more
 * of a skill than it has left to do.
 */
function assignQuestions(
  pool: readonly PlanSkill[],
  remaining: ReadonlyMap<string, number>,
  weeklyTarget: number,
): number[] {
  if (pool.length === 0) return [];

  const left = pool.map((skill) => remaining.get(skill.code) ?? 0);
  const target = Math.min(
    weeklyTarget,
    left.reduce((running, value) => running + value, 0),
  );

  const questions = splitProportionally(target, left);

  let spare = 0;
  questions.forEach((value, index) => {
    if (value > left[index]) {
      spare += value - left[index];
      questions[index] = left[index];
    }
  });

  // One pass to give the overflow to whoever still has work outstanding.
  for (let index = 0; index < pool.length && spare > 0; index += 1) {
    const headroom = left[index] - questions[index];
    if (headroom <= 0) continue;

    const take = Math.min(headroom, spare);
    questions[index] += take;
    spare -= take;
  }

  return questions;
}
