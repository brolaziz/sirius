"use client";

/**
 * The roadmap checklist.
 *
 * Ticking a box calls a Server Action, which is a network round trip — so the
 * UI updates optimistically first via React 19's `useOptimistic`. The checkbox
 * responds in the same frame as the click, and if the write fails the optimistic
 * state is discarded automatically when the action's transition settles and the
 * server state re-renders.
 */

import * as React from "react";
import { ListChecks } from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { toggleRoadmapTask } from "@/lib/actions/roadmap";
import { cn } from "@/lib/utils";

export interface RoadmapTaskView {
  id: string;
  /**
   * Set on the steps Sirius seeds itself, null on anything a student wrote.
   * Seeded steps render from the dictionary so they follow the interface
   * language; a student's own wording is shown exactly as they typed it.
   */
  slug: string | null;
  title: string;
  detail: string | null;
  isDone: boolean;
}

/** The dictionary entry for a seeded step, or null for a custom one. */
function translated(
  slug: string | null,
  dictionary: Record<string, { title: string; detail: string }>,
) {
  if (!slug) return null;
  return dictionary[slug] ?? null;
}

export function RoadmapCard({
  tasks,
  className,
}: {
  tasks: RoadmapTaskView[];
  className?: string;
}) {
  const { t } = useT();
  const [isPending, startTransition] = React.useTransition();

  const [optimisticTasks, applyOptimistic] = React.useOptimistic(
    tasks,
    (current: RoadmapTaskView[], toggled: { id: string; isDone: boolean }) =>
      current.map((task) =>
        task.id === toggled.id ? { ...task, isDone: toggled.isDone } : task,
      ),
  );

  const completed = optimisticTasks.filter((task) => task.isDone).length;
  const total = optimisticTasks.length;
  const percent = total > 0 ? (completed / total) * 100 : 0;

  function handleToggle(task: RoadmapTaskView, isDone: boolean) {
    startTransition(async () => {
      // Must be inside the transition, or React discards it immediately.
      applyOptimistic({ id: task.id, isDone });

      const result = await toggleRoadmapTask({ taskId: task.id, isDone });
      if (!result.ok) {
        toast.error(result.error ?? "Could not update that task.");
      }
    });
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl bg-card p-6 shadow-card sm:p-7",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t.dash.roadmap}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total === 0
              ? "—"
              : fill(t.dash.roadmapDone, {
                  done: completed,
                  left: total - completed,
                })}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {total > 0 && (
            <span className="rounded-full bg-viz-emerald-soft px-2.5 py-1 text-xs font-semibold text-viz-emerald tnum">
              {Math.round(percent)}%
            </span>
          )}
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-primary">
            <ListChecks className="size-[18px]" />
          </span>
        </div>
      </div>

      {total > 0 && <Progress value={percent} className="mt-5 h-2" />}

      <ul className="mt-5 flex-1 space-y-1">
        {optimisticTasks.map((task) => {
          const localised = translated(task.slug, t.roadmapTasks);
          const title = localised?.title ?? task.title;
          const detail = localised?.detail ?? task.detail;

          return (
          <li key={task.id}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3.5 rounded-xl p-3 transition-colors duration-200 hover:bg-muted/70",
                isPending && "cursor-wait",
              )}
            >
              <Checkbox
                checked={task.isDone}
                onCheckedChange={(checked) =>
                  handleToggle(task, checked === true)
                }
                className="mt-0.5"
                aria-label={title}
              />

              <span className="min-w-0 flex-1">
                {/*
                 * The strike-through grows from left to right instead of
                 * appearing instantly, which makes completion feel earned.
                 */}
                <span className="relative inline-block">
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors duration-300",
                      task.isDone && "text-muted-foreground",
                    )}
                  >
                    {title}
                  </span>
                  {/*
                   * The strike grows left to right instead of appearing, so
                   * ticking a task feels like finishing it. Width is the one
                   * layout property worth animating here: the element is a 1px
                   * line with nothing to reflow around it.
                   */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1/2 left-0 h-px bg-muted-foreground transition-[width] duration-300 ease-out",
                      task.isDone ? "w-full" : "w-0",
                    )}
                  />
                </span>

                {detail && (
                  <span
                    className={cn(
                      "mt-0.5 block text-xs leading-relaxed transition-opacity duration-300",
                      task.isDone
                        ? "text-muted-foreground/60"
                        : "text-muted-foreground",
                    )}
                  >
                    {detail}
                  </span>
                )}
              </span>
            </label>
          </li>
          );
        })}
      </ul>

      {total === 0 && (
        <p className="flex-1 py-6 text-sm text-muted-foreground">
          {t.dash.roadmapEmpty}
        </p>
      )}
    </div>
  );
}
