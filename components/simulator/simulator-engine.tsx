"use client";

/**
 * The Digital SAT simulator — a Bluebook-style test engine.
 *
 * Layout: a sticky header (module label, countdown, dictionary toggle, "Finish
 * section"), a split body (passage left / question right), and a sticky footer
 * (navigator, back/next). On phones the split becomes tabs, because two 50%
 * columns of prose on a 390px screen is unreadable.
 *
 * State lives here and flows down. Answers are also mirrored to the server on a
 * debounce, so closing the tab mid-module does not lose the work.
 *
 * What this component deliberately does **not** know: which answer is correct.
 * `SimulatorQuestion` carries no answer key, and grading happens in the
 * `submitAttempt` Server Action.
 *
 * MODULES
 * A full sitting is four timed modules with a break between the sections, and
 * this component renders **one** of them. Moving on is a server round trip:
 * `advanceModule` closes the module, starts the next one's clock, and the page
 * re-renders with the next module's questions. Keeping the transition on the
 * server is what makes the break real — the next clock starts when the student
 * says they are ready, not on a schedule the browser invented.
 *
 * The countdown here is a *rendering* of `module.deadlineMs`. The deadline
 * itself belongs to the server, which refuses answers past it; see the note at
 * the top of `lib/actions/attempts.ts`.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BilingualPassage } from "@/components/simulator/bilingual-passage";
import { DictionaryToggle } from "@/components/simulator/dictionary-toggle";
import { CountdownTimer } from "@/components/simulator/countdown-timer";
import { QuestionNavigator } from "@/components/simulator/question-navigator";
import { QuestionPane } from "@/components/simulator/question-pane";
import { Logo } from "@/components/brand/logo";
import { useT } from "@/components/i18n/lang-provider";
import {
  advanceModule,
  saveAttemptProgress,
  submitAttempt,
} from "@/lib/actions/attempts";
import { saveWord } from "@/lib/actions/words";
import { countTermsInPassage } from "@/lib/vocabulary";
import { formatDuration, testTypeLabel } from "@/lib/sat";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { SimulatorQuestion } from "@/lib/simulator";
import type { TestType } from "@/lib/generated/prisma/enums";

/** How long to wait after the last change before mirroring to the server. */
const AUTOSAVE_DEBOUNCE_MS = 1_500;

interface SimulatorEngineProps {
  attemptId: string;
  test: {
    id: string;
    title: string;
    type: TestType;
    durationMinutes: number;
  };
  /** The questions of the module currently open — not of the whole test. */
  questions: SimulatorQuestion[];
  /** Server-issued attempt start, in epoch ms — the timer's anchor. */
  startedAtMs: number;
  /**
   * Set on a full sitting. Absent on a single-module practice test, which has
   * one clock and no modules to advance through.
   */
  module?: {
    /** "Section 1, Module 2". */
    label: string;
    /** Epoch ms. Comes from the server's `moduleStartedAt + minutes`. */
    deadlineMs: number;
    hasNext: boolean;
    /** Minutes of break after this module. Zero when the next follows on. */
    breakMinutes: number;
  };
  /** Answers already saved for this attempt, when resuming. */
  initialAnswers: Record<string, string>;
  initialFlagged: string[];
}

export function SimulatorEngine({
  attemptId,
  test,
  questions,
  startedAtMs,
  module,
  initialAnswers,
  initialFlagged,
}: SimulatorEngineProps) {
  const { t } = useT();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] =
    React.useState<Record<string, string>>(initialAnswers);
  const [flagged, setFlagged] = React.useState<Set<string>>(
    () => new Set(initialFlagged),
  );
  /** Crossed-out option labels, per question id. */
  const [crossedOut, setCrossedOut] = React.useState<Record<string, string[]>>(
    {},
  );
  const [dictionaryEnabled, setDictionaryEnabled] = React.useState(false);
  const [isFinishOpen, setIsFinishOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  /** The module is over and the student is between modules. */
  const [isModuleOver, setIsModuleOver] = React.useState(false);

  const deadlineMs =
    module?.deadlineMs ?? startedAtMs + test.durationMinutes * 60_000;
  const currentQuestion = questions[currentIndex];
  const questionIds = React.useMemo(
    () => questions.map((question) => question.id),
    [questions],
  );

  const answeredCount = questionIds.filter((id) => Boolean(answers[id])).length;
  const unansweredCount = questions.length - answeredCount;

  // Read the passage into a local first: memoising on `currentQuestion?.passageText`
  // directly gives the React Compiler a narrower dependency than it infers,
  // which makes it bail out of optimising the whole component.
  const currentPassageText = currentQuestion?.passageText ?? null;

  const termCount = React.useMemo(
    () => (currentPassageText ? countTermsInPassage(currentPassageText) : 0),
    [currentPassageText],
  );

  /* ---------------------------------------------------------------------- */
  /* Submission                                                             */
  /* ---------------------------------------------------------------------- */

  /*
   * The timer's `onExpire` callback must stay referentially stable, or the
   * countdown's interval would be torn down and rebuilt on every answer. So
   * auto-submit reads the answers from a ref rather than from a closure.
   *
   * The ref is synced in an effect, never during render: writing to a ref while
   * rendering is unsafe under concurrent rendering, because a render can be
   * thrown away and the write would leak from an abandoned attempt.
   */
  const answersRef = React.useRef(answers);

  React.useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const flaggedRef = React.useRef(flagged);

  React.useEffect(() => {
    flaggedRef.current = flagged;
  }, [flagged]);

  const isSubmittingRef = React.useRef(false);

  const handleSubmit = React.useCallback(
    async (reason: "manual" | "expired") => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      if (reason === "expired") {
        toast.info(t.simulator.timeUp);
      }

      const result = await submitAttempt({
        attemptId,
        answers: answersRef.current,
      });

      if (result.ok && result.resultId) {
        // Replace, not push: the back button should not return to a test that
        // has already been graded.
        router.replace(`/practice/results/${result.resultId}`);
        return;
      }

      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setIsFinishOpen(false);
      toast.error(result.error ?? t.simulator.submitFailed);
    },
    /*
     * The dictionary strings are dependencies but not churn: they are plain
     * strings that only change when the student switches language, so this
     * callback keeps the referential stability the countdown's interval needs.
     */
    [attemptId, router, t.simulator.submitFailed, t.simulator.timeUp],
  );

  /**
   * Close this module.
   *
   * The answers are flushed first, deliberately: the autosave runs on a 1.5s
   * debounce, and a student who answers the last question and immediately hits
   * "finish" would otherwise lose it — the server grades what it stored, not
   * what the browser is holding.
   */
  const handleAdvance = React.useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    await saveAttemptProgress({
      attemptId,
      answers: answersRef.current,
      flagged: [...flaggedRef.current],
    });

    const result = await advanceModule(attemptId);

    if (!result.ok) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      toast.error(result.error ?? t.simulator.nextModuleFailed);
      return;
    }

    if (result.resultId) {
      router.replace(`/practice/results/${result.resultId}`);
      return;
    }

    // The page re-reads the attempt and renders the next module's questions.
    router.refresh();
  }, [attemptId, router, t.simulator.nextModuleFailed]);

  /**
   * Time is up, or the student says they are done.
   *
   * With a module still to come this ends the module rather than the sitting —
   * and when a break follows, the student sits on the break screen until they
   * choose to go on, which is when the next clock starts.
   */
  const handleFinishModule = React.useCallback(
    (reason: "manual" | "expired") => {
      if (!module?.hasNext) {
        void handleSubmit(reason);
        return;
      }

      setIsFinishOpen(false);

      if (module.breakMinutes > 0) {
        setIsModuleOver(true);
        return;
      }

      void handleAdvance();
    },
    [module, handleSubmit, handleAdvance],
  );

  const handleExpire = React.useCallback(() => {
    handleFinishModule("expired");
  }, [handleFinishModule]);

  /* ---------------------------------------------------------------------- */
  /* Autosave                                                               */
  /* ---------------------------------------------------------------------- */

  const hasMounted = React.useRef(false);

  React.useEffect(() => {
    // Skip the initial render: nothing has changed yet, and saving here would
    // write the same data we just read.
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (isSubmittingRef.current) return;

    const timeout = setTimeout(() => {
      void saveAttemptProgress({
        attemptId,
        answers,
        flagged: [...flagged],
      });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [answers, flagged, attemptId]);

  /* ---------------------------------------------------------------------- */
  /* Interaction handlers                                                   */
  /* ---------------------------------------------------------------------- */

  const goTo = React.useCallback(
    (index: number) => {
      setCurrentIndex(Math.min(Math.max(index, 0), questions.length - 1));
    },
    [questions.length],
  );

  function handleAnswer(value: string) {
    if (!currentQuestion) return;
    setAnswers((previous) => {
      // An empty value means "clear", so drop the key rather than storing "".
      if (value === "") {
        const next = { ...previous };
        delete next[currentQuestion.id];
        return next;
      }
      return { ...previous, [currentQuestion.id]: value };
    });
  }

  function handleToggleFlag() {
    if (!currentQuestion) return;
    setFlagged((previous) => {
      const next = new Set(previous);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  }

  function handleToggleCrossOut(label: string) {
    if (!currentQuestion) return;
    const questionId = currentQuestion.id;

    setCrossedOut((previous) => {
      const current = previous[questionId] ?? [];
      const isCrossed = current.includes(label);
      const next = isCrossed
        ? current.filter((item) => item !== label)
        : [...current, label];
      return { ...previous, [questionId]: next };
    });

    // Crossing out the selected option would leave two contradictory states, so
    // clear the selection.
    if (!crossedOut[questionId]?.includes(label) && answers[questionId] === label) {
      setAnswers((previous) => {
        const next = { ...previous };
        delete next[questionId];
        return next;
      });
    }
  }

  async function handleSaveWord(word: string) {
    const result = await saveWord(word);
    if (!result.ok) {
      toast.error(result.error ?? t.simulator.saveWordFailed);
      throw new Error(result.error ?? "save failed");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Keyboard shortcuts                                                     */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Never hijack keys while the student is typing an SPR answer.
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(currentIndex + 1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(currentIndex - 1);
        return;
      }

      // A–D (or a–d) selects the matching option.
      const question = questions[currentIndex];
      if (question?.format === "MULTIPLE_CHOICE") {
        const key = event.key.toUpperCase();
        const match = question.options.find((option) => option.label === key);
        if (match && !(crossedOut[question.id] ?? []).includes(match.label)) {
          event.preventDefault();
          setAnswers((previous) => ({ ...previous, [question.id]: match.label }));
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, goTo, questions, crossedOut]);

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  if (!currentQuestion) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">
          This test has no questions yet.
        </p>
      </div>
    );
  }

  const hasPassage = Boolean(currentQuestion.passageText);
  const crossedForCurrent = new Set(crossedOut[currentQuestion.id] ?? []);

  const passageNode = currentQuestion.passageText ? (
    <BilingualPassage
      text={currentQuestion.passageText}
      title={currentQuestion.passageTitle}
      enabled={dictionaryEnabled}
      onSaveWord={handleSaveWord}
    />
  ) : null;

  const questionNode = (
    <QuestionPane
      question={currentQuestion}
      questionNumber={currentIndex + 1}
      answer={answers[currentQuestion.id]}
      onAnswer={handleAnswer}
      isFlagged={flagged.has(currentQuestion.id)}
      onToggleFlag={handleToggleFlag}
      crossedOut={crossedForCurrent}
      onToggleCrossOut={handleToggleCrossOut}
    />
  );

  if (isModuleOver && module) {
    return (
      <BreakScreen
        minutes={module.breakMinutes}
        isPending={isSubmitting}
        onContinue={() => void handleAdvance()}
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                           */}
      {/* ---------------------------------------------------------------- */}
      <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Logo compact className="hidden sm:inline-flex" />
          {/*
            AT 320px THE LABEL WRAPS INSTEAD OF TRUNCATING.
            *
            Four things share this row and this group is the only `min-w-0`, so
            it absorbs all the compression: at 320px it gets 86px, and
            "Section 1, Module 1" lost 29% of itself — "Section 1, Mod…". At
            360px and above nothing truncates at all, so this is a 320px-only
            problem and gets a 320px-only answer.

            Below `sm` the module label wraps to two lines and the test-type
            line is hidden, which keeps the header exactly as tall as it was
            (two lines either way) while showing the label in full. From `sm`
            up, the original behaviour is untouched.
          */}
          <div className="min-w-0">
            <p className="text-sm leading-tight font-medium sm:truncate sm:leading-normal">
              {module?.label ??
                (currentQuestion.module === "MODULE_2"
                  ? t.simulator.module2
                  : t.simulator.module1)}
            </p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {testTypeLabel(test.type, t)}
            </p>
          </div>
        </div>

        <CountdownTimer deadlineMs={deadlineMs} onExpire={handleExpire} />

        <div className="flex items-center gap-2">
          {hasPassage && (
            <DictionaryToggle
              enabled={dictionaryEnabled}
              onChange={setDictionaryEnabled}
              termCount={termCount}
            />
          )}

          <Button
            variant="outline"
            size="lg"
            className="h-9 shrink-0"
            onClick={() => setIsFinishOpen(true)}
          >
            <span className="hidden sm:inline">
              {module?.hasNext ? t.simulator.finishModule : t.simulator.finishSection}
            </span>
            <span className="sm:hidden">{t.simulator.finishShort}</span>
          </Button>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Body — split on desktop, tabbed on mobile                        */}
      {/* ---------------------------------------------------------------- */}
      <div className="min-h-0 flex-1">
        {hasPassage ? (
          <>
            {/* Desktop / tablet split view */}
            <div className="hidden h-full md:grid md:grid-cols-2">
              <section
                className="h-full overflow-y-auto border-r border-border px-6 py-8 lg:px-10"
                aria-label={t.simulator.passageLabel}
              >
                {passageNode}
              </section>

              <section
                className="h-full overflow-y-auto px-6 py-8 lg:px-10"
                aria-label={t.simulator.questionLabel}
              >
                <AnimatedQuestion index={currentIndex} reduce={reduce}>
                  {questionNode}
                </AnimatedQuestion>
              </section>
            </div>

            {/* Mobile tabs */}
            <Tabs
              defaultValue="question"
              className="flex h-full flex-col md:hidden"
            >
              <TabsList className="mx-3 mt-3 grid shrink-0 grid-cols-2">
                <TabsTrigger value="passage">Passage</TabsTrigger>
                <TabsTrigger value="question">Question</TabsTrigger>
              </TabsList>

              <TabsContent
                value="passage"
                className="min-h-0 flex-1 overflow-y-auto px-4 py-5"
              >
                {passageNode}
              </TabsContent>

              <TabsContent
                value="question"
                className="min-h-0 flex-1 overflow-y-auto px-4 py-5"
              >
                {questionNode}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          /* No passage (typical for Math) — one centred column */
          <section
            className="h-full overflow-y-auto px-4 py-8 sm:px-6 lg:px-10"
            aria-label={t.simulator.questionLabel}
          >
            <AnimatedQuestion index={currentIndex} reduce={reduce}>
              {questionNode}
            </AnimatedQuestion>
          </section>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Footer                                                           */}
      {/* ---------------------------------------------------------------- */}
      <footer className="z-30 flex shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-3 py-2.5 sm:px-4">
        <p className="hidden text-xs text-muted-foreground sm:block">
          {answeredCount} of {questions.length} answered
        </p>

        <QuestionNavigator
          questionIds={questionIds}
          answers={answers}
          flagged={flagged}
          currentIndex={currentIndex}
          onJump={goTo}
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-9"
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              size="lg"
              className="h-9"
              onClick={() => setIsFinishOpen(true)}
            >
              Review &amp; finish
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-9"
              onClick={() => goTo(currentIndex + 1)}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </footer>

      {/* ---------------------------------------------------------------- */}
      {/* Finish confirmation                                              */}
      {/* ---------------------------------------------------------------- */}
      <Dialog open={isFinishOpen} onOpenChange={setIsFinishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {module?.hasNext ? t.simulator.finishModuleTitle : t.simulator.finishSectionTitle}
            </DialogTitle>
            <DialogDescription>
              {unansweredCount > 0
                ? `${unansweredCount} question${unansweredCount === 1 ? "" : "s"} ${unansweredCount === 1 ? "is" : "are"} still blank. Blank answers are marked incorrect.`
                : module?.hasNext
                  ? t.simulator.finishAllModule
                  : t.simulator.finishAllSection}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-2 text-center">
            {[
              { label: t.simulator.statAnswered, value: answeredCount },
              { label: t.simulator.statBlank, value: unansweredCount },
              { label: t.simulator.statFlagged, value: flagged.size },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border p-3"
              >
                <p className="text-xl font-semibold tnum">{stat.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="lg"
              className="h-10"
              onClick={() => setIsFinishOpen(false)}
              disabled={isSubmitting}
            >
              {t.simulator.cancel}
            </Button>
            <Button
              size="lg"
              className="h-10"
              onClick={() => handleFinishModule("manual")}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting
                ? module?.hasNext
                  ? t.simulator.closing
                  : t.simulator.scoring
                : module?.hasNext
                  ? t.simulator.finishModule
                  : t.simulator.submitSection}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Cross-fades the question pane when the question changes, so moving between
 * questions is a transition rather than a jump. Keyed on the index; the passage
 * pane is intentionally left static, since it often does not change between
 * consecutive questions.
 */
function AnimatedQuestion({
  index,
  reduce,
  children,
}: {
  index: number;
  reduce: boolean | null;
  children: React.ReactNode;
}) {
  if (reduce) return <>{children}</>;

  /*
   * Keyed on the question index so React remounts the pane on every move, which
   * replays the CSS entrance. No exit animation: the outgoing question is gone
   * the moment the student presses Next, and holding it on screen would delay
   * the only interaction that matters in a timed module.
   */
  return (
    <div
      key={index}
      className={cn("h-full animate-in fade-in slide-in-from-right-3 duration-200")}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The break                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The break between the two sections.
 *
 * The countdown here is **informational**. Nothing expires while it runs and
 * nothing is being marked: the next module's clock does not start until the
 * student presses the button, which is the whole reason the transition is a
 * server call rather than a timer. A student who needs twelve minutes takes
 * twelve minutes and still gets a full Math module.
 */
function BreakScreen({
  minutes,
  isPending,
  onContinue,
}: {
  minutes: number;
  isPending: boolean;
  onContinue: () => void;
}) {
  const { t } = useT();
  const [secondsLeft, setSecondsLeft] = React.useState(minutes * 60);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
    }, 1_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <Logo />

      <h1 className="mt-10 text-3xl font-extrabold tracking-tightest sm:text-4xl">
        {t.simulator.breakTitle}
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        {t.simulator.breakBody}
      </p>

      <p className="mt-10 font-mono text-6xl font-semibold tabular-nums">
        {formatDuration(secondsLeft)}
      </p>

      <Button
        size="lg"
        className="mt-10 h-12 px-8 shadow-glow"
        disabled={isPending}
        onClick={onContinue}
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {isPending ? t.simulator.breakStarting : t.simulator.breakStart}
      </Button>
    </div>
  );
}
