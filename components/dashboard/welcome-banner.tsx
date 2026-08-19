"use client";

/**
 * Dashboard greeting, with the target-score control.
 *
 * The greeting is the largest type in the product — it is the first thing a
 * student sees every day, and at 3rem it does the job an app header usually
 * needs a coloured banner to do.
 *
 * The target score lives here rather than in a settings page because it is the
 * number every other metric is measured against, and the dashboard is where a
 * student is thinking about it.
 *
 * No time-of-day greeting ("Good evening"). The server does not know the
 * visitor's timezone, so rendering one would either mismatch on hydration or
 * need a client-only pass that flashes. "Hi, {name}" is right at every hour.
 */

import * as React from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pressable } from "@/components/motion/pressable";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { setTargetScore } from "@/lib/actions/profile";
import { TOTAL_SCORE_MAX, TOTAL_SCORE_MIN } from "@/lib/sat";
import { DUR, EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

interface WelcomeBannerProps {
  name: string;
  targetScore: number | null;
  /** Disable the editor when there is no database to write to. */
  canEdit?: boolean;
}

export function WelcomeBanner({
  name,
  targetScore,
  canEdit = true,
}: WelcomeBannerProps) {
  const { t } = useT();
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(String(targetScore ?? 1400));
  const [isPending, startTransition] = React.useTransition();

  /*
   * One short cascade across the greeting, in the order the eye reads it. This
   * is the first thing that happens on the page, so it is also what sets the
   * pace for the tiles that follow.
   */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.from(ref.current?.querySelectorAll("[data-greet]") ?? [], {
        opacity: 0,
        y: 16,
        duration: DUR.base,
        ease: EASE,
        stagger: 0.08,
      });
    },
    { scope: ref },
  );

  function handleSave() {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      toast.error(t.dash.targetInvalid);
      return;
    }

    startTransition(async () => {
      const result = await setTargetScore(parsed);
      if (result.ok) {
        toast.success(t.dash.targetSaved);
        setOpen(false);
      } else {
        toast.error(result.error ?? t.dash.targetInvalid);
      }
    });
  }

  return (
    <div
      ref={ref}
      className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        <h1
          data-greet
          className="text-4xl leading-[1.02] font-extrabold tracking-tightest text-balance sm:text-5xl lg:text-6xl"
        >
          {fill(t.dash.greeting, { name })}
        </h1>

        <p
          data-greet
          className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground"
        >
          {targetScore ? t.dash.subtitle : t.dash.subtitleNoTarget}
        </p>
      </div>

      {canEdit && (
        <div data-greet className="shrink-0">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Pressable>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 gap-2.5 rounded-lg bg-card px-4"
                >
                  <span className="inline-flex size-7 items-center justify-center rounded-md bg-brand-50 text-primary">
                    <Target className="size-4" />
                  </span>
                  <span className="text-sm">
                    {targetScore
                      ? fill(t.dash.targetSet, { score: targetScore })
                      : t.dash.targetUnset}
                  </span>
                </Button>
              </Pressable>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {t.dash.targetDialogTitle}
                </DialogTitle>
                <DialogDescription>{t.dash.targetDialogBody}</DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-2">
                <Label htmlFor="target-score">{t.dash.targetLabel}</Label>
                <Input
                  id="target-score"
                  type="number"
                  inputMode="numeric"
                  min={TOTAL_SCORE_MIN}
                  max={TOTAL_SCORE_MAX}
                  step={10}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSave();
                  }}
                  className="h-12 text-lg tnum"
                />
                <p className="text-xs text-muted-foreground">
                  {fill(t.dash.targetHint, {
                    min: TOTAL_SCORE_MIN,
                    max: TOTAL_SCORE_MAX,
                  })}
                </p>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" size="lg" className="h-11">
                    {t.dash.cancel}
                  </Button>
                </DialogClose>
                <Pressable disabled={isPending}>
                  <Button
                    size="lg"
                    className="h-11 shadow-glow"
                    onClick={handleSave}
                    disabled={isPending}
                  >
                    {isPending ? t.dash.saving : t.dash.save}
                  </Button>
                </Pressable>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
