/**
 * Reads for practice mode.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THE ANSWER KEY IS FETCHED IN A SEPARATE QUERY, ON PURPOSE
 *
 * `getPracticeSession` runs two reads: one for the questions as the student
 * sees them, and one for the answers to the questions they have *already*
 * answered. Selecting both in a single query and stripping the key afterwards
 * would work — until someone adds a field to the wrong object literal and ships
 * the answers to the browser inside an RSC payload nobody inspects.
 *
 * Two queries make that mistake structurally impossible: the key for an
 * unanswered question is never loaded in the first place.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { parseQuestionOptions, type SimulatorOption } from "@/lib/simulator";
import { rankWeakSkills, type SkillAccuracy } from "@/lib/practice";
import type {
  PracticeSource,
  QuestionFormat,
  TestModule,
} from "@/lib/generated/prisma/enums";
import type { BankCounts, MockSection } from "@/lib/mock";

/* -------------------------------------------------------------------------- */
/* Choosing a topic                                                            */
/* -------------------------------------------------------------------------- */

export interface PracticeSkillOption {
  code: string;
  name: string;
  nameUz: string | null;
  domainCode: string;
  domainName: string;
  /** Questions the bank holds for this skill. */
  available: number;
  /** How many the student has answered, across every session. */
  answered: number;
  correct: number;
}

/**
 * Every skill with at least one question, with this student's record on it.
 *
 * The per-skill tally is computed in JavaScript from the student's own
 * responses rather than in SQL: Prisma cannot group by a field on a related
 * table, and a student's answer history is small enough that the round trip
 * costs less than a raw query would cost in readability.
 */
export async function getPracticeSkills(
  userId: string,
): Promise<PracticeSkillOption[]> {
  if (!isDatabaseConfigured()) return [];

  const [skills, responses] = await Promise.all([
    prisma.skill.findMany({
      orderBy: [{ domain: { order: "asc" } }, { order: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        nameUz: true,
        domain: { select: { code: true, name: true } },
        _count: { select: { questions: true } },
      },
    }),
    prisma.practiceResponse.findMany({
      where: { session: { userId } },
      select: { isCorrect: true, question: { select: { skillId: true } } },
    }),
  ]);

  const codeById = new Map(skills.map((skill) => [skill.id, skill.code]));

  const tally = new Map<string, { answered: number; correct: number }>();
  for (const response of responses) {
    const code = response.question.skillId
      ? codeById.get(response.question.skillId)
      : undefined;
    if (!code) continue;

    const row = tally.get(code) ?? { answered: 0, correct: 0 };
    row.answered += 1;
    if (response.isCorrect) row.correct += 1;
    tally.set(code, row);
  }

  return skills
    .filter((skill) => skill._count.questions > 0)
    .map((skill) => ({
      code: skill.code,
      name: skill.name,
      nameUz: skill.nameUz,
      domainCode: skill.domain.code,
      domainName: skill.domain.name,
      available: skill._count.questions,
      answered: tally.get(skill.code)?.answered ?? 0,
      correct: tally.get(skill.code)?.correct ?? 0,
    }));
}

/**
 * The student's weakest skills, worst first.
 *
 * Skills with too few answers to judge are left out — see
 * `MIN_ANSWERS_FOR_WEAKNESS` in `lib/practice.ts`.
 */
export async function getWeakSkills(
  userId: string,
  limit = 5,
): Promise<Array<PracticeSkillOption & { accuracy: number }>> {
  const skills = await getPracticeSkills(userId);

  const rows: SkillAccuracy[] = skills.map((skill) => ({
    skillCode: skill.code,
    answered: skill.answered,
    correct: skill.correct,
  }));

  const byCode = new Map(skills.map((skill) => [skill.code, skill]));

  return rankWeakSkills(rows)
    .slice(0, limit)
    .flatMap((weak) => {
      const skill = byCode.get(weak.skillCode);
      return skill ? [{ ...skill, accuracy: weak.accuracy }] : [];
    });
}

/* -------------------------------------------------------------------------- */
/* A session                                                                   */
/* -------------------------------------------------------------------------- */

/** A question as the browser is allowed to see it: no answer, no explanation. */
export interface PracticeQuestionView {
  id: string;
  questionText: string;
  passageText: string | null;
  passageTitle: string | null;
  format: QuestionFormat;
  options: SimulatorOption[];
}

/** What the student may see once they have answered. */
export interface PracticeFeedback {
  answer: string | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
  correctAnswer: string;
  explanation: string | null;
}

export interface PracticeSessionView {
  id: string;
  source: PracticeSource;
  planTaskId: string | null;
  /** Null on a `MIXED` session, which spans every topic. */
  skillCode: string | null;
  skillName: string | null;
  skillNameUz: string | null;
  domainName: string | null;
  completedAt: Date | null;
  questions: PracticeQuestionView[];
  /** Keyed by question id. Only holds questions that have been answered. */
  feedback: Record<string, PracticeFeedback>;
}

/**
 * Load a session for its owner.
 *
 * Returns null when the session does not exist *or* belongs to somebody else —
 * the id is in the URL, so the two cases must be indistinguishable.
 */
export async function getPracticeSession(
  userId: string,
  sessionId: string,
): Promise<PracticeSessionView | null> {
  if (!isDatabaseConfigured()) return null;

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId },
    select: {
      id: true,
      source: true,
      planTaskId: true,
      questionIds: true,
      completedAt: true,
      skill: {
        select: {
          code: true,
          name: true,
          nameUz: true,
          domain: { select: { name: true } },
        },
      },
      responses: {
        select: {
          questionId: true,
          answer: true,
          isCorrect: true,
          timeSpentSeconds: true,
        },
      },
    },
  });

  if (!session) return null;

  const orderedIds = asQuestionIds(session.questionIds);

  // Query one: what the student may look at while answering.
  const questions = await prisma.question.findMany({
    where: { id: { in: orderedIds } },
    select: {
      id: true,
      questionText: true,
      passageText: true,
      passageTitle: true,
      format: true,
      options: true,
    },
  });

  const byId = new Map(questions.map((question) => [question.id, question]));

  const answeredIds = session.responses.map((response) => response.questionId);

  // Query two: the answers, and only for questions already answered.
  const keys =
    answeredIds.length > 0
      ? await prisma.question.findMany({
          where: { id: { in: answeredIds } },
          select: { id: true, correctAnswer: true, explanation: true },
        })
      : [];

  const keyById = new Map(keys.map((key) => [key.id, key]));

  const feedback: Record<string, PracticeFeedback> = {};
  for (const response of session.responses) {
    const key = keyById.get(response.questionId);
    if (!key) continue;

    feedback[response.questionId] = {
      answer: response.answer,
      isCorrect: response.isCorrect,
      timeSpentSeconds: response.timeSpentSeconds,
      correctAnswer: key.correctAnswer,
      explanation: key.explanation,
    };
  }

  return {
    id: session.id,
    source: session.source,
    planTaskId: session.planTaskId,
    skillCode: session.skill?.code ?? null,
    skillName: session.skill?.name ?? null,
    skillNameUz: session.skill?.nameUz ?? null,
    domainName: session.skill?.domain.name ?? null,
    completedAt: session.completedAt,
    questions: orderedIds.flatMap((id) => {
      const question = byId.get(id);
      if (!question) return [];

      return [
        {
          id: question.id,
          questionText: question.questionText,
          passageText: question.passageText,
          passageTitle: question.passageTitle,
          format: question.format,
          options: parseQuestionOptions(question.options),
        },
      ];
    }),
    feedback,
  };
}

/**
 * Read the `questionIds` JSON column defensively. A malformed value yields an
 * empty session rather than a crashed page — the same posture
 * `parseQuestionOptions` takes for the options column.
 */
export function asQuestionIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

/* -------------------------------------------------------------------------- */
/* What the question bank can fill                                             */
/* -------------------------------------------------------------------------- */

/**
 * Count the whole bank by section and module.
 *
 * Across every test, published or not. The bank was imported into two
 * *unpublished* container tests ("SAT question bank — Math" and "— Reading &
 * Writing"), so a query filtered on `isPublished` sees 40 questions as zero and
 * the practice page offered a two-question demo as the only thing to sit. A
 * question's availability is a property of the question, not of the row it was
 * imported under.
 *
 * `section` comes through skill → domain, so a question with no skill is
 * counted nowhere — which is correct: it cannot be placed in a blueprint module
 * either.
 */
export async function getBankCounts(): Promise<BankCounts> {
  if (!isDatabaseConfigured()) return [];

  /*
   * Prisma cannot group by a field two relations away, so the section has to
   * come back per question. The bank is small enough that this is one cheap
   * read; if it ever is not, this becomes a raw `count(*) ... group by` and the
   * shape it returns does not change.
   */
  const questions = await prisma.question.findMany({
    where: { skillRef: { isNot: null } },
    select: {
      module: true,
      skillRef: { select: { domain: { select: { section: true } } } },
    },
  });

  const tally = new Map<string, number>();
  for (const question of questions) {
    const section = mockSectionOf(question.skillRef?.domain.section ?? null);
    if (!section) continue;
    const key = `${section}|${question.module}`;
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }

  return [...tally.entries()].map(([key, count]) => {
    const [section, module] = key.split("|");
    return {
      section: section as MockSection,
      module: module as TestModule,
      count,
    };
  });
}

/** `SatSection` (RW/MATH) to the names the blueprint uses. */
function mockSectionOf(section: "RW" | "MATH" | null): MockSection | null {
  if (section === "RW") return "READING";
  if (section === "MATH") return "MATH";
  return null;
}
