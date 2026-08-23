"use client";

/**
 * The right-hand pane: question stem, answer options, flag control.
 *
 * Fidelity details carried over from Bluebook:
 *  • Options are large click targets with the letter in a circle on the left.
 *  • Each option can be **crossed out** ("answer eliminator"). Students are
 *    taught to eliminate rather than only to select, and the real app supports
 *    it. Crossing out an option that is currently selected clears the selection,
 *    since keeping both states would be contradictory.
 *  • SPR (student-produced response) questions render a text field instead of
 *    options, with the same keyboard affordances.
 */

import * as React from "react";
import { Check, Flag, Undo2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SimulatorQuestion } from "@/lib/simulator";
import { useT } from "@/components/i18n/lang-provider";

interface QuestionPaneProps {
  question: SimulatorQuestion;
  /** 1-based number shown to the student. */
  questionNumber: number;
  answer: string | undefined;
  onAnswer: (value: string) => void;
  isFlagged: boolean;
  onToggleFlag: () => void;
  crossedOut: Set<string>;
  onToggleCrossOut: (label: string) => void;
}

export function QuestionPane({
  question,
  questionNumber,
  answer,
  onAnswer,
  isFlagged,
  onToggleFlag,
  crossedOut,
  onToggleCrossOut,
}: QuestionPaneProps) {
  const { t } = useT();

  return (
    <div className="mx-auto max-w-2xl">
      {/* Question meta bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        {/*
          `min-w-0` is what makes the `truncate` below actually truncate: without
          it this flex item keeps `min-width: auto`, its minimum is the domain
          string's min-content, and a long domain widens the meta bar instead of
          being clipped. Same shape as the bug fixed in `universities-card.tsx`.
        */}
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background tnum">
            {questionNumber}
          </span>
          {question.domain && (
            <span className="truncate text-xs text-muted-foreground">
              {question.domain}
            </span>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleFlag}
              aria-pressed={isFlagged}
              className={cn(
                "tap-target inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200",
                isFlagged
                  ? "border-warning/40 bg-warning/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex transition-transform duration-200",
                  isFlagged && "scale-115",
                )}
              >
                <Flag
                  className={cn(
                    "size-3.5",
                    isFlagged && "fill-warning text-warning",
                  )}
                />
              </span>
              <span className="hidden sm:inline">
                {isFlagged ? t.simulator.flagged : t.simulator.markForReview}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isFlagged
              ? t.simulator.removeFlag
              : t.simulator.addFlag}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Stem */}
      <p className="mt-6 text-base leading-relaxed font-medium text-pretty">
        {question.questionText}
      </p>

      {/* Answers */}
      {question.format === "MULTIPLE_CHOICE" ? (
        <div
          className="mt-6 space-y-2.5"
          role="radiogroup"
          aria-label={`Answer options for question ${questionNumber}`}
        >
          {question.options.map((option) => {
            const isSelected = answer === option.label;
            const isCrossed = crossedOut.has(option.label);

            return (
              <div key={option.label} className="flex items-start gap-2">
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isCrossed}
                  onClick={() => onAnswer(option.label)}
                  className={cn(
                    "flex flex-1 items-start gap-3 rounded-xl border p-3.5 text-left transition-[background-color,border-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none not-disabled:hover:-translate-y-px not-disabled:active:translate-y-0 not-disabled:active:scale-[0.995]",
                    isCrossed
                      ? "cursor-not-allowed border-border bg-muted/40 opacity-50"
                      : isSelected
                        ? "border-primary bg-brand-50/70 ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-brand-300 hover:bg-brand-50/40",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground ring-1 ring-border",
                    )}
                  >
                    {isSelected ? <Check className="size-3.5" /> : option.label}
                  </span>

                  <span
                    className={cn(
                      "text-sm leading-relaxed",
                      isCrossed && "line-through decoration-2",
                    )}
                  >
                    {option.text}
                  </span>
                </button>

                {/* Answer eliminator */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onToggleCrossOut(option.label)}
                      className={cn(
                        /*
                         * Safe to halo despite the 8px gap to the option beside
                         * it: the option is already past 44px, so it asks for
                         * no growth of its own and this button's 8px of reach
                         * lands exactly in the gap. Verified with
                         * `scripts/audit-tap-targets.ts`.
                         */
                        "tap-target mt-3 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold transition-colors",
                        isCrossed
                          ? "text-foreground hover:bg-muted"
                          : "text-muted-foreground/60 hover:bg-muted hover:text-foreground",
                      )}
                      aria-label={
                        isCrossed
                          ? `Restore option ${option.label}`
                          : `Cross out option ${option.label}`
                      }
                    >
                      {isCrossed ? (
                        <Undo2 className="size-3.5" />
                      ) : (
                        <span className="line-through">{option.label}</span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {isCrossed ? t.simulator.undoCrossOut : t.simulator.crossOut}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6">
          <label
            htmlFor={`spr-${question.id}`}
            className="text-sm font-medium text-muted-foreground"
          >
            Enter your answer
          </label>
          <Input
            id={`spr-${question.id}`}
            value={answer ?? ""}
            onChange={(event) => onAnswer(event.target.value)}
            placeholder="e.g. 3/4 or 0.75"
            // `text`, not `number`: SPR answers include fractions, and number
            // inputs silently reject "3/4" and scroll-wheel-edit their value.
            type="text"
            inputMode="text"
            autoComplete="off"
            className="mt-2 max-w-xs text-base tnum"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Fractions and decimals are both accepted.
          </p>

          {answer && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => onAnswer("")}
            >
              Clear answer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
