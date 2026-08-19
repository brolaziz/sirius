"use client";

/**
 * Shown in the app shell when the database is configured but the read failed.
 *
 * Distinct from `DatabaseSetupBanner`, which means "you have not connected one
 * yet". This one means "we tried and could not", and the difference matters:
 * the first is a setup task, the second is usually a blip that a reload fixes.
 *
 * It reassures before it explains. A student seeing an empty dashboard assumes
 * their work is gone, so the first sentence says it is not.
 */

import { DatabaseZap, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pressable } from "@/components/motion/pressable";
import { useT } from "@/components/i18n/lang-provider";
import { cn } from "@/lib/utils";

export function DatabaseErrorBanner({ className }: { className?: string }) {
  const { t } = useT();

  return (
    <div
      role="status"
      className={cn("rounded-2xl bg-viz-rose-soft p-5 shadow-card", className)}
    >
      <div className="flex flex-wrap items-start gap-4">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-viz-rose">
          <DatabaseZap className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-viz-rose">{t.errors.dbTitle}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {t.errors.dbBody}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t.errors.dbHint}</p>
        </div>

        <Pressable>
          <Button
            size="lg"
            variant="outline"
            className="h-10 rounded-lg bg-card"
            onClick={() => window.location.reload()}
          >
            <RotateCw className="size-4" />
            {t.errors.retry}
          </Button>
        </Pressable>
      </div>
    </div>
  );
}
