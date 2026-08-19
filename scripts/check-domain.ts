/**
 * Domain logic checks — run with `npm run check`.
 *
 * These cover the two parts of Sirius whose bugs would be quietest:
 *
 *   1. The passage tokeniser. If it ever corrupts passage text or drops a
 *      character, students read a subtly wrong passage and nobody notices. The
 *      round-trip assertion below is the guard: re-joining every token must
 *      reproduce the input byte for byte.
 *   2. Grading and score estimation. An off-by-one here silently misreports
 *      every score in the product.
 *
 * Deliberately dependency-free — plain assertions and a non-zero exit code, no
 * test framework to install or configure. Swap in Vitest if the suite grows.
 */

import { tokenizePassage, lookupWord, countTermsInPassage, splitParagraphs } from "@/lib/vocabulary";
import { gradeAttempt, estimateScaledScore, isAnswerCorrect, normaliseAnswer, formatDuration } from "@/lib/sat";

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       expected ${e}\n       actual   ${a}`); }
}

console.log("\nDictionary — inflection matching");
check("scrutinized -> scrutinize", lookupWord("scrutinized")?.word, "scrutinize");
check("British scrutinising", lookupWord("scrutinising")?.word, "scrutinize");
check("Capitalised Ubiquitous", lookupWord("Ubiquitous")?.word, "ubiquitous");
check("possessive paradigm's", lookupWord("paradigm's")?.word, "paradigm");
check("plural nuances", lookupWord("nuances")?.word, "nuance");
check("unknown word", lookupWord("elephant"), undefined);

console.log("\nTokenizer — lossless round-trip (critical: passage text must never be corrupted)");
const passage = "Plastic is ubiquitous. Researchers scrutinized the tenuous, empirical data — a paradigm shift?";
const tokens = tokenizePassage(passage);
check("round-trips exactly", tokens.map(t => t.value).join(""), passage);
check("terms found", tokens.filter(t => t.kind === "term").map(t => t.value),
  ["ubiquitous", "scrutinized", "tenuous", "empirical", "paradigm"]);
check("distinct term count", countTermsInPassage(passage), 5);
check("paragraph split", splitParagraphs("one\n\n\ntwo").length, 2);

console.log("\nTokenizer — XSS safety (no HTML is produced; text stays data)");
const evil = 'ubiquitous <script>alert("x")</script>';
const evilTokens = tokenizePassage(evil);
check("script tag preserved verbatim as text, not markup", evilTokens.map(t => t.value).join(""), evil);
check("no token is a term inside the tag", evilTokens.filter(t => t.kind === "term").map(t => t.value), ["ubiquitous"]);

console.log("\nAnswer normalisation");
check("case-insensitive label", isAnswerCorrect("b", "B"), true);
check("blank is incorrect", isAnswerCorrect(null, "B"), false);
check("empty is incorrect", isAnswerCorrect("", "B"), false);
check("alternatives via pipe: 0.75", isAnswerCorrect("0.75", "3/4|0.75"), true);
check("alternatives via pipe: 3/4", isAnswerCorrect("3/4", "3/4|0.75"), true);
check("wrong SPR value", isAnswerCorrect("0.8", "3/4|0.75"), false);
check("unicode minus normalised", normaliseAnswer("−5"), "-5");
check("leading plus stripped", normaliseAnswer("+5"), "5");

console.log("\nGrading & score estimate");
const qs = [
  { id: "a", correctAnswer: "A" },
  { id: "b", correctAnswer: "B" },
  { id: "c", correctAnswer: "C" },
  { id: "d", correctAnswer: "D" },
];
const graded = gradeAttempt(qs, { a: "A", b: "B", c: "X" }, "READING");
check("score counts only correct", graded.score, 2);
check("total is question count", graded.totalQuestions, 4);
check("accuracy", graded.accuracy, 0.5);
check("breakdown records blank as null", graded.breakdown.d, { answer: null, correct: false });
check("breakdown records wrong answer", graded.breakdown.c, { answer: "X", correct: false });
check("section floor at 0%", estimateScaledScore(0, 27, "READING"), 200);
check("section ceiling at 100%", estimateScaledScore(27, 27, "READING"), 800);
check("full-test floor", estimateScaledScore(0, 54, "FULL"), 400);
check("full-test ceiling", estimateScaledScore(54, 54, "FULL"), 1600);
check("rounds to nearest 10", estimateScaledScore(1, 3, "FULL") % 10, 0);
check("no divide-by-zero on empty test", estimateScaledScore(0, 0, "FULL"), 400);

console.log("\nTimer formatting");
check("32 minutes", formatDuration(1920), "32:00");
check("under a minute", formatDuration(9), "00:09");
check("negative clamps to zero", formatDuration(-5), "00:00");
check("over an hour", formatDuration(3725), "1:02:05");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
