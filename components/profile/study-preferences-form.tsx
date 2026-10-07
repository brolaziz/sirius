"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/i18n/lang-provider";
import { setStudyPreferences } from "@/lib/actions/profile";
import { studyPreferencesSchema } from "@/lib/validation/study-preferences";

export function StudyPreferencesForm({ initial }: { initial: {
  currentScore: number | null; targetScore: number | null; examDate: string; weeklyStudyMinutes: number;
} }) {
  const { t } = useT();
  const router = useRouter();
  const [draft, setDraft] = React.useState({ currentScore: initial.currentScore === null ? "" : String(initial.currentScore),
    targetScore: initial.targetScore === null ? "" : String(initial.targetScore), examDate: initial.examDate, weeklyStudyMinutes: String(initial.weeklyStudyMinutes) });
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const fields = [
    { key: "currentScore" as const, label: t.onboarding.currentLabel, type: "number", min: 400, max: 1600, step: 10 },
    { key: "targetScore" as const, label: t.dash.targetLabel, type: "number", min: 400, max: 1600, step: 10 },
    { key: "examDate" as const, label: t.onboarding.dateLabel, type: "date" },
    { key: "weeklyStudyMinutes" as const, label: t.settings.weeklyMinutes, type: "number", min: 30, max: 2100, step: 15 },
  ];
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = studyPreferencesSchema.safeParse({ currentScore: draft.currentScore.trim() ? Number(draft.currentScore) : null,
      targetScore: Number(draft.targetScore), examDate: draft.examDate, weeklyStudyMinutes: Number(draft.weeklyStudyMinutes) });
    if (!parsed.success) { setError(t.settings.invalid); return; }
    setError(null);
    startTransition(async () => {
      try {
        const result = await setStudyPreferences(parsed.data);
        if (!result.ok) { setError(t.settings.failed); return; }
        if (result.planRebuilt) toast.success(t.settings.saved);
        else toast.warning(t.profile.planFailed);
        router.refresh();
      } catch { setError(t.settings.failed); }
    });
  }
  return <form onSubmit={submit} className="mt-6 space-y-5">
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map((field) => <div key={field.key} className="min-w-0 space-y-2">
        <Label htmlFor={`goal-${field.key}`}>{field.label}</Label>
        <Input id={`goal-${field.key}`} type={field.type} min={field.min} max={field.max} step={field.step}
          value={draft[field.key]} required={field.key !== "currentScore"} disabled={pending}
          aria-describedby={field.key === "currentScore" ? "baseline-help" : undefined}
          onChange={(event) => setDraft((previous) => ({ ...previous, [field.key]: event.target.value }))} />
      </div>)}
    </div>
    <p id="baseline-help" className="text-xs leading-relaxed text-muted-foreground">{t.settings.baselineHelp}</p>
    <p className="text-xs leading-relaxed text-muted-foreground">{t.settings.planHelp}</p>
    <div role="status" aria-live="polite" className="text-sm text-destructive">{error}</div>
    <Button type="submit" disabled={pending}>{pending ? t.dash.saving : t.dash.save}</Button>
  </form>;
}
