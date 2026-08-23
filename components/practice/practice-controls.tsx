"use client";

/**
 * How long a practice session is, and whether it is timed.
 *
 * Both choices belong to the student, which is the difference between practice
 * and the mock: the mock's shape is the exam's and is not negotiable, while a
 * practice session is whatever fits the time somebody actually has.
 *
 * The timer is carried in the URL rather than on the session row. Practice is
 * not an exam — nothing is graded against the clock and nothing needs to be
 * enforced server-side — so a display preference does not deserve a column, and
 * a student who wants to stop watching the clock can just drop the query
 * parameter.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Play, Shuffle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/i18n/lang-provider";
import { startPracticeSession } from "@/lib/actions/practice";
import { cn } from "@/lib/utils";

/** Session lengths offered. Bounded by the action's own 5–50 clamp. */
const COUNTS = [5, 10, 20] as const;

/** Timer options in minutes. `0` means no timer. */
const MINUTES = [0, 5, 10, 20] as const;

export function PracticeControls({ className }: { className?: string }) {
  const { t } = useT();
  const router = useRouter();
  const [count, setCount] = React.useState<number>(10);
  const [minutes, setMinutes] = React.useState<number>(0);
  const [isPending, startTransition] = React.useTransition();

  function start() {
    startTransition(async () => {
      const result = await startPracticeSession({ mixed: true, count });

      if (!result.ok || !result.sessionId) {
        toast.error(result.error ?? t.practice.startFailed);
        return;
      }

      router.push(
        minutes > 0
          ? `/practice/session/${result.sessionId}?minutes=${minutes}`
          : `/practice/session/${result.sessionId}`,
      );
    });
  }

  return (
    <div className={cn("rounded-2xl bg-card p-6 shadow-card", className)}>
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-primary">
          <Shuffle className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight">
            {t.practice.randomTitle}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t.practice.randomBody}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <Label className="text-xs font-semibold">
            {t.practice.countLabel}
          </Label>
          <div className="mt-2 flex gap-2">
            {COUNTS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={count === option ? "default" : "outline"}
                size="sm"
                className="h-10 flex-1 rounded-xl tnum"
                onClick={() => setCount(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold">
            {t.practice.timerLabel}
          </Label>
          <div className="mt-2 flex gap-2">
            {MINUTES.map((option) => (
              <Button
                key={option}
                type="button"
                variant={minutes === option ? "default" : "outline"}
                size="sm"
                className="h-10 flex-1 rounded-xl tnum"
                onClick={() => setMinutes(option)}
              >
                {option === 0 ? t.practice.timerOff : `${option}m`}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        disabled={isPending}
        onClick={start}
        className="mt-6 h-11 w-full rounded-xl"
      >
        <Play className="size-4" />
        {isPending ? t.practice.starting : t.practice.randomStart}
      </Button>
    </div>
  );
}
