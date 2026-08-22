"use client";

/**
 * The student's own Common Application activities list.
 *
 * Ten lines, 150 characters each. The character counter is the point of the
 * whole screen: the Common App's limit is the exercise, and a student who
 * writes to it here is writing the sentence they will actually submit rather
 * than a paragraph they will have to cut in a hurry in November.
 *
 * The limits are checked in `lib/admissions.ts`, imported by both this form and
 * the Server Action, so the message a student sees is the message the server
 * would give.
 */

import * as React from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import {
  ACTIVITY_DESCRIPTION_LIMIT,
  MAX_ACTIVITIES,
  activityProblem,
} from "@/lib/admissions";
import {
  addActivity,
  removeActivity,
  updateActivity,
} from "@/lib/actions/activities";
import { cn } from "@/lib/utils";
import type { MyActivity } from "@/lib/queries/admissions";

interface Draft {
  title: string;
  organisation: string;
  role: string;
  description: string;
  hoursPerWeek: string;
  weeksPerYear: string;
}

const EMPTY: Draft = {
  title: "",
  organisation: "",
  role: "",
  description: "",
  hoursPerWeek: "",
  weeksPerYear: "",
};

export function MyActivities({ activities }: { activities: MyActivity[] }) {
  const { t } = useT();
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const isFull = activities.length >= MAX_ACTIVITIES && editingId === null;
  const remaining = ACTIVITY_DESCRIPTION_LIMIT - draft.description.length;

  function open(activity?: MyActivity) {
    setError(null);

    if (activity) {
      setEditingId(activity.id);
      setDraft({
        title: activity.title,
        organisation: activity.organisation ?? "",
        role: activity.role ?? "",
        description: activity.description ?? "",
        hoursPerWeek: activity.hoursPerWeek?.toString() ?? "",
        weeksPerYear: activity.weeksPerYear?.toString() ?? "",
      });
    } else {
      setEditingId(null);
      setDraft(EMPTY);
    }

    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setEditingId(null);
    setDraft(EMPTY);
    setError(null);
  }

  function submit() {
    const payload = {
      title: draft.title,
      organisation: draft.organisation.trim() || null,
      role: draft.role.trim() || null,
      description: draft.description.trim() || null,
      hoursPerWeek: toNumber(draft.hoursPerWeek),
      weeksPerYear: toNumber(draft.weeksPerYear),
    };

    const problem = activityProblem(payload);
    if (problem) {
      setError(problem);
      return;
    }

    startTransition(async () => {
      const result = editingId
        ? await updateActivity({ id: editingId, ...payload })
        : await addActivity(payload);

      if (!result.ok) {
        setError(result.error ?? t.activities.saveFailed);
        return;
      }

      close();
    });
  }

  function remove(activity: MyActivity) {
    startTransition(async () => {
      const result = await removeActivity(activity.id);
      if (!result.ok) toast.error(result.error ?? t.activities.saveFailed);
    });
  }

  return (
    <div className="rounded-2xl bg-card p-6 shadow-card sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {t.activities.mineTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {fill(t.activities.mineCount, {
              count: activities.length,
              max: MAX_ACTIVITIES,
            })}
          </p>
        </div>

        {!isOpen && (
          <Button
            type="button"
            size="lg"
            className="h-10 shadow-glow"
            disabled={isFull || isPending}
            onClick={() => open()}
          >
            <Plus className="size-4" />
            {t.activities.add}
          </Button>
        )}
      </div>

      {isFull && !isOpen && (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {fill(t.activities.full, { max: MAX_ACTIVITIES })}
        </p>
      )}

      {/* The list */}
      {activities.length === 0 && !isOpen ? (
        <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {t.activities.mineEmpty}
        </p>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  <span className="mr-2 text-muted-foreground tabular-nums">
                    {activity.position}.
                  </span>
                  {activity.title}
                </p>

                {(activity.role || activity.organisation) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[activity.role, activity.organisation]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}

                {activity.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {activity.description}
                  </p>
                )}

                {(activity.hoursPerWeek !== null ||
                  activity.weeksPerYear !== null) && (
                  <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                    {activity.hoursPerWeek !== null &&
                      fill(t.activities.hours, { count: activity.hoursPerWeek })}
                    {activity.hoursPerWeek !== null &&
                      activity.weeksPerYear !== null &&
                      " · "}
                    {activity.weeksPerYear !== null &&
                      fill(t.activities.weeks, { count: activity.weeksPerYear })}
                  </p>
                )}
              </div>

              {/*
                * gap-1.5, not gap-1: each of these buttons is 38px wide and
                * carries a 44px halo from `tap-target`, so each reaches 3px
                * past its own edge. Four pixels of gap left the two halos
                * overlapping — the delete button, later in the DOM, was
                * answering for the right-hand 2px of edit.
                */}
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => open(activity)}
                  aria-label={t.activities.edit}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => remove(activity)}
                  aria-label={t.activities.remove}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* The form */}
      {isOpen && (
        <div className="mt-6 rounded-xl border border-border p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">
              {editingId ? t.activities.editTitle : t.activities.addTitle}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={close}
              disabled={isPending}
              aria-label={t.activities.cancel}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={t.activities.fieldTitle} htmlFor="activity-title">
              <Input
                id="activity-title"
                value={draft.title}
                disabled={isPending}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
              />
            </Field>

            <Field label={t.activities.fieldRole} htmlFor="activity-role">
              <Input
                id="activity-role"
                value={draft.role}
                disabled={isPending}
                onChange={(event) =>
                  setDraft({ ...draft, role: event.target.value })
                }
              />
            </Field>

            <Field
              label={t.activities.fieldOrganisation}
              htmlFor="activity-organisation"
            >
              <Input
                id="activity-organisation"
                value={draft.organisation}
                disabled={isPending}
                onChange={(event) =>
                  setDraft({ ...draft, organisation: event.target.value })
                }
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.activities.fieldHours} htmlFor="activity-hours">
                <Input
                  id="activity-hours"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={168}
                  value={draft.hoursPerWeek}
                  disabled={isPending}
                  onChange={(event) =>
                    setDraft({ ...draft, hoursPerWeek: event.target.value })
                  }
                />
              </Field>

              <Field label={t.activities.fieldWeeks} htmlFor="activity-weeks">
                <Input
                  id="activity-weeks"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={52}
                  value={draft.weeksPerYear}
                  disabled={isPending}
                  onChange={(event) =>
                    setDraft({ ...draft, weeksPerYear: event.target.value })
                  }
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor="activity-description">
                  {t.activities.fieldDescription}
                </Label>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    remaining < 0 ? "text-viz-rose" : "text-muted-foreground",
                  )}
                >
                  {remaining}
                </span>
              </div>
              <Textarea
                id="activity-description"
                rows={3}
                value={draft.description}
                disabled={isPending}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                className="mt-2"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {fill(t.activities.descriptionHint, {
                  max: ACTIVITY_DESCRIPTION_LIMIT,
                })}
              </p>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-viz-rose-soft px-3 py-2 text-sm text-viz-rose"
            >
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <Button
              type="button"
              size="lg"
              className="h-10 shadow-glow"
              disabled={isPending}
              onClick={submit}
            >
              {isPending ? t.activities.saving : t.activities.save}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10"
              disabled={isPending}
              onClick={close}
            >
              {t.activities.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/** An empty box is "not said", not zero. */
function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}
