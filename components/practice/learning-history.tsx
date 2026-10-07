import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import type { LearningHistoryEntry } from "@/lib/queries/progress";
import type { Lang } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function LearningHistory({ entries, lang, t }: { entries: LearningHistoryEntry[]; lang: Lang; t: Dictionary }) {
  return <section>
    <h2 className="text-sm font-semibold text-muted-foreground">{t.pages.practiceHistory}</h2>
    {!entries.length ? <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
      <History className="size-5 shrink-0 text-muted-foreground" /><p className="text-sm text-muted-foreground">{t.pages.practiceHistoryEmpty}</p>
    </div> : <ul className="mt-5 divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-card">
      {entries.map((entry) => <li key={`${entry.kind}:${entry.id}`}>
        <Link href={entry.href} className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-muted/60">
          <div className="min-w-0 flex-1 basis-48">
            <p className="break-words text-sm font-medium">{(lang === "uz" ? entry.titleUz ?? entry.title : entry.title) || (entry.kind === "review" ? t.progress.mistakes : t.progress.mixed)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{entry.kind === "test" ? t.progress.test : t.progress.topicPractice}
              {" · "}{new Intl.DateTimeFormat(lang === "uz" ? "uz-UZ" : "en-GB", { dateStyle: "medium", timeZone: "Asia/Tashkent" }).format(entry.finishedAt)}</p>
          </div>
          <div className="flex items-center gap-5 text-sm tabular-nums">
            <span>{entry.correct}/{entry.answered}</span>
            {entry.scaledScore !== null && <span>{t.dash.estimated}: {entry.scaledScore}</span>}
            <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </div>
        </Link>
      </li>)}
    </ul>}
  </section>;
}
