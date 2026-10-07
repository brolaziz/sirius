"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/lang-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_COPY } from "@/lib/i18n/content";
import { previewQuestionImport, stageQuestionImport, reviewQuestion, publishTest } from "@/lib/actions/content";

export function ContentImport() {
  const { lang } = useT(); const copy = CONTENT_COPY[lang]; const router = useRouter();
  const [text, setText] = React.useState(""); const [message, setMessage] = React.useState(""); const [pending, start] = React.useTransition();
  const [preview, setPreview] = React.useState<Array<{ externalId: string; title: string; questions: number; explained: number; mapped: number; provenance: boolean }> | null>(null);
  const generation = React.useRef(0);
  function update(value: string) { generation.current++; setText(value); setPreview(null); setMessage(""); }
  async function readFile(file: File | undefined) {
    if (!file) return;
    const revision = ++generation.current; setPreview(null);
    if (file.size > 8_000_000) { setMessage(copy.oversized); return; }
    try { const value = await file.text(); if (generation.current === revision) update(value); }
    catch { setMessage(copy.failed); }
  }
  return <section className="space-y-4 rounded-2xl bg-card p-5 shadow-card sm:p-6">
    <h2 className="text-xl font-bold">{copy.importTitle}</h2><p className="text-sm text-muted-foreground">{copy.help}</p>
    <label className="block text-sm font-medium">{copy.file}<input disabled={pending} type="file" accept=".json,application/json" className="mt-2 block min-h-11 w-full max-w-full text-sm" onChange={(e) => void readFile(e.target.files?.[0])} /></label>
    <Textarea aria-label="JSON" rows={9} maxLength={8_000_000} value={text} disabled={pending} onChange={(e) => update(e.target.value)} className="font-mono text-xs" />
    <div className="flex flex-wrap gap-3"><Button disabled={!text.trim() || pending} variant="outline" onClick={() => start(async () => {
      const revision = generation.current;
      try { const result = await previewQuestionImport(text); if (generation.current !== revision) return;
        if (result.ok) { setPreview(result.tests); setMessage(""); } else { setPreview(null); setMessage(result.error); }
      } catch { setMessage(copy.failed); }
    })}>{copy.preview}</Button>
      <Button disabled={!preview || pending} onClick={() => start(async () => {
        try { const result = await stageQuestionImport(text); if (result.ok) { setPreview(null); setMessage(copy.staged); router.refresh(); } else setMessage(result.error); }
        catch { setMessage(copy.failed); }
      })}>{copy.stage}</Button></div>
    {preview && <ul className="space-y-3 text-sm">{preview.map((test) => <li key={test.externalId} className="rounded-xl border border-border p-4">
      <p className="font-semibold">{test.title}</p><p>{copy.questions}: {test.questions} · {copy.explained}: {test.explained} · {copy.mapped}: {test.mapped}</p>
      <p>{copy.source}: {test.provenance ? copy.present : copy.missing}</p>
    </li>)}</ul>}
    {message && <p role="status" className="whitespace-pre-wrap break-words text-sm">{message}</p>}
  </section>;
}

export function ContentReviewButtons({ id }: { id: string }) {
  const { lang } = useT(); const copy = CONTENT_COPY[lang]; const router = useRouter(); const [pending, start] = React.useTransition(); const [error, setError] = React.useState("");
  return <div className="mt-4 space-y-2"><div className="flex flex-wrap gap-3">
    {(["VERIFIED", "REJECTED"] as const).map((status) => <Button key={status} variant={status === "VERIFIED" ? "default" : "outline"} disabled={pending} onClick={() => start(async () => {
      setError(""); try { const result = await reviewQuestion({ id, status }); if (result.ok) router.refresh(); else setError(result.error); } catch { setError(copy.failed); }
    })}>{status === "VERIFIED" ? copy.approve : copy.reject}</Button>)}
  </div>{error && <p role="status" className="text-sm text-destructive">{error}</p>}</div>;
}

export function ContentPublishButton({ id, published }: { id: string; published: boolean }) {
  const { lang } = useT(); const copy = CONTENT_COPY[lang]; const router = useRouter(); const [pending, start] = React.useTransition(); const [error, setError] = React.useState("");
  return <div><Button variant="outline" disabled={pending} onClick={() => start(async () => {
    setError(""); try { const result = await publishTest({ id, published: !published }); if (result.ok) router.refresh(); else setError(result.error); } catch { setError(copy.failed); }
  })}>{published ? copy.unpublish : copy.publish}</Button>{error && <p role="status" className="mt-2 text-sm text-destructive">{error}</p>}</div>;
}
