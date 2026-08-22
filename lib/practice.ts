/**
 * Practice-mode rules that do not need a database.
 *
 * Three decisions live here, and all three are the kind that are easy to get
 * subtly wrong and impossible to notice afterwards: which questions a session
 * asks, what a finished session says about itself, and which skills count as
 * weak. Keeping them pure means each one has a test rather than an opinion.
 */

/** What the student has already done with one question. */
export interface QuestionHistory {
  /** Epoch milliseconds of the most recent answer, or null if never answered. */
  lastAnsweredAt: number | null;
  timesAnswered: number;
}

/**
 * Choose the questions for a session.
 *
 * Unseen questions come first, oldest answers next. With a bank this small a
 * student will meet the same question again, and that is fine — but meeting it
 * again *before* the ones they have never seen is not, and it is exactly what
 * a naive `take(n)` would do.
 *
 * `candidates` is expected in a stable order (question order within its test),
 * which is what breaks ties: two never-answered questions stay in bank order,
 * so the same request twice produces the same session.
 */
export function selectPracticeQuestions(
  candidates: readonly string[],
  history: ReadonlyMap<string, QuestionHistory>,
  count: number,
): string[] {
  if (count <= 0) return [];

  return [...candidates]
    .map((id, index) => ({ id, index, seen: history.get(id) ?? null }))
    .sort((a, b) => {
      const aSeen = a.seen?.timesAnswered ?? 0;
      const bSeen = b.seen?.timesAnswered ?? 0;

      // Never answered beats answered, whatever the dates say.
      const aFresh = aSeen === 0;
      const bFresh = bSeen === 0;
      if (aFresh !== bFresh) return aFresh ? -1 : 1;

      if (aSeen !== 0 && bSeen !== 0) {
        const aWhen = a.seen?.lastAnsweredAt ?? 0;
        const bWhen = b.seen?.lastAnsweredAt ?? 0;
        if (aWhen !== bWhen) return aWhen - bWhen;
        if (aSeen !== bSeen) return aSeen - bSeen;
      }

      return a.index - b.index;
    })
    .slice(0, count)
    .map((entry) => entry.id);
}

/** How many questions a session should ask when the student picks a topic. */
export const DEFAULT_SESSION_LENGTH = 10;

/**
 * The length of a session, given what the bank holds and — when the session
 * comes from a study-plan task — how much of that task is left.
 *
 * Never zero: a task that is already finished still opens a session of one
 * question rather than an error, because "practise this again" is a reasonable
 * thing to want and refusing it needs a better reason than arithmetic.
 */
export function sessionLength(
  available: number,
  remainingInTask?: number | null,
): number {
  if (available <= 0) return 0;

  const wanted =
    remainingInTask === undefined || remainingInTask === null
      ? DEFAULT_SESSION_LENGTH
      : Math.max(1, remainingInTask);

  return Math.min(available, wanted);
}

/* -------------------------------------------------------------------------- */
/* Results                                                                     */
/* -------------------------------------------------------------------------- */

export interface PracticeSummary {
  answered: number;
  correct: number;
  /** 0–1. Zero when nothing was answered, rather than NaN. */
  accuracy: number;
  /** Seconds across every answered question. */
  totalSeconds: number;
  /** Seconds per answered question, rounded. Zero when nothing was answered. */
  averageSeconds: number;
}

export function summarisePractice(
  responses: ReadonlyArray<{ isCorrect: boolean; timeSpentSeconds: number }>,
): PracticeSummary {
  const answered = responses.length;
  const correct = responses.filter((response) => response.isCorrect).length;
  const totalSeconds = responses.reduce(
    (running, response) => running + response.timeSpentSeconds,
    0,
  );

  return {
    answered,
    correct,
    accuracy: answered > 0 ? correct / answered : 0,
    totalSeconds,
    averageSeconds: answered > 0 ? Math.round(totalSeconds / answered) : 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Weak skills                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * How many answers a skill needs before its accuracy is worth showing.
 *
 * Two questions is not evidence. Calling a skill weak on the strength of one
 * wrong answer sends a student to spend a week on something they may already
 * know, which is the most expensive mistake this feature can make.
 */
export const MIN_ANSWERS_FOR_WEAKNESS = 4;

export interface SkillAccuracy {
  skillCode: string;
  answered: number;
  correct: number;
}

export interface WeakSkill extends SkillAccuracy {
  accuracy: number;
}

/**
 * Rank skills by how badly they are going, worst first.
 *
 * Skills with too little evidence are left out entirely rather than sorted to
 * the bottom — "we do not know yet" is not a weak skill, and a list that mixes
 * the two teaches a student to distrust the list.
 */
export function rankWeakSkills(
  rows: readonly SkillAccuracy[],
  minAnswers: number = MIN_ANSWERS_FOR_WEAKNESS,
): WeakSkill[] {
  return rows
    .filter((row) => row.answered >= minAnswers)
    .map((row) => ({ ...row, accuracy: row.correct / row.answered }))
    .sort(
      (a, b) =>
        a.accuracy - b.accuracy ||
        b.answered - a.answered ||
        a.skillCode.localeCompare(b.skillCode),
    );
}
