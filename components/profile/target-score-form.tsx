"use client";

/**
 * The target-score field on the profile page.
 *
 * The same number the dashboard's greeting edits in a dialog, in the form style
 * the rest of the app uses — a labelled input, a hint under it, one button. It
 * calls the same Server Action, so the rules and the plan rebuild are identical
 * whichever door a student came through.
 *
 * The client checks are a courtesy, not a check: `setTargetScore` re-validates
 * everything from the session and the stored current score. What they buy is a
 * message in the student's own language for the two mistakes they will actually
 * make — a number outside the scale, and a target under the score they already
 * have — where the server's answer is English-only.
 */

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pressable } from "@/components/motion/pressable";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { setTargetScore } from "@/lib/actions/profile";
import { TOTAL_SCORE_MAX, TOTAL_SCORE_MIN } from "@/lib/sat";

export function TargetScoreForm({
  targetScore,
  currentScore,
}: {
  targetScore: number | null;
  currentScore: number | null;
}) {
  const { t } = useT();
  const [draft, setDraft] = React.useState(String(targetScore ?? 1400));
  const [isPending, startTransition] = React.useTransition();

  const saved = String(targetScore ?? "");
  const isDirty = draft.trim() !== saved;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = Number(draft);

    if (
      !Number.isFinite(parsed) ||
      !Number.isInteger(parsed) ||
      parsed < TOTAL_SCORE_MIN ||
      parsed > TOTAL_SCORE_MAX ||
      parsed % 10 !== 0
    ) {
      toast.error(t.dash.targetInvalid);
      return;
    }

    if (currentScore !== null && parsed < currentScore) {
      toast.error(t.profile.belowCurrent);
      return;
    }

    startTransition(async () => {
      const result = await setTargetScore(parsed);

      if (!result.ok) {
        toast.error(result.error ?? t.dash.targetInvalid);
        return;
      }

      /*
       * Two different outcomes, two different messages. "Saved" alone would let
       * a student walk away believing the plan below moved with the target.
       */
      if (result.planRebuilt) toast.success(t.dash.targetSaved);
      else toast.warning(t.profile.planFailed);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <Label htmlFor="target-score" className="text-xs font-semibold">
        {t.dash.targetLabel}
      </Label>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="sm:w-48">
          <Input
            id="target-score"
            type="number"
            inputMode="numeric"
            min={TOTAL_SCORE_MIN}
            max={TOTAL_SCORE_MAX}
            step={10}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-11 rounded-xl tnum"
            aria-describedby="target-score-hint"
          />
        </div>

        <Pressable>
          <Button
            type="submit"
            size="lg"
            className="h-11 rounded-xl px-6"
            disabled={isPending || !isDirty}
          >
            {isPending ? t.dash.saving : t.dash.save}
          </Button>
        </Pressable>
      </div>

      <p id="target-score-hint" className="mt-3 text-xs text-muted-foreground">
        {fill(t.dash.targetHint, {
          min: TOTAL_SCORE_MIN,
          max: TOTAL_SCORE_MAX,
        })}
      </p>
    </form>
  );
}
