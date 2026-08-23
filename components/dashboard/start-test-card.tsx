"use client";

/**
 * The dashboard's primary action: start a mock test.
 *
 * This is the one tile on the page with a solid blue fill. There is exactly one
 * of these, which is what makes it read as *the* thing to do rather than one
 * option among six — and on a white, hairline-ruled dashboard a single block of
 * saturated colour does that job without needing to be big.
 *
 * Two states, because Sirius ships without question content:
 *  • a published test exists  → a large, obvious call to action
 *  • nothing imported yet     → instructions for importing a question bank
 *
 * The empty state names the actual endpoint rather than saying "no tests
 * available", because the person seeing it is the person who has to fix it.
 */

import Link from "next/link";
import { ArrowRight, Clock, FileJson, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/lang-provider";
import { Pressable } from "@/components/motion/pressable";
import { cn } from "@/lib/utils";
import { testTypeLabel } from "@/lib/sat";
import type { TestType } from "@/lib/generated/prisma/enums";

interface StartTestCardProps {
  test: {
    id: string;
    title: string;
    type: TestType;
    durationMinutes: number;
  } | null;
  className?: string;
}

export function StartTestCard({ test, className }: StartTestCardProps) {
  const { t } = useT();

  if (!test) {
    return (
      <div
        className={cn(
          "flex h-full flex-col justify-between rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-7",
          className,
        )}
      >
        <div>
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-white text-primary shadow-soft">
            <FileJson className="size-5" />
          </span>
          <h2 className="mt-5 text-xl font-bold tracking-tight">
            {t.dash.startTestEmpty}
          </h2>
          <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t.dash.startTestEmptyBody}
          </p>
        </div>

        <pre className="mt-6 overflow-x-auto rounded-xl bg-foreground/5 p-4 font-mono text-xs leading-relaxed">
          <code>{`curl -X POST /api/tests/import \\\n  -H "Authorization: Bearer $TEST_IMPORT_TOKEN" \\\n  --data-binary @questions.json`}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-brand-500 p-7 shadow-card transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-card-hover",
        className,
      )}
    >
      {/* Dot field, in white. Decorative, and it drifts on hover. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-dots-light transition-transform duration-700 group-hover:translate-x-1 group-hover:-translate-y-1"
      />

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
          <Clock className="size-3.5" />
          {test.durationMinutes} min · {testTypeLabel(test.type, t)}
        </span>

        <h2 className="mt-6 text-3xl leading-[1.05] font-extrabold tracking-tightest text-balance text-white">
          {t.dash.startTest}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
          {test.title}
        </p>
      </div>

      <div className="relative mt-9">
        <Pressable>
          <Button
            asChild
            size="lg"
            className="group/btn h-12 rounded-lg bg-white px-6 text-base font-semibold text-brand-700 hover:bg-white/90"
          >
            <Link href={`/simulator/${test.id}`}>
              <Play className="size-4" />
              {t.dash.startTestCta}
              <ArrowRight className="ml-0.5 size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </Pressable>

        <p className="mt-4 text-xs text-white/70">
          {t.dash.startTestBody}
        </p>
      </div>
    </div>
  );
}
