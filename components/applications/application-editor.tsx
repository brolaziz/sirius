"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/components/i18n/lang-provider";
import { savePersonalApplication } from "@/lib/actions/workspaces";
import { APPLICATION_STATES, applicationInputSchema, type ApplicationInput } from "@/lib/validation/workspaces";
import { ArchiveWorkspaceButton } from "@/components/applications/archive-workspace-button";

export function ApplicationEditor({ initial, activities, suggestions = [], prefillName = "" }: {
  initial: { id: string; revision: number; data: ApplicationInput } | null;
  activities: Array<{ id: string; title: string }>; suggestions?: string[];
  prefillName?: string;
}) {
  const { t } = useT(); const copy = t.workspace; const router = useRouter();
  const [draft, setDraft] = React.useState<ApplicationInput>(() => initial?.data ?? {
    universityName: prefillName, intake: "", deadline: null, status: "PLANNING", notes: "", activityIds: [],
    checklist: copy.defaultChecklist.map((title, n) => ({ id: `item-${n}`, title, done: false })),
  });
  const [archiving, setArchiving] = React.useState(false);
  const [revision, setRevision] = React.useState(initial?.revision ?? 0);
  const [savedSignature, setSavedSignature] = React.useState(initial ? JSON.stringify(initial.data) : "");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [conflict, setConflict] = React.useState(false);
  function set<K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) { setDraft((prev) => ({ ...prev, [key]: value })); }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!applicationInputSchema.safeParse(draft).success) { setError(copy.invalid); return; }
    startTransition(async () => {
      try {
        const result = await savePersonalApplication({ id: initial?.id ?? null, revision, data: draft });
        if (!result.ok) { const stale = "conflict" in result && result.conflict; setConflict(!!stale); setError(stale ? copy.conflict : copy.failed); return; }
        setRevision(result.revision); setError(null); toast.success(copy.saved);
        setSavedSignature(JSON.stringify(draft));
        if (!initial) router.replace(`/applications/tracker/${result.id}`);
        else router.refresh();
      } catch { setError(copy.failed); }
    });
  }
  return <form onSubmit={submit} className="space-y-6">
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="application-university">{copy.university}</Label>
        <Input id="application-university" list="shortlisted-universities" required maxLength={300} value={draft.universityName} disabled={archiving || pending} onChange={(e) => set("universityName", e.target.value)} />
        <datalist id="shortlisted-universities">{suggestions.map((name) => <option key={name} value={name} />)}</datalist>
      </div>
      <div className="space-y-2"><Label htmlFor="application-intake">{copy.intake}</Label><Input id="application-intake" required maxLength={80} placeholder="2027 Fall" value={draft.intake} disabled={archiving || pending} onChange={(e) => set("intake", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="application-deadline">{copy.deadline}</Label><Input id="application-deadline" type="date" value={draft.deadline ?? ""} disabled={archiving || pending} onChange={(e) => set("deadline", e.target.value || null)} /></div>
      <div className="space-y-2"><Label htmlFor="application-status">{copy.status}</Label>
        <select id="application-status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" disabled={archiving || pending} value={draft.status} onChange={(e) => set("status", e.target.value as ApplicationInput["status"])}>
          {APPLICATION_STATES.map((state) => <option key={state} value={state}>{copy.states[state]}</option>)}
        </select>
      </div>
    </div>
    <p className="text-xs text-muted-foreground">{copy.deadlineHelp}</p>
    <fieldset className="space-y-3"><legend className="mb-3 text-sm font-semibold">{copy.checklist}</legend>
      {draft.checklist.map((item, n) => <div key={item.id} className="flex items-center gap-3">
        <label className="flex min-h-11 min-w-11 items-center justify-center"><input type="checkbox" className="size-4 accent-primary" disabled={archiving || pending} checked={item.done} aria-label={item.title} onChange={(e) => set("checklist", draft.checklist.map((row, i) => i === n ? { ...row, done: e.target.checked } : row))} /></label>
        <Input aria-label={copy.documentName} maxLength={120} required disabled={archiving || pending} value={item.title} onChange={(e) => set("checklist", draft.checklist.map((row, i) => i === n ? { ...row, title: e.target.value } : row))} />
        <Button type="button" variant="ghost" className="min-h-11" disabled={archiving || pending} onClick={() => set("checklist", draft.checklist.filter((_, i) => i !== n))}>{copy.remove}</Button>
      </div>)}
      <Button type="button" variant="outline" disabled={archiving || pending || draft.checklist.length >= 30} onClick={() => set("checklist", [...draft.checklist, { id: crypto.randomUUID(), title: copy.newDocument, done: false }])}>{copy.addDocument}</Button>
    </fieldset>
    <fieldset><legend className="mb-2 text-sm font-semibold">{copy.activities}</legend>
      {!activities.length && <p className="text-sm text-muted-foreground">{copy.activitiesEmpty}</p>}
      {activities.map((activity) => <label key={activity.id} className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" className="size-4 accent-primary" disabled={archiving || pending} checked={draft.activityIds.includes(activity.id)} onChange={(e) => set("activityIds", e.target.checked ? [...draft.activityIds, activity.id] : draft.activityIds.filter((id) => id !== activity.id))} />{activity.title}
      </label>)}
    </fieldset>
    <div className="space-y-2"><Label htmlFor="application-notes">{copy.notes}</Label><Textarea id="application-notes" rows={4} maxLength={4000} value={draft.notes} disabled={archiving || pending} onChange={(e) => set("notes", e.target.value)} /></div>
    <p role="status" aria-live="polite" className="text-sm text-destructive">{error}</p>
    <Button disabled={archiving || pending || conflict} type="submit">{pending ? t.dash.saving : t.dash.save}</Button>
    {initial && <ArchiveWorkspaceButton id={initial.id} revision={revision} kind="application" archived={false} onPendingChange={setArchiving} disabled={archiving || pending || conflict || JSON.stringify(draft) !== savedSignature} />}
  </form>;
}
