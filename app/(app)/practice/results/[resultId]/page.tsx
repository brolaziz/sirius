/**
 * Results & answer review.
 *
 * This is the first page in the app where it is safe to reveal `correctAnswer`
 * and `explanation`: the attempt is graded and closed, so there is nothing left
 * to cheat at.
 *
 * Ownership is enforced in the query (`id` **and** `userId`), so pasting
 * someone else's result id returns a 404 rather than their scores.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Minus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";
import { formatDuration, testTypeLabel } from "@/lib/sat";
import { parseQuestionOptions } from "@/lib/simulator";
import { cn } from "@/lib/utils";
import { questionIdsFrom } from "@/lib/attempt-questions";
import { fill } from "@/lib/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLang());
  return { title: t.practice.resultsTitle };
}

/** One question's outcome, as stored in `TestResult.answersRecord`. */
interface AnswerRecord {
  answer: string | null;
  correct: boolean;
}

function asAnswerRecords(value: unknown): Record<string, AnswerRecord> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, AnswerRecord> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    result[key] = {
      answer: typeof record.answer === "string" ? record.answer : null,
      correct: record.correct === true,
    };
  }
  return result;
}

export default async function ResultsPage({
  params,
}: PageProps<"/practice/results/[resultId]">) {
  const { resultId } = await params;

  if (!isDatabaseConfigured()) notFound();

  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const t = getDictionary(await getLang());

  const result = await prisma.testResult.findFirst({
    // Scoping by owner here is what prevents reading another student's result.
    where: { id: resultId, userId },
    include: {
      test: {
        select: {
          title: true,
          type: true,
        },
      },
    },
  });

  if (!result) notFound();

  const records = asAnswerRecords(result.answersRecord);

  /*
   * Only the questions this sitting actually asked. A full test assembled from
   * a partial bank leaves whole modules out, and showing those questions as
   * "blank, incorrect" would misreport the sitting.
   */
  const savedOrder = questionIdsFrom(result.questionIds);
  const ids = savedOrder.length ? savedOrder : Object.keys(records);
  const reviewRows = await prisma.question.findMany({
    where: { id: { in: ids } },
    select: { id: true, order: true, questionText: true, format: true, options: true,
      correctAnswer: true, acceptedAnswers: true, explanation: true, domain: true, passageText: true, passageTitle: true },
  });
  const byId = new Map(reviewRows.map((q) => [q.id, q]));
  const reviewed = ids.flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
  const accuracy =
    result.totalQuestions > 0 ? result.score / result.totalQuestions : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/practice">
            <ArrowLeft className="size-4" />
            {t.practice.practiceTitle}
          </Link>
        </Button>

        <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold tracking-tightest text-balance sm:text-5xl">
          {result.test.title}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          {testTypeLabel(result.test.type, t)}
          {result.durationSeconds
            ? ` · ${fill(t.review.finishedIn, { time: formatDuration(result.durationSeconds) })}`
            : ""}
        </p>
      </div>

      {/* Score summary */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-brand-500 p-6 text-white shadow-card sm:col-span-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute inset-0 bg-dots-light" />
          </div>

          <div className="relative">
            <p className="text-sm text-white/85">{t.review.estimated}</p>
            <p className="mt-3 text-5xl leading-none font-extrabold tracking-tightest tnum">
              <AnimatedNumber value={result.scaledScore ?? 0} />
            </p>
            <p className="mt-3 text-xs leading-relaxed text-white/75">
              {t.review.estimateHelp}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-card">
          <p className="text-sm text-muted-foreground">{t.dash.raw}</p>
          <p className="mt-3 text-5xl leading-none font-extrabold tracking-tightest tnum">
            {result.score}
            <span className="text-2xl text-muted-foreground">
              /{result.totalQuestions}
            </span>
          </p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-card">
          <p className="text-sm text-muted-foreground">{t.dash.accuracy}</p>
          <p
            className={cn(
              "mt-3 text-5xl leading-none font-extrabold tracking-tightest tnum",
              accuracy >= 0.75
                ? "text-viz-emerald"
                : accuracy >= 0.55
                  ? "text-viz-amber"
                  : "text-viz-rose",
            )}
          >
            <AnimatedNumber value={accuracy * 100} suffix="%" />
          </p>
        </div>
      </div>

      {/* Section scores — a full sitting only. */}
      {(result.rwScore !== null || result.mathScore !== null) && (
        <section className="grid gap-5 sm:grid-cols-2">
          <SectionScore label={t.simulator.typeReading} value={result.rwScore} empty={t.review.sectionMissing} />
          <SectionScore label={t.simulator.typeMath} value={result.mathScore} empty={t.review.sectionMissing} />
        </section>
      )}

      {/* Answer review */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t.pages.resultsReview}
        </h2>

        {reviewed.length < ids.length && <p className="mt-3 text-sm text-muted-foreground">{fill(t.review.missingQuestions, { count: ids.length - reviewed.length })}</p>}

        <StaggerGroup immediate pace="tight" className="mt-5 space-y-4">
          {reviewed.map((question, index) => {
            const record = records[question.id];
            const options = parseQuestionOptions(question.options);
            const submitted = record?.answer ?? null;
            const isCorrect = record?.correct ?? false;
            const isBlank = submitted === null || submitted === "";

            return (
              <StaggerItem key={question.id}>
                <article className="rounded-2xl bg-card p-6 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold tnum",
                          isCorrect
                            ? "bg-success/15 text-success"
                            : isBlank
                              ? "bg-muted text-muted-foreground"
                              : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {index + 1}
                      </span>

                      <Badge
                        variant="secondary"
                        className={cn(
                          isCorrect && "bg-success/15 text-success",
                          !isCorrect && !isBlank && "bg-destructive/10 text-destructive",
                        )}
                      >
                        {isCorrect ? (
                          <>
                            <Check className="size-3" />
                            {t.review.correct}
                          </>
                        ) : isBlank ? (
                          <>
                            <Minus className="size-3" />
                            {t.review.blank}
                          </>
                        ) : (
                          <>
                            <X className="size-3" />
                            {t.review.incorrect}
                          </>
                        )}
                      </Badge>
                    </div>

                    {question.domain && (
                      <span className="text-xs text-muted-foreground">
                        {question.domain}
                      </span>
                    )}
                  </div>

                  {question.passageText && <blockquote className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
                    {question.passageTitle && <p className="mb-2 font-semibold">{question.passageTitle}</p>}
                    {question.passageText}
                  </blockquote>}
                  <p className="mt-4 text-sm leading-relaxed font-medium">
                    {question.questionText}
                  </p>

                  {options.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {options.map((option) => {
                        const isAnswerKey =
                          option.label.toLowerCase() ===
                          question.correctAnswer.trim().toLowerCase();
                        const isChosen =
                          submitted?.toLowerCase() === option.label.toLowerCase();

                        return (
                          <li
                            key={option.label}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-3 text-sm",
                              isAnswerKey
                                ? "border-success/40 bg-success/5"
                                : isChosen
                                  ? "border-destructive/40 bg-destructive/5"
                                  : "border-border",
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                                isAnswerKey
                                  ? "bg-success text-background"
                                  : isChosen
                                    ? "bg-destructive text-background"
                                    : "text-muted-foreground ring-1 ring-border",
                              )}
                            >
                              {option.label}
                            </span>

                            <span className="min-w-0 flex-1 break-words leading-relaxed">{option.text}</span>

                            {isChosen && (
                              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                                {t.review.yourAnswer}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    /* SPR question — compare the typed values */
                    <div className="mt-4 flex flex-wrap gap-6 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t.review.yourAnswer}
                        </p>
                        <p
                          className={cn(
                            "mt-1 font-medium tnum",
                            isCorrect ? "text-success" : "text-destructive",
                          )}
                        >
                          {isBlank ? "—" : submitted}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t.review.acceptedAnswer}
                        </p>
                        <p className="mt-1 font-medium tnum">
                          {[...new Set([question.correctAnswer, ...question.acceptedAnswers].flatMap((value) => value.split("|")))].join(` ${t.review.or} `)}
                        </p>
                      </div>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="mt-4 rounded-lg bg-muted/50 p-3.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t.review.why}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                  {!question.explanation && <p className="mt-4 text-xs text-muted-foreground">{t.review.explanationMissing}</p>}
                </article>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>
    </div>
  );
}

/**
 * One section's scaled score.
 *
 * A section the sitting did not cover shows as absent rather than as 200 — the
 * bank cannot fill four modules yet, and a missing half of the exam must not
 * read as a bad half.
 */
function SectionScore({ label, value, empty }: { label: string; value: number | null; empty: string }) {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      {value === null ? (
        <p className="mt-3 text-lg font-medium text-muted-foreground">
          {empty}
        </p>
      ) : (
        <p className="mt-3 text-4xl leading-none font-extrabold tracking-tightest tnum">
          {value}
          <span className="text-xl text-muted-foreground">/800</span>
        </p>
      )}
    </div>
  );
}
