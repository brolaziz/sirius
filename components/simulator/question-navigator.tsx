"use client";

/**
 * Question navigator — the popover grid Bluebook opens from the bottom bar.
 *
 * Each cell encodes three independent facts at a glance: whether the question is
 * current, whether it has an answer, and whether it is flagged for review. They
 * are encoded with shape and icon as well as colour, so the grid is still
 * readable without colour vision.
 */

import * as React from "react";
import { ChevronUp, Flag } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface QuestionNavigatorProps {
  /** Ordered question ids. Position in this array is the question number. */
  questionIds: string[];
  answers: Record<string, string>;
  flagged: Set<string>;
  currentIndex: number;
  onJump: (index: number) => void;
}

export function QuestionNavigator({
  questionIds,
  answers,
  flagged,
  currentIndex,
  onJump,
}: QuestionNavigatorProps) {
  const [open, setOpen] = React.useState(false);

  const answeredCount = questionIds.filter((id) => Boolean(answers[id])).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="tap-target inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="tnum">
            Question {currentIndex + 1} of {questionIds.length}
          </span>
          <ChevronUp
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent side="top" align="center" className="w-80" sideOffset={8}>
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium">Go to question</p>
          <p className="text-xs text-muted-foreground tnum">
            {answeredCount}/{questionIds.length} answered
          </p>
        </div>

        {/*
          * Five columns, not seven, because the cells are 44px.
          *
          * A halo is no use in this grid: at 36px with 6px between them, every
          * cell’s halo would reach 4px into its neighbours on all four sides,
          * and a grid where each cell answers for the ones around it is worse
          * than one with small cells. The only fix that works is real size, and
          * 5 × 44 plus the gaps is what fits the popover’s width.
          */}
        <div className="grid grid-cols-5 justify-items-center gap-1.5">
          {questionIds.map((id, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = Boolean(answers[id]);
            const isFlagged = flagged.has(id);

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onJump(index);
                  setOpen(false);
                }}
                aria-label={[
                  `Question ${index + 1}`,
                  isAnswered ? "answered" : "not answered",
                  isFlagged ? "flagged for review" : null,
                  isCurrent ? "current" : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "relative inline-flex size-11 items-center justify-center rounded-lg text-xs font-semibold tnum transition-[background-color,transform,border-color] duration-150 active:scale-95",
                  isCurrent
                    ? "bg-foreground text-background"
                    : isAnswered
                      ? "bg-brand-100 text-brand-900 hover:bg-brand-200"
                      : // Unanswered: dashed outline, distinguishable by shape
                        // rather than colour alone.
                        "border border-dashed border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {index + 1}
                {isFlagged && (
                  <Flag
                    className="absolute -top-0.5 -right-0.5 size-3 fill-warning text-warning"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-foreground" />
            Current
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-brand-200" />
            Answered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm border border-dashed border-muted-foreground" />
            Blank
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Flag className="size-2.5 fill-warning text-warning" />
            Flagged
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
