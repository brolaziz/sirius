"use client";

/**
 * Practice mode: one question at a time, marked the moment it is answered.
 *
 * WHAT MAKES THIS DIFFERENT FROM THE SIMULATOR
 * The simulator is an exam: a countdown, answers you can change, and a verdict
 * only at the end. This is the opposite in every one of those respects, because
 * it is for learning rather than for measuring. The clock counts up and can be
 * ignored, the answer is final once submitted, and the explanation appears
 * immediately — the moment a student most wants to know why they were wrong is
 * the moment they find out they were.
 *
 * The answer key arrives with the verdict and never before it: the server
 * returns `correctAnswer` and `explanation` in the response to the answer.
 * Nothing about an unanswered question is in the browser.
 *
 * The reading passage reuses `BilingualPassage`, so tapping an unfamiliar word
 * in practice does exactly what it does in a test — including saving it to the
 * word bank.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, Flag, X } from "lucide-react";
import { toast } from "sonner";

import { BilingualPassage } from "@/components/simulator/bilingual-passage";
import { DictionaryToggle } from "@/components/simulator/dictionary-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { formatDuration } from "@/lib/sat";
import { summarisePractice } from "@/lib/practice";
import {
  answerPracticeQuestion,
  finishPracticeSession,
} from "@/lib/actions/practice";
import { saveWord } from "@/lib/actions/words";
import { cn } from "@/lib/utils";
import type {
  PracticeFeedback,
  PracticeSessionView,
} from "@/lib/queries/practice";

export function PracticeRunner({
  session,
  skillLabel,
}: {
  session: PracticeSessionView;
  /** Already resolved to the interface language by the page. */
  skillLabel: string;
}) {
  const { t } = useT();
  const router = useRouter();

  const [feedback, setFeedback] = React.useState<
    Record<string, PracticeFeedback>
  >(session.feedback);
  const [finished, setFinished] = React.useState(session.completedAt !== null);
  const [index, setIndex] = React.useState(() =>
    firstUnanswered(session.questions, session.feedback),
  );
  const [draft, setDraft] = React.useState("");
  const [dictionaryEnabled, setDictionaryEnabled] = React.useState(true);
  const [isPending, startTransition] = React.useTransition();

  const question = session.questions[index];
  const current = question ? feedback[question.id] : undefined;
  const answered = Object.keys(feedback).length;
  const total = session.questions.length;

  /* The clock counts up and is never enforced — see the note at the top. */
  const startedRef = React.useRef<number>(0);

  async function handleSaveWord(word: string) {
    const result = await saveWord(word);
    if (!result.ok) {
      toast.error(result.error ?? "Could not save that word.");
      throw new Error(result.error ?? "save failed");
    }
  }

  function submit() {
    if (!question || draft.trim() === "") return;

    const spent = Math.min(
      3_600,
      Math.max(0, Math.round((Date.now() - startedRef.current) / 1000)),
    );

    startTransition(async () => {
      const result = await answerPracticeQuestion({
        sessionId: session.id,
        questionId: question.id,
        answer: draft.trim(),
        timeSpentSeconds: spent,
      });

      if (!result.ok || result.isCorrect === undefined) {
        toast.error(result.error ?? t.practice.answerFailed);
        return;
      }

      setFeedback((previous) => ({
        ...previous,
        [question.id]: {
          answer: draft.trim(),
          isCorrect: result.isCorrect ?? false,
          timeSpentSeconds: spent,
          correctAnswer: result.correctAnswer ?? "",
          explanation: result.explanation ?? null,
        },
      }));
    });
  }

  function next() {
    setDraft("");
    setIndex((previous) => Math.min(previous + 1, total - 1));
  }

  function finish() {
    startTransition(async () => {
      const result = await finishPracticeSession(session.id);
      if (!result.ok) {
        toast.error(result.error ?? t.practice.answerFailed);
        return;
      }

      setFinished(true);
      router.refresh();
    });
  }

  if (finished || total === 0) {
    return (
      <Summary
        session={session}
        feedback={feedback}
        skillLabel={skillLabel}
        t={t}
      />
    );
  }

  const isLast = index === total - 1;
  const everythingAnswered = answered >= total;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {session.domainName}
          </p>
          <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tightest">
            {skillLabel}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!current && (
            /*
             * Keyed by question, so moving on remounts it and the clock starts
             * from zero — rather than the parent resetting a counter inside an
             * effect, which is a cascading render React rightly complains about.
             */
            <Stopwatch key={index} startedAtRef={startedRef} />
          )}
          {question?.passageText && (
            <DictionaryToggle
              enabled={dictionaryEnabled}
              onChange={setDictionaryEnabled}
            />
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <Progress value={(answered / total) * 100} className="h-1.5" />
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {fill(t.practice.questionOf, { current: index + 1, total })}
        </span>
      </div>

      {/* Passage */}
      {question?.passageText && (
        <div className="mt-6 rounded-2xl bg-card p-6 shadow-card sm:p-7">
          <BilingualPassage
            text={question.passageText}
            title={question.passageTitle}
            enabled={dictionaryEnabled}
            onSaveWord={handleSaveWord}
          />
        </div>
      )}

      {/* Question */}
      {question && (
        <div className="mt-5 rounded-2xl bg-card p-6 shadow-card sm:p-7">
          <p className="text-base leading-relaxed font-medium text-pretty">
            {question.questionText}
          </p>

          {question.format === "MULTIPLE_CHOICE" ? (
            <div
              role="radiogroup"
              aria-label={question.questionText}
              className="mt-6 space-y-2.5"
            >
              {question.options.map((option) => {
                const chosen = current
                  ? current.answer === option.label
                  : draft === option.label;
                const isKey =
                  current !== undefined &&
                  current.correctAnswer.toLowerCase() ===
                    option.label.toLowerCase();

                return (
                  <button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={chosen}
                    disabled={current !== undefined || isPending}
                    onClick={() => setDraft(option.label)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-[background-color,border-color,transform] duration-200",
                      optionTone({ chosen, isKey, marked: current !== undefined }),
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        chosen
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground ring-1 ring-border",
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="text-sm leading-relaxed">{option.text}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 max-w-xs space-y-2">
              <label
                htmlFor="practice-answer"
                className="text-sm font-medium text-muted-foreground"
              >
                {t.practice.answerLabel}
              </label>
              <Input
                id="practice-answer"
                value={current ? (current.answer ?? "") : draft}
                disabled={current !== undefined || isPending}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
                className="h-12 text-lg tabular-nums"
                autoComplete="off"
              />
            </div>
          )}

          {/* Verdict */}
          {current && (
            <div
              className={cn(
                "mt-6 rounded-xl p-4",
                current.isCorrect ? "bg-viz-emerald-soft" : "bg-viz-rose-soft",
              )}
            >
              <p
                className={cn(
                  "flex items-center gap-2 text-sm font-semibold",
                  current.isCorrect ? "text-viz-emerald" : "text-viz-rose",
                )}
              >
                {current.isCorrect ? (
                  <Check className="size-4" />
                ) : (
                  <X className="size-4" />
                )}
                {current.isCorrect ? t.practice.correct : t.practice.incorrect}
              </p>

              {!current.isCorrect && (
                <p className="mt-2 text-sm text-foreground">
                  {fill(t.practice.correctAnswerIs, {
                    answer: current.correctAnswer,
                  })}
                </p>
              )}

              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                {current.explanation ?? t.practice.noExplanation}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!current ? (
              <Button
                type="button"
                size="lg"
                className="h-11 shadow-glow"
                disabled={isPending || draft.trim() === ""}
                onClick={submit}
              >
                {t.practice.check}
              </Button>
            ) : isLast || everythingAnswered ? (
              <Button
                type="button"
                size="lg"
                className="h-11 shadow-glow"
                disabled={isPending}
                onClick={finish}
              >
                <Flag className="size-4" />
                {isPending ? t.practice.finishing : t.practice.finish}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="h-11 shadow-glow"
                disabled={isPending}
                onClick={next}
              >
                {t.practice.next}
                <ArrowRight className="size-4" />
              </Button>
            )}

            <Button asChild variant="ghost" className="h-11">
              <Link href="/practice">{t.practice.backToPractice}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The clock                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Counts up from the moment it mounts, and writes that moment into the ref the
 * runner reads when the answer is submitted.
 *
 * It owns its own state so that starting a new question is a remount rather
 * than a reset: nothing in the parent has to be set back to zero, which is what
 * keeps the effect free of `setState` calls in its body.
 */
function Stopwatch({
  startedAtRef,
}: {
  startedAtRef: React.RefObject<number>;
}) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    startedAtRef.current = Date.now();

    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAtRef]);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground tabular-nums">
      <Clock className="size-3.5" />
      {formatDuration(elapsed)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                     */
/* -------------------------------------------------------------------------- */

function Summary({
  session,
  feedback,
  skillLabel,
  t,
}: {
  session: PracticeSessionView;
  feedback: Record<string, PracticeFeedback>;
  skillLabel: string;
  t: ReturnType<typeof useT>["t"];
}) {
  const answers = session.questions.flatMap((question) => {
    const entry = feedback[question.id];
    return entry ? [entry] : [];
  });

  const summary = summarisePractice(answers);
  const percent = Math.round(summary.accuracy * 100);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="text-sm font-medium text-muted-foreground">
        {session.domainName}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tightest text-balance">
        {t.practice.summaryTitle}
      </h1>
      <p className="mt-2 text-base text-muted-foreground">{skillLabel}</p>

      <div className="mt-8 rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <p className="text-4xl font-extrabold tracking-tightest tabular-nums">
          {summary.correct} / {summary.answered}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {fill(t.practice.summaryAccuracy, { count: percent })}
          {summary.answered > 0 &&
            ` · ${fill(t.practice.summaryTime, { count: summary.averageSeconds })}`}
        </p>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              percent >= 70 ? "bg-viz-emerald" : "bg-viz-amber",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        {summary.answered > 0 && (
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            {percent >= 70
              ? t.practice.summaryStrong
              : fill(t.practice.summaryWeak, { skill: skillLabel })}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-11 shadow-glow">
            <Link href="/practice">{t.practice.backToPractice}</Link>
          </Button>
          {session.planTaskId && (
            <Button asChild variant="outline" size="lg" className="h-11">
              <Link href="/plan">{t.practice.backToPlan}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function firstUnanswered(
  questions: PracticeSessionView["questions"],
  feedback: Record<string, PracticeFeedback>,
): number {
  const index = questions.findIndex((question) => !feedback[question.id]);
  return index === -1 ? Math.max(questions.length - 1, 0) : index;
}

/** Option colours: neutral while answering, verdict colours once marked. */
function optionTone({
  chosen,
  isKey,
  marked,
}: {
  chosen: boolean;
  isKey: boolean;
  marked: boolean;
}): string {
  if (!marked) {
    return chosen
      ? "border-primary bg-brand-50/70 ring-1 ring-primary/20"
      : "border-border bg-card hover:border-brand-300 hover:bg-brand-50/40";
  }

  if (isKey) return "border-viz-emerald bg-viz-emerald-soft";
  if (chosen) return "border-viz-rose bg-viz-rose-soft";
  return "border-border bg-card opacity-60";
}
