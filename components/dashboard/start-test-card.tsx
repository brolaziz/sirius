"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/lang-provider";
import { StartPracticeButton } from "@/components/practice/start-practice-button";
import { Pressable } from "@/components/motion/pressable";
import { cn } from "@/lib/utils";
import { fill } from "@/lib/i18n/config";
import type { TodayAction } from "@/lib/today";

export function StartTestCard({ action, className }: { action: TodayAction; className?: string }) {
  const { t, lang } = useT();
  const copy = t.today;
  const title = action.kind === "resume" ? copy.resume : action.kind === "plan" ? copy.task
    : action.kind === "mock" ? t.dash.startTest : action.kind === "done" ? copy.done
    : action.kind === "setup" ? copy.setup : copy.practice;
  const body = action.kind === "plan" ? fill(copy.remaining, { count: action.remaining ?? 0 })
    : action.kind === "mock" ? t.dash.startTestBody : action.kind === "resume" ? copy.resumeBody
    : action.kind === "done" ? copy.doneBody : action.kind === "setup" ? copy.setupBody : copy.practiceBody;
  return (
    <div className={cn("group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-brand-500 p-7 shadow-card transition-[transform,box-shadow] duration-300 motion-safe:hover:-translate-y-1 hover:shadow-card-hover", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-dots-light" />
      <div className="relative">
        <p className="text-xs font-semibold tracking-wide text-white/80">{copy.eyebrow}</p>
        <h2 className="mt-5 text-3xl leading-[1.05] font-extrabold tracking-tightest text-balance text-white">{title}</h2>
        {action.title && <p className="mt-3 text-base font-semibold text-white">{lang === "uz" ? action.titleUz ?? action.title : action.title}</p>}
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">{body}</p>
      </div>
      <div className="relative mt-8 flex flex-wrap items-center gap-4">
        <Pressable>
          {action.taskId ? <StartPracticeButton planTaskId={action.taskId} label={copy.startTask} className="h-12 rounded-lg bg-white px-6 text-base text-brand-700 hover:bg-white/90" /> : (
            <Button asChild size="lg" className="h-12 rounded-lg bg-white px-6 text-base text-brand-700 hover:bg-white/90">
              <Link href={action.href ?? "/practice"}><Play className="size-4" />{action.kind === "resume" ? copy.continue : action.kind === "setup" ? copy.editGoal : action.kind === "done" ? copy.viewPlan : t.dash.startTestCta}<ArrowRight className="size-4" /></Link>
            </Button>
          )}
        </Pressable>
        {action.kind === "setup" && <Link href="/practice" className="text-sm font-medium text-white underline underline-offset-4">{copy.viewPractice}</Link>}
      </div>
    </div>
  );
}
