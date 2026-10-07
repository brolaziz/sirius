"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Search, GraduationCap, Users, CalendarDays, PenLine, BookMarked, Sparkles, ClipboardList, FilePenLine, UserRound } from "lucide-react";
import { useT } from "@/components/i18n/lang-provider";
import { workspaceTools, type ToolGroup } from "@/lib/workspace-tools";
const icons = { college: GraduationCap, profiles: Users, plan: CalendarDays, practice: PenLine, words: BookMarked, activities: Sparkles, tracker: ClipboardList, essay: FilePenLine, profile: UserRound };
const tones = { sky: "bg-viz-sky-soft text-viz-sky", violet: "bg-viz-violet-soft text-viz-violet", amber: "bg-viz-amber-soft text-viz-amber", emerald: "bg-viz-emerald-soft text-viz-emerald", rose: "bg-viz-rose-soft text-viz-rose" };
export function ToolDirectory({ group, initialQuery = "" }: { group?: ToolGroup; initialQuery?: string }) {
  const { lang } = useT(); const uz = lang === "uz";
  const [query, setQuery] = React.useState(initialQuery);
  const tools = workspaceTools(lang, group, query);
  return <section className="space-y-6">
    <label className="flex max-w-xl items-center gap-3 rounded-2xl border bg-card px-5 py-3"><Search className="size-5 text-muted-foreground" /><span className="sr-only">{uz ? "Vosita qidirish" : "Search tools"}</span><input type="search" className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder={uz ? "Nima qilmoqchisiz? Qidirib toping..." : "What would you like to do?"} value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{tools.map(tool => { const Icon = icons[tool.icon]; return <Link key={tool.href} href={tool.href} className="group flex min-h-52 flex-col rounded-3xl border border-border/60 bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-ring">
      <div className="flex items-center justify-between"><span className={`inline-flex size-14 items-center justify-center rounded-2xl ${tones[tool.tone]}`}><Icon className="size-6" /></span><ArrowUpRight className="size-5 text-muted-foreground transition group-hover:text-primary" /></div>
      <h2 className="mt-5 text-lg font-extrabold">{tool.title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
    </Link>; })}</div>
    {!tools.length && <p role="status" className="rounded-3xl bg-card p-8 text-muted-foreground">{uz ? "Mos vosita topilmadi. Boshqa so‘z bilan qidiring." : "No matching tools. Try a different search."}</p>}
  </section>;
}
