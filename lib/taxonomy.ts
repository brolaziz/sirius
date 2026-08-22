/**
 * How a question in a source bank finds its place in the SAT skill taxonomy.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHERE THE TAXONOMY LIVES
 *
 * Not here. The 8 domains and 31 skills — their names, their Uzbek names, the
 * share of the exam each one carries — are rows in the `domains` and `skills`
 * tables, and those rows are the only copy. This module holds one thing the
 * database cannot: the closed list of skill *codes* application code is
 * allowed to name, and the mapping from the labels source banks actually use
 * onto those codes.
 *
 * The importer checks `SKILL_CODES` against the database on every run and stops
 * if a code here has no row there, so the two cannot drift apart quietly.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * WHY THE MAPPING IS CODE AND NOT DATA
 *
 * Question banks label their questions however their author felt that day:
 * "Reading - Main Idea", "Main Ideas", "central idea". Writing those strings
 * into a column and grouping by them produces a weak-area report where the same
 * skill appears three times with a third of the evidence each — and nobody
 * notices, because every row looks plausible.
 *
 * So `SOURCE_TOPIC_MAP` is reviewed like code, and a label that is not in it
 * gets its question **rejected** with the label quoted in the import report.
 * A missing entry is a five-line change; a silently invented skill is a
 * statistic nobody can trust.
 */

import type { TestType } from "@/lib/generated/prisma/enums";

/**
 * Only two of the three `TestType` values name a section of the exam. `FULL`
 * describes a test that spans both.
 */
export type Section = Extract<TestType, "READING" | "MATH">;

/* -------------------------------------------------------------------------- */
/* The closed vocabulary                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Every skill code in the taxonomy, in the database's own order.
 *
 * This list exists so that a mapping to a code that does not exist is a
 * compile error rather than a null `skill_id` discovered months later. Its
 * agreement with the database is asserted at import time.
 */
export const SKILL_CODES = [
  /* Reading & Writing — Information and Ideas */
  "RW_INFO_IDEAS_CENTRAL_IDEAS",
  "RW_INFO_IDEAS_EVIDENCE_TEXTUAL",
  "RW_INFO_IDEAS_EVIDENCE_QUANTITATIVE",
  "RW_INFO_IDEAS_INFERENCES",

  /* Reading & Writing — Craft and Structure */
  "RW_CRAFT_WORDS_IN_CONTEXT",
  "RW_CRAFT_TEXT_STRUCTURE",
  "RW_CRAFT_CROSS_TEXT",

  /* Reading & Writing — Expression of Ideas */
  "RW_EXPRESSION_RHETORICAL_SYNTHESIS",
  "RW_EXPRESSION_TRANSITIONS",

  /* Reading & Writing — Standard English Conventions */
  "RW_CONVENTIONS_BOUNDARIES",
  "RW_CONVENTIONS_FORM_STRUCTURE_SENSE",

  /* Math — Algebra */
  "MATH_ALGEBRA_LINEAR_EQ_ONE_VAR",
  "MATH_ALGEBRA_LINEAR_EQ_TWO_VAR",
  "MATH_ALGEBRA_LINEAR_FUNCTIONS",
  "MATH_ALGEBRA_LINEAR_SYSTEMS",
  "MATH_ALGEBRA_LINEAR_INEQUALITIES",

  /* Math — Advanced Math */
  "MATH_ADVANCED_EQUIVALENT_EXPRESSIONS",
  "MATH_ADVANCED_NONLINEAR_EQ_ONE_VAR",
  "MATH_ADVANCED_NONLINEAR_FUNCTIONS",
  "MATH_ADVANCED_NONLINEAR_SYSTEMS",

  /* Math — Problem-Solving and Data Analysis */
  "MATH_PSDA_RATIOS_RATES_PROPORTIONS",
  "MATH_PSDA_PERCENTAGES",
  "MATH_PSDA_ONE_VARIABLE_DATA",
  "MATH_PSDA_TWO_VARIABLE_DATA",
  "MATH_PSDA_PROBABILITY",
  "MATH_PSDA_SAMPLE_INFERENCE",
  "MATH_PSDA_STATISTICAL_CLAIMS",

  /* Math — Geometry and Trigonometry */
  "MATH_GEO_TRIG_AREA_VOLUME",
  "MATH_GEO_TRIG_LINES_ANGLES_TRIANGLES",
  "MATH_GEO_TRIG_RIGHT_TRIANGLES_TRIG",
  "MATH_GEO_TRIG_CIRCLES",
] as const;

export type SkillCode = (typeof SKILL_CODES)[number];

const SKILL_CODE_SET: ReadonlySet<string> = new Set(SKILL_CODES);

/** Is this string one of the taxonomy's skill codes? */
export function isSkillCode(value: string): value is SkillCode {
  return SKILL_CODE_SET.has(value);
}

/* -------------------------------------------------------------------------- */
/* Source labels                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Every `topic` string the shipped question bank uses, and the skill it means.
 *
 * Keys are written exactly as they appear in the source files so a reviewer can
 * grep for one; lookup normalises both sides (see `normaliseTopic`), so casing,
 * punctuation and `&`/`and` differences do not matter.
 *
 * Some source labels are coarser than the taxonomy — "Linear Equations" does
 * not say whether the equation has one variable or two, and "Percent, Ratio &
 * Proportion" spans two skills. The value here is the *usual* reading; the
 * handful of questions where it is wrong are corrected one at a time in
 * `QUESTION_SKILL_OVERRIDES` below.
 */
export const SOURCE_TOPIC_MAP: Readonly<Record<string, SkillCode>> = {
  /* Reading & Writing */
  "Reading - Main Idea": "RW_INFO_IDEAS_CENTRAL_IDEAS",
  "Reading - Details": "RW_INFO_IDEAS_CENTRAL_IDEAS",
  "Reading - Inference": "RW_INFO_IDEAS_INFERENCES",
  "Reading - Words in Context": "RW_CRAFT_WORDS_IN_CONTEXT",
  "Reading - Main Purpose": "RW_CRAFT_TEXT_STRUCTURE",
  "Reading - Overall Structure": "RW_CRAFT_TEXT_STRUCTURE",
  "Writing - Transitions": "RW_EXPRESSION_TRANSITIONS",
  "Writing - Rhetorical Synthesis": "RW_EXPRESSION_RHETORICAL_SYNTHESIS",
  "Writing - Boundaries (Punctuation)": "RW_CONVENTIONS_BOUNDARIES",
  "Writing - Form, Structure, and Sense (Agreement)":
    "RW_CONVENTIONS_FORM_STRUCTURE_SENSE",

  /* Math */
  "Linear Equations": "MATH_ALGEBRA_LINEAR_EQ_ONE_VAR",
  "Linear Functions": "MATH_ALGEBRA_LINEAR_FUNCTIONS",
  "Linear System of Equations": "MATH_ALGEBRA_LINEAR_SYSTEMS",
  "Linear Inequalities": "MATH_ALGEBRA_LINEAR_INEQUALITIES",
  Quadratics: "MATH_ADVANCED_NONLINEAR_EQ_ONE_VAR",
  "Functions & Function Notation": "MATH_ADVANCED_NONLINEAR_FUNCTIONS",
  "Exponents & Radicals": "MATH_ADVANCED_EQUIVALENT_EXPRESSIONS",
  "Percent, Ratio & Proportion": "MATH_PSDA_RATIOS_RATES_PROPORTIONS",
  "Unit Conversion": "MATH_PSDA_RATIOS_RATES_PROPORTIONS",
  Probability: "MATH_PSDA_PROBABILITY",
  "Mean, Median, Mode, Range": "MATH_PSDA_ONE_VARIABLE_DATA",
  "Geometry - Lines and Angles": "MATH_GEO_TRIG_LINES_ANGLES_TRIANGLES",
};

/**
 * Questions whose own label sends them to the wrong skill, corrected by id.
 *
 * Each of these was read before it was written down. The alternative to a
 * four-line table is a taxonomy that quietly merges skills the exam keeps
 * apart, which is the thing this whole module exists to prevent.
 */
export const QUESTION_SKILL_OVERRIDES: Readonly<Record<string, SkillCode>> = {
  // "58 = 2x + 2y" is a linear equation in two variables, not one.
  "math-7": "MATH_ALGEBRA_LINEAR_EQ_TWO_VAR",
  // "y = (x − 6)(x + 5)" against "y = 11x − 66" is a nonlinear system.
  "math-11": "MATH_ADVANCED_NONLINEAR_SYSTEMS",
  // "√w + 22 = 28" is solving a radical equation, not rewriting an expression.
  "math-16": "MATH_ADVANCED_NONLINEAR_EQ_ONE_VAR",
  // 170% of a population, then 75% of that: percentages, not ratios and units.
  "math-10": "MATH_PSDA_PERCENTAGES",
};

/* -------------------------------------------------------------------------- */
/* Lookup                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fold a topic label down to the part that carries meaning: lower case, `&`
 * spelled out, punctuation dropped, runs of whitespace collapsed.
 *
 * `"Percent, Ratio & Proportion"` and `"percent ratio and proportion"` both
 * become `"percent ratio and proportion"`.
 */
export function normaliseTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const TOPIC_INDEX: ReadonlyMap<string, SkillCode> = (() => {
  const index = new Map<string, SkillCode>();

  for (const [topic, code] of Object.entries(SOURCE_TOPIC_MAP)) {
    index.set(normaliseTopic(topic), code);
  }

  return index;
})();

/** How a question came to be filed under the skill it was filed under. */
export type SkillResolutionSource = "override" | "topic";

export interface ResolvedSkill {
  code: SkillCode;
  via: SkillResolutionSource;
}

/**
 * Decide which skill a question belongs to.
 *
 * The per-question override wins over the label, because it was written by
 * someone who read the question and the label was not. Null means the label is
 * not in the vocabulary — the importer turns that into a rejected question,
 * which is the signal that `SOURCE_TOPIC_MAP` needs a new entry.
 */
export function resolveSkill(
  topic: string,
  externalId?: string,
): ResolvedSkill | null {
  const override = externalId
    ? QUESTION_SKILL_OVERRIDES[externalId]
    : undefined;
  if (override) return { code: override, via: "override" };

  const code = TOPIC_INDEX.get(normaliseTopic(topic));
  return code ? { code, via: "topic" } : null;
}
