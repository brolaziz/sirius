import Link from "next/link";
import { ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import { requireUserId } from "@/lib/user";
import { getLang } from "@/lib/i18n";
import { getLearningHistory } from "@/lib/queries/progress";

export const metadata = { title: "Insights" };
export default async function InsightsPage() {
  const userId = await requireUserId();
  const uz = await getLang() === "uz";
  const history = await getLearningHistory(userId, 50);
  const mock = history.filter(item => item.kind === "test");
  const practice = history.filter(item => item.kind !== "test");
  return <div className="mx-auto max-w-6xl space-y-7">
    <header><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Essentials · Insights</p><h1 className="mt-3 font-extrabold">{uz ? "Natijalar va tahlil" : "Insights"}</h1><p className="mt-3 text-muted-foreground">{uz ? "Yakunlangan mashqlar va testlaringiz. Har natijadan javoblar tahliliga o‘ting." : "Review your completed practice and tests, then open the answer breakdown."}</p></header>
    <div className="grid gap-4 sm:grid-cols-2">{[
      { title: uz ? "Testlar" : "Tests", count: mock.length },
      { title: uz ? "Mashq va xatolar takrori" : "Practice and mistake reviews", count: practice.length },
    ].map(item => <section key={item.title} className="rounded-2xl border border-border/60 bg-card p-6"><p className="text-sm text-muted-foreground">{item.title}</p><p className="mt-2 text-3xl font-bold">{item.count}</p><p className="mt-2 text-xs text-muted-foreground">{uz ? "Oxirgi 50 yakunlangan sessiya ichida" : "Within your last 50 completed sessions"}</p></section>)}</div>
    <section className="rounded-2xl border border-border/60 bg-card p-6">
      <h2 className="text-lg font-bold">{uz ? "Natijalar tarixi" : "Results history"}</h2>
      {history.length ? <ul className="mt-4 divide-y divide-border">{history.map(item => <li key={`${item.kind}-${item.id}`}><Link href={item.href} className="flex min-h-20 flex-wrap items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="font-semibold break-words">{(uz ? item.titleUz : item.title) || item.title || (uz ? "Aralash mashq" : "Mixed practice")}</p><p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat(uz ? "uz-UZ" : "en-GB", {dateStyle:"medium"}).format(item.finishedAt)} · {item.kind === "test" ? (uz ? "Test" : "Test") : (uz ? "Mashq" : "Practice")}</p></div><div className="flex items-center gap-4"><p className="text-sm font-semibold tabular-nums">{item.correct}/{item.answered}{item.scaledScore !== null && <span className="ml-3 text-muted-foreground">{item.scaledScore} SAT*</span>}</p><ArrowUpRight className="size-4" /></div></Link></li>)}</ul> : <div className="mt-5 rounded-xl bg-muted/50 p-6"><ChartNoAxesCombined className="size-6 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">{uz ? "Hali yakunlangan natija yo‘q." : "No completed results yet."}</p><Link href="/practice" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary">{uz ? "Mashqlarni ochish" : "Open practice"}</Link></div>}
      {mock.some(item => item.scaledScore !== null) && <p className="mt-4 text-xs text-muted-foreground">{uz ? "* SAT ko‘rsatkichi platformadagi taxminiy baholashdir." : "* SAT figures are platform estimates."}</p>}
    </section>
  </div>;
}
