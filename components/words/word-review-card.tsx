"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/lang-provider";
import { rateWordRecall } from "@/lib/actions/workspaces";
import { WORD_RATINGS } from "@/lib/word-review";
import type { VocabularyEntry } from "@/lib/vocabulary";

export function WordReviewCard({ card, production = false }: { card: { id: string; word: string; due: string; entry: VocabularyEntry }; production?: boolean }) {
  const { t, lang } = useT(); const router = useRouter(); const copy = t.recall;
  const [revealed, setRevealed] = React.useState(false); const [pending, startTransition] = React.useTransition(); const [failed, setFailed] = React.useState(false);
  return <article className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
    <p className="text-sm text-muted-foreground">{production ? copy.productionPrompt : copy.prompt}</p><h2 className="mt-5 break-words text-4xl font-extrabold tracking-tightest">{production ? card.entry.translation : card.word}</h2>
    {!revealed ? <Button className="mt-8" onClick={() => setRevealed(true)}>{copy.reveal}</Button> : <>
      <div className="mt-6 rounded-xl bg-muted/50 p-5">
        <p className="text-xl font-bold text-primary">{production ? card.word : card.entry.translation}</p>
        <p className="mt-2 text-sm leading-relaxed">{lang === "uz" ? card.entry.explanationUz : card.entry.explanation}</p>
        <p className="mt-3 text-sm italic text-muted-foreground">{card.entry.example}</p>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">{copy.rateHelp}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {WORD_RATINGS.map((rating) => <Button key={rating} variant={rating === "good" ? "default" : "outline"} className="min-h-12" disabled={pending} onClick={() => startTransition(async () => {
          try {
            const result = await rateWordRecall({ id: card.id, expectedDue: card.due, rating });
            if (result.ok || ("conflict" in result && result.conflict)) router.refresh(); else setFailed(true);
          } catch { setFailed(true); }
        })}>{copy.ratings[rating]}</Button>)}
      </div>
    </>}
    {failed && <p role="status" className="mt-4 text-sm text-destructive">{t.workspace.failed}</p>}
    <p className="mt-6 text-xs text-muted-foreground">{copy.selfRating}</p>
  </article>;
}
