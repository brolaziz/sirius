"use client";

/**
 * Rebuild the study plan.
 *
 * The action takes no arguments — it reads the student's answers from the
 * session server-side — so this is a button and nothing else.
 */

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/lang-provider";
import { regenerateStudyPlan } from "@/lib/actions/study-plan";
import { cn } from "@/lib/utils";

export function RegeneratePlanButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "default" | "outline";
}) {
  const { t } = useT();
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await regenerateStudyPlan();
      if (!result.ok) {
        toast.error(result.error ?? t.plan.regenerateFailed);
      }
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="lg"
      disabled={isPending}
      onClick={handleClick}
      className={cn("h-11", className)}
    >
      <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
      {isPending ? t.plan.regenerating : t.plan.regenerate}
    </Button>
  );
}
