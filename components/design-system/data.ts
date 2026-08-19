/**
 * Content for the design-system page.
 *
 * Every direction renders the *same* data, so a comparison is about the design
 * and not about which sample happened to get the better copy. The numbers are
 * plausible for a Tashkent eleventh-grader eight weeks out from a test date:
 * a 1310 best score against a 1450 target, not a perfect scorecard.
 *
 * Server-safe: plain data, no JSX, importable from either environment.
 */

export const student = {
  name: "Abdulaziz",
  targetScore: 1450,
  bestScore: 1310,
  previousScore: 1240,
  readingWriting: 680,
  math: 630,
  accuracy: 0.71,
  questionsAnswered: 842,
  daysToTest: 54,
  savedWords: 128,
  streakDays: 12,
} as const;

/** The score meter's anchor points. */
export const SCORE_FLOOR = 400;
export const SCORE_CEILING = 1600;

export interface SectionScore {
  label: string;
  short: string;
  score: number;
  max: number;
  delta: number;
}

export const sectionScores: SectionScore[] = [
  { label: "Reading & Writing", short: "R&W", score: 680, max: 800, delta: +40 },
  { label: "Math", short: "Math", score: 630, max: 800, delta: +30 },
];

/** One module of a practice test, as the navigator sees it. */
export type QuestionState = "correct" | "wrong" | "flagged" | "blank";

export const navigatorStates: QuestionState[] = [
  "correct", "correct", "wrong", "correct", "flagged", "correct",
  "correct", "blank", "correct", "wrong", "correct", "flagged",
  "correct", "correct", "correct", "blank", "wrong", "correct",
  "correct", "flagged", "correct", "blank", "correct", "correct",
  "wrong", "correct", "correct",
];

export const sampleQuestion = {
  number: 7,
  module: "Section 1, Module 2",
  domain: "Information and Ideas",
  difficulty: "Hard",
  stem: "Which choice best states the main idea of the passage?",
  options: [
    { label: "A", text: "Plastic pollution is easily reversed by natural processes." },
    { label: "B", text: "Plastic debris persists far longer in marine systems than researchers once assumed." },
    { label: "C", text: "Plastic pollution affects coastal ecosystems but not the open ocean." },
    { label: "D", text: "Plastic debris has no measurable effect on marine life." },
  ],
  selected: "B",
  eliminated: ["D"],
} as const;

export const passage = {
  source: "Adapted for demonstration · Science",
  before: "For most of the twentieth century, ecologists treated coral reefs as resilient systems. That paradigm has not survived contact with the data. Plastic debris, now ",
  term: "ubiquitous",
  after: " in the ocean, complicates every model, and the interval between bleaching events has narrowed until recovery is rarely complete.",
} as const;

export const dictionaryEntry = {
  word: "ubiquitous",
  partOfSpeech: "adjective",
  translation: "hamma yerda mavjud",
  explanationUz: "Bir vaqtning o'zida hamma joyda uchraydigan; juda keng tarqalgan.",
  explanation: "Present, appearing, or found everywhere at the same time.",
  example: "Smartphones have become ubiquitous in classrooms.",
  frequency: "Appears in 4 of 10 official practice tests",
} as const;

export interface SavedWord {
  word: string;
  translation: string;
  partOfSpeech: string;
  seen: number;
}

export const savedWords: SavedWord[] = [
  { word: "tenuous", translation: "zaif, ishonchsiz", partOfSpeech: "adj.", seen: 6 },
  { word: "meticulous", translation: "puxta, sinchkov", partOfSpeech: "adj.", seen: 4 },
  { word: "ambivalent", translation: "ikkilanuvchi", partOfSpeech: "adj.", seen: 3 },
  { word: "empirical", translation: "tajribaga asoslangan", partOfSpeech: "adj.", seen: 9 },
  { word: "scrutinize", translation: "sinchiklab tekshirmoq", partOfSpeech: "verb", seen: 5 },
  { word: "paradigm", translation: "namuna, andoza", partOfSpeech: "noun", seen: 7 },
];

export type Verdict = "reach" | "match" | "safety";

export interface Uni {
  id: string;
  name: string;
  city: string;
  country: string;
  acceptance: number;
  sat: number;
  ielts: number;
  tuition: number;
  fullNeed: boolean;
  rank: number;
  deadline: string;
  verdict: Verdict;
  shortlisted: boolean;
}

/**
 * The verdict is the whole point of the list: a student needs to know whether a
 * university is a reach, a match or a safety *for them*, not just its rate.
 */
export const universities: Uni[] = [
  {
    id: "mit",
    name: "Massachusetts Institute of Technology",
    city: "Cambridge",
    country: "United States",
    acceptance: 0.04,
    sat: 1540,
    ielts: 7.5,
    tuition: 61990,
    fullNeed: true,
    rank: 1,
    deadline: "Jan 1",
    verdict: "reach",
    shortlisted: true,
  },
  {
    id: "nyuad",
    name: "NYU Abu Dhabi",
    city: "Abu Dhabi",
    country: "UAE",
    acceptance: 0.03,
    sat: 1480,
    ielts: 7.5,
    tuition: 58226,
    fullNeed: true,
    rank: 30,
    deadline: "Jan 5",
    verdict: "reach",
    shortlisted: true,
  },
  {
    id: "ku",
    name: "Koç University",
    city: "Istanbul",
    country: "Türkiye",
    acceptance: 0.28,
    sat: 1300,
    ielts: 6.5,
    tuition: 29500,
    fullNeed: false,
    rank: 401,
    deadline: "Mar 15",
    verdict: "match",
    shortlisted: true,
  },
  {
    id: "wiut",
    name: "Westminster International University",
    city: "Tashkent",
    country: "Uzbekistan",
    acceptance: 0.52,
    sat: 1150,
    ielts: 6.0,
    tuition: 6400,
    fullNeed: false,
    rank: 0,
    deadline: "Jun 30",
    verdict: "safety",
    shortlisted: false,
  },
];

export interface RoadmapItem {
  id: string;
  title: string;
  detail: string;
  due: string;
  done: boolean;
}

export const roadmap: RoadmapItem[] = [
  {
    id: "r1",
    title: "Sit a full timed mock",
    detail: "Both sections, one sitting, no pauses",
    due: "This week",
    done: true,
  },
  {
    id: "r2",
    title: "Review every wrong answer",
    detail: "Write the reason you missed it, not the correct letter",
    due: "This week",
    done: true,
  },
  {
    id: "r3",
    title: "Drill 40 algebra questions",
    detail: "Heart of Algebra is your weakest domain at 58%",
    due: "Sep 2",
    done: false,
  },
  {
    id: "r4",
    title: "Draft the personal statement",
    detail: "650 words, one story, no résumé in prose",
    due: "Sep 14",
    done: false,
  },
  {
    id: "r5",
    title: "Ask Ms. Karimova for a recommendation",
    detail: "Give her your résumé and four weeks",
    due: "Sep 20",
    done: false,
  },
];

export interface DomainScore {
  domain: string;
  accuracy: number;
  count: number;
}

export const domainScores: DomainScore[] = [
  { domain: "Craft and Structure", accuracy: 0.84, count: 38 },
  { domain: "Information and Ideas", accuracy: 0.76, count: 42 },
  { domain: "Standard English Conventions", accuracy: 0.71, count: 29 },
  { domain: "Algebra", accuracy: 0.58, count: 44 },
  { domain: "Advanced Math", accuracy: 0.52, count: 35 },
];

export interface Deadline {
  id: string;
  university: string;
  kind: string;
  date: string;
  daysLeft: number;
  documents: { done: number; total: number };
}

export const deadlines: Deadline[] = [
  {
    id: "d1",
    university: "NYU Abu Dhabi",
    kind: "Early Decision",
    date: "5 Jan",
    daysLeft: 12,
    documents: { done: 4, total: 6 },
  },
  {
    id: "d2",
    university: "MIT",
    kind: "Regular",
    date: "1 Jan",
    daysLeft: 8,
    documents: { done: 3, total: 6 },
  },
  {
    id: "d3",
    university: "Koç University",
    kind: "Regular",
    date: "15 Mar",
    daysLeft: 81,
    documents: { done: 6, total: 6 },
  },
];

export const testMeta = {
  title: "Digital SAT · Full practice test 4",
  module: "Section 1, Module 2",
  questionCount: 27,
  answered: 19,
  minutesLeft: 18,
  secondsLeft: 42,
  totalMinutes: 32,
} as const;

/** Currency and percentage helpers shared by all three directions. */
export function pct(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function usd(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}
