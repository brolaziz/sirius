"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/i18n/lang-provider";
import { savePersonalEssay, restorePersonalEssay } from "@/lib/actions/workspaces";
import { draftInputSchema, type DraftInput } from "@/lib/validation/workspaces";
import { ArchiveWorkspaceButton } from "@/components/applications/archive-workspace-button";

export function DraftEditor({ initial, versions }: { initial: { id: string; revision: number; data: DraftInput }; versions: Array<{ version: number; createdAt: string }> }) {
  const { t, lang } = useT(); const copy = t.workspace; const router = useRouter();
  const [archiving, setArchiving] = React.useState(false);
  const [draft, setDraft] = React.useState(initial.data);
  const [savedSignature, setSavedSignature] = React.useState(JSON.stringify(initial.data));
  const [state, setState] = React.useState<"saved" | "saving" | "error" | "conflict">("saved");
  const [version, setVersion] = React.useState(versions[0]?.version ?? 0);
  const [currentRevision, setCurrentRevision] = React.useState(initial.revision);
  const revisionRef = React.useRef(initial.revision); const busyRef = React.useRef(false);
  const signature = JSON.stringify(draft); const dirty = signature !== savedSignature;
  const count = draft.content.trim() ? draft.content.trim().split(/\s+/u).length : 0;
  const flush = React.useCallback(async (snapshot: DraftInput) => {
    if (busyRef.current || archiving) return;
    if (!draftInputSchema.safeParse(snapshot).success) { setState("error"); return; }
    busyRef.current = true; setState("saving");
    try {
      const result = await savePersonalEssay({ id: initial.id, revision: revisionRef.current, data: snapshot });
      if (!result.ok) { setState("conflict" in result && result.conflict ? "conflict" : "error"); return; }
      revisionRef.current = result.revision; setCurrentRevision(result.revision); setSavedSignature(JSON.stringify(snapshot)); setState("saved");
    } catch { setState("error"); }
    finally { busyRef.current = false; }
  }, [initial.id, archiving]);
  React.useEffect(() => {
    if (!dirty || state !== "saved" || archiving) return;
    const timer = setTimeout(() => { void flush(draft); }, 1500);
    return () => clearTimeout(timer);
  }, [draft, dirty, flush, savedSignature, state, archiving]);
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function restore() {
    if (dirty || busyRef.current) return;
    busyRef.current = true; setState("saving");
    try {
      const result = await restorePersonalEssay({ id: initial.id, revision: revisionRef.current, version });
      if (result.ok) { revisionRef.current = result.revision; setCurrentRevision(result.revision); setState("saved"); router.refresh(); }
      else setState("conflict" in result && result.conflict ? "conflict" : "error");
    } catch { setState("error"); } finally { busyRef.current = false; }
  }
  return <div className="space-y-5">
    <ArchiveWorkspaceButton id={initial.id} revision={currentRevision} kind="draft" archived={false} onPendingChange={setArchiving} disabled={archiving || dirty || state === "saving" || state === "conflict"} />
    <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
      <div className="space-y-2"><Label htmlFor="draft-title">{copy.draftTitle}</Label><Input disabled={archiving} id="draft-title" value={draft.title} maxLength={200} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="draft-limit">{copy.wordLimit}</Label><Input disabled={archiving} id="draft-limit" type="number" min={1} max={10000} value={draft.wordLimit ?? ""} onChange={(e) => setDraft((p) => ({ ...p, wordLimit: e.target.value ? Number(e.target.value) : null }))} /></div>
    </div>
    <div className="space-y-2"><Label htmlFor="draft-prompt">{copy.prompt}</Label><Textarea disabled={archiving} id="draft-prompt" rows={3} maxLength={5000} value={draft.prompt} onChange={(e) => setDraft((p) => ({ ...p, prompt: e.target.value }))} /></div>
    <div className="space-y-2"><Label htmlFor="draft-body">{copy.draftBody}</Label><Textarea disabled={archiving} id="draft-body" rows={22} maxLength={60000} className="text-base leading-7" value={draft.content} onChange={(e) => setDraft((p) => ({ ...p, content: e.target.value }))} /></div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className={draft.wordLimit && count > draft.wordLimit ? "text-destructive tabular-nums" : "text-muted-foreground tabular-nums"}>{count}{draft.wordLimit ? ` / ${draft.wordLimit}` : ""} {copy.words}</p>
      <p role="status" aria-live="polite" className="text-muted-foreground">{state === "conflict" ? copy.conflict : state === "error" ? copy.failed : state === "saving" ? t.saveStatus.saving : dirty ? t.saveStatus.pending : t.saveStatus.saved}</p>
      <Button disabled={archiving || !dirty || state === "saving" || state === "conflict"} onClick={() => void flush(draft)}>{t.dash.save}</Button>
    </div>
    <p className="text-xs text-muted-foreground">{copy.privateHelp}</p>
    <section className="border-t border-border pt-5">
      <h2 className="text-sm font-semibold">{copy.revisions}</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        <select aria-label={copy.revisions} className="min-h-11 max-w-full rounded-md border border-input bg-background px-3 text-sm" value={version} onChange={(e) => setVersion(Number(e.target.value))}>
          {versions.map((v) => <option key={v.version} value={v.version}>{copy.version} {v.version} · {new Intl.DateTimeFormat(lang === "uz" ? "uz-UZ" : "en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tashkent" }).format(new Date(v.createdAt))}</option>)}
        </select>
        <Button variant="outline" disabled={archiving || dirty || state === "saving" || state === "conflict" || version === currentRevision} onClick={() => void restore()}>{copy.restore}</Button>
        <Button variant="ghost" disabled={archiving || dirty || state === "saving"} onClick={() => router.refresh()}>{copy.refreshHistory}</Button>
      </div>
    </section>
  </div>;
}
