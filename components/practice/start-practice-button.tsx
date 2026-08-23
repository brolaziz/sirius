"use client";

/**
 * Opens a practice session and goes to it.
 *
 * The server decides which questions the session contains and returns its id;
 * this only says *what* to practise — a skill, or a task from the study plan.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/lang-provider";
import { startPracticeSession } from "@/lib/actions/practice";
import { usePracticePreferences } from "@/components/practice/practice-preferences";
import { cn } from "@/lib/utils";

export function StartPracticeButton({
  skillCode,
  planTaskId,
  className,
  variant = "default",
  size = "lg",
  label,
}: {
  skillCode?: string;
  planTaskId?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "lg";
  /** Overrides the default "Practise" wording. */
  label?: string;
}) {
  const { t } = useT();
  const router = useRouter();
  /*
   * The length and timer the student chose once, at the top of the practice
   * page. Outside that page — the dashboard, the study plan — there is no
   * picker on screen and this returns no preference, so the server keeps
   * choosing the length as it always has.
   *
   * A plan task ignores the count deliberately: its length is what the plan
   * still owes for that skill, and letting a picker shorten it would quietly
   * put the plan behind.
   */
  const { count, minutes } = usePracticePreferences();
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await startPracticeSession({
        skillCode,
        planTaskId,
        count: planTaskId ? undefined : count,
      });

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
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={isPending}
      onClick={handleClick}
      className={cn(size === "lg" && "h-11", className)}
    >
      <Play className="size-4" />
      {isPending ? t.practice.starting : (label ?? t.practice.start)}
    </Button>
  );
}
