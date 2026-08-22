"use client";

/**
 * The five questions a new account answers before anything else.
 *
 * WHY EACH STEP SAVES ON ITS OWN
 * This form stands between a new student and the entire product, and it is the
 * first thing they ever do here. A form that loses four answers because a phone
 * locked is a form nobody comes back to — so every step writes its own column
 * the moment it is answered, and reopening the page resumes at the first
 * unanswered question rather than at the beginning.
 *
 * WHY THE RULES ARE IMPORTED RATHER THAN RETYPED
 * `lib/validation/onboarding.ts` is the same module the Server Action uses. The
 * copy here exists to put a message next to the field before a round trip; it
 * is a courtesy, and the action re-checks everything regardless.
 *
 * The step swap animates over 0.35s rather than the 0.9–1.3s an entrance takes:
 * this is a control responding to a click, not a page arriving.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { DUR, EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { TOTAL_SCORE_MAX, TOTAL_SCORE_MIN } from "@/lib/sat";
import { completeOnboarding, saveOnboardingStep } from "@/lib/actions/onboarding";
import {
  ONBOARDING_STEPS,
  examDateSchema,
  maxExamIsoDate,
  satScoreSchema,
  targetScoreProblem,
  todayIsoDate,
  type OnboardingStep,
} from "@/lib/validation/onboarding";
import { cn } from "@/lib/utils";
import type { OnboardingState } from "@/lib/queries/study-plan";
import type { GradeLevel, StudyPriority } from "@/lib/generated/prisma/enums";

interface Answers {
  gradeLevel: GradeLevel | null;
  currentScore: number | null;
  targetScore: number | null;
  examDate: string;
  priority: StudyPriority | null;
}

export function OnboardingFlow({ initial }: { initial: OnboardingState }) {
  const { t } = useT();
  const router = useRouter();

  const [answers, setAnswers] = React.useState<Answers>({
    gradeLevel: initial.gradeLevel,
    currentScore: initial.currentScore,
    targetScore: initial.targetScore,
    examDate: initial.examDate ?? "",
    priority: initial.priority,
  });

  const [index, setIndex] = React.useState(() => resumeIndex(initial));
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  /* Draft text for the two numeric fields, so a half-typed "12" is not a score. */
  const [currentDraft, setCurrentDraft] = React.useState(
    initial.currentScore === null ? "" : String(initial.currentScore),
  );
  const [targetDraft, setTargetDraft] = React.useState(
    initial.targetScore === null ? "" : String(initial.targetScore),
  );

  const step = ONBOARDING_STEPS[index];
  const stageRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        stageRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: DUR.fast, ease: EASE },
      );
    },
    { dependencies: [index], scope: stageRef },
  );

  function go(next: number) {
    setError(null);
    setIndex(Math.min(Math.max(next, 0), ONBOARDING_STEPS.length - 1));
  }

  /** Validate the visible step, save it, then move on. */
  function submitStep(payload: SaveInput, options?: { finish?: boolean }) {
    const problem = validate(payload, answers);
    if (problem) {
      setError(problem);
      return;
    }

    startTransition(async () => {
      const saved = await saveOnboardingStep(payload);
      if (!saved.ok) {
        setError(saved.error ?? t.onboarding.failed);
        if (saved.step) setIndex(ONBOARDING_STEPS.indexOf(saved.step));
        return;
      }

      setAnswers((current) => applyPayload(current, payload));

      if (!options?.finish) {
        go(index + 1);
        return;
      }

      const done = await completeOnboarding();
      if (!done.ok) {
        setError(done.error ?? t.onboarding.failed);
        if (done.step) setIndex(ONBOARDING_STEPS.indexOf(done.step));
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    });
  }

  const isLast = index === ONBOARDING_STEPS.length - 1;

  return (
    <div className="mx-auto w-full max-w-xl">
      <p className="text-sm font-medium text-muted-foreground">
        {t.onboarding.eyebrow}
      </p>
      <h1 className="mt-2 text-3xl leading-[1.05] font-extrabold tracking-tightest text-balance sm:text-4xl">
        {t.onboarding.title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        {t.onboarding.body}
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Progress
          value={((index + 1) / ONBOARDING_STEPS.length) * 100}
          className="h-1.5"
        />
        <span className="shrink-0 text-xs text-muted-foreground tnum">
          {fill(t.onboarding.stepOf, {
            current: index + 1,
            total: ONBOARDING_STEPS.length,
          })}
        </span>
      </div>

      <div
        ref={stageRef}
        className="mt-6 rounded-2xl bg-card p-6 shadow-card sm:p-8"
      >
        {step === "grade" && (
          <Step title={t.onboarding.gradeTitle} body={t.onboarding.gradeBody}>
            <OptionList
              options={[
                { value: "GRADE_9", label: t.onboarding.grade9 },
                { value: "GRADE_10", label: t.onboarding.grade10 },
                { value: "GRADE_11", label: t.onboarding.grade11 },
                { value: "GRADE_12", label: t.onboarding.grade12 },
                { value: "GRADUATED", label: t.onboarding.graduated },
              ]}
              value={answers.gradeLevel}
              disabled={isPending}
              onSelect={(value) => {
                setAnswers((current) => ({ ...current, gradeLevel: value }));
                submitStep({ step: "grade", gradeLevel: value });
              }}
            />
          </Step>
        )}

        {step === "current-score" && (
          <Step
            title={t.onboarding.currentTitle}
            body={t.onboarding.currentBody}
          >
            <div className="space-y-2">
              <Label htmlFor="current-score">{t.onboarding.currentLabel}</Label>
              <Input
                id="current-score"
                type="number"
                inputMode="numeric"
                step={10}
                min={TOTAL_SCORE_MIN}
                max={TOTAL_SCORE_MAX}
                value={currentDraft}
                disabled={isPending}
                onChange={(event) => setCurrentDraft(event.target.value)}
                className="h-12 text-lg tnum"
              />
              <p className="text-xs text-muted-foreground">
                {fill(t.onboarding.scoreHint, {
                  min: TOTAL_SCORE_MIN,
                  max: TOTAL_SCORE_MAX,
                })}
              </p>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setCurrentDraft("");
                setAnswers((current) => ({ ...current, currentScore: null }));
                submitStep({ step: "current-score", currentScore: null });
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
            >
              <HelpCircle className="size-4" />
              {t.onboarding.currentUnknown}
            </button>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t.onboarding.currentUnknownNote}
            </p>
          </Step>
        )}

        {step === "target-score" && (
          <Step title={t.onboarding.targetTitle} body={t.onboarding.targetBody}>
            <div className="space-y-2">
              <Label htmlFor="target-score">{t.onboarding.targetLabel}</Label>
              <Input
                id="target-score"
                type="number"
                inputMode="numeric"
                step={10}
                min={TOTAL_SCORE_MIN}
                max={TOTAL_SCORE_MAX}
                value={targetDraft}
                disabled={isPending}
                onChange={(event) => setTargetDraft(event.target.value)}
                className="h-12 text-lg tnum"
              />
              <p className="text-xs text-muted-foreground">
                {fill(t.onboarding.scoreHint, {
                  min: TOTAL_SCORE_MIN,
                  max: TOTAL_SCORE_MAX,
                })}
              </p>
            </div>
          </Step>
        )}

        {step === "exam-date" && (
          <Step title={t.onboarding.dateTitle} body={t.onboarding.dateBody}>
            <div className="space-y-2">
              <Label htmlFor="exam-date">{t.onboarding.dateLabel}</Label>
              <Input
                id="exam-date"
                type="date"
                min={todayIsoDate()}
                max={maxExamIsoDate()}
                value={answers.examDate}
                disabled={isPending}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    examDate: event.target.value,
                  }))
                }
                className="h-12 text-lg"
              />
            </div>
          </Step>
        )}

        {step === "priority" && (
          <Step
            title={t.onboarding.priorityTitle}
            body={t.onboarding.priorityBody}
          >
            <OptionList
              options={[
                {
                  value: "SAT",
                  label: t.onboarding.prioritySat,
                  detail: t.onboarding.prioritySatBody,
                },
                {
                  value: "ADMISSIONS",
                  label: t.onboarding.priorityAdmissions,
                  detail: t.onboarding.priorityAdmissionsBody,
                },
                {
                  value: "BOTH",
                  label: t.onboarding.priorityBoth,
                  detail: t.onboarding.priorityBothBody,
                },
              ]}
              value={answers.priority}
              disabled={isPending}
              onSelect={(value) => {
                setAnswers((current) => ({ ...current, priority: value }));
                submitStep({ step: "priority", priority: value }, { finish: true });
              }}
            />
          </Step>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-viz-rose-soft px-3 py-2 text-sm text-viz-rose"
          >
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          disabled={index === 0 || isPending}
          onClick={() => go(index - 1)}
        >
          <ArrowLeft className="size-4" />
          {t.onboarding.back}
        </Button>

        {/*
         * Grade and priority submit the moment an option is picked — a click on
         * a card is already an unambiguous answer, and asking for a second one
         * is a step nobody thanks you for. The typed steps keep a button.
         */}
        {step !== "grade" && step !== "priority" && (
          <Button
            type="button"
            size="lg"
            className="h-11 shadow-glow"
            disabled={isPending}
            onClick={() => submitStep(payloadFor(step, answers, {
              currentDraft,
              targetDraft,
            }), { finish: isLast })}
          >
            {isPending ? t.onboarding.saving : t.onboarding.next}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

function Step({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-balance">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

interface Option<T extends string> {
  value: T;
  label: string;
  detail?: string;
}

function OptionList<T extends string>({
  options,
  value,
  disabled,
  onSelect,
}: {
  options: Option<T>[];
  value: T | null;
  disabled: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <div role="radiogroup" className="grid gap-2.5">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onSelect(option.value)}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors duration-200 disabled:opacity-60",
              selected
                ? "border-primary bg-brand-50"
                : "border-border hover:bg-muted",
            )}
          >
            <span>
              <span className="block text-sm font-semibold">{option.label}</span>
              {option.detail && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.detail}
                </span>
              )}
            </span>

            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border",
              )}
            >
              {selected && <Check className="size-3" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step payloads and rules                                                     */
/* -------------------------------------------------------------------------- */

type SaveInput = Parameters<typeof saveOnboardingStep>[0];

/** Where to reopen the form: the first question without an answer. */
function resumeIndex(initial: OnboardingState): number {
  if (initial.gradeLevel === null) return 0;
  /*
   * The current score is asked again when there is no target yet, because "I
   * don't know" and "not answered" are the same null in the database. One extra
   * click beats silently skipping a question.
   */
  if (initial.targetScore === null) return 1;
  if (!initial.examDate) return 3;
  if (initial.priority === null) return 4;
  return ONBOARDING_STEPS.length - 1;
}

function payloadFor(
  step: OnboardingStep,
  answers: Answers,
  drafts: { currentDraft: string; targetDraft: string },
): SaveInput {
  switch (step) {
    case "current-score":
      return {
        step: "current-score",
        currentScore: drafts.currentDraft.trim() === ""
          ? null
          : Number(drafts.currentDraft),
      };
    case "target-score":
      return { step: "target-score", targetScore: Number(drafts.targetDraft) };
    case "exam-date":
      return { step: "exam-date", examDate: answers.examDate };
    case "grade":
      return { step: "grade", gradeLevel: answers.gradeLevel as GradeLevel };
    case "priority":
      return { step: "priority", priority: answers.priority as StudyPriority };
  }
}

/** Fold a saved answer back into the local state. */
function applyPayload(answers: Answers, payload: SaveInput): Answers {
  switch (payload.step) {
    case "grade":
      return { ...answers, gradeLevel: payload.gradeLevel };
    case "current-score":
      return { ...answers, currentScore: payload.currentScore };
    case "target-score":
      return { ...answers, targetScore: payload.targetScore };
    case "exam-date":
      return { ...answers, examDate: payload.examDate };
    case "priority":
      return { ...answers, priority: payload.priority };
  }
}

/** The message to show, or null when the answer is fine. */
function validate(payload: SaveInput, answers: Answers): string | null {
  switch (payload.step) {
    case "current-score": {
      if (payload.currentScore === null) return null;
      const parsed = satScoreSchema.safeParse(payload.currentScore);
      return parsed.success ? null : (parsed.error.issues[0]?.message ?? null);
    }
    case "target-score": {
      const parsed = satScoreSchema.safeParse(payload.targetScore);
      if (!parsed.success) return parsed.error.issues[0]?.message ?? null;
      return targetScoreProblem(payload.targetScore, answers.currentScore);
    }
    case "exam-date": {
      const parsed = examDateSchema.safeParse(payload.examDate);
      return parsed.success ? null : (parsed.error.issues[0]?.message ?? null);
    }
    default:
      return null;
  }
}
