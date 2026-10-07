import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Compass, CalendarClock, GraduationCap, FilePenLine, ClipboardList, BookMarked, Sparkles, ArrowRight } from "lucide-react";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getWorkspaceOverview } from "@/lib/queries/workspace";
import { getLang } from "@/lib/i18n";
import { displayName } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { StartTestCard } from "@/components/dashboard/start-test-card";
import { UniversitiesCard } from "@/components/dashboard/universities-card";
export const metadata: Metadata = { title: "My workspace" };
export default async function DashboardPage() {
 const data = await getDashboardData(); const lang = await getLang(); const uz = lang === "uz";
 const overview = data.user && data.databaseReady ? await getWorkspaceOverview(prisma, data.user.id) : null;
 const quick = [
  { href: "/universities", title: uz ? "Universitet topish" : "Discover colleges", icon: GraduationCap, tone: "bg-viz-sky-soft text-viz-sky" },
  { href: "/activities", title: uz ? "Profilni kuchaytirish" : "Build your profile", icon: Sparkles, tone: "bg-viz-emerald-soft text-viz-emerald" },
  { href: "/essays", title: uz ? "Insho yozish" : "Write my story", icon: FilePenLine, tone: "bg-viz-rose-soft text-viz-rose" },
  { href: "/applications/tracker", title: uz ? "Arizalarni tartiblash" : "Organize applications", icon: ClipboardList, tone: "bg-viz-violet-soft text-viz-violet" },
 ];
 const metrics = [
  { label: uz ? "Saqlangan universitetlar" : "Saved colleges", value: data.shortlistCount, href: "/universities", icon: GraduationCap },
  { label: uz ? "Mening arizalarim" : "My applications", value: overview?.applicationCount ?? 0, href: "/applications/tracker", icon: ClipboardList },
  { label: uz ? "Insho qoralamalari" : "Essay drafts", value: overview?.draftCount ?? 0, href: "/essays", icon: FilePenLine },
  { label: uz ? "Saqlangan so‘zlar" : "Saved words", value: data.savedWordCount, href: "/words", icon: BookMarked },
 ];
 return <div className="mx-auto max-w-6xl space-y-7">
  <header className="workspace-intro relative overflow-hidden">
   <div className="relative z-10 max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-widest text-primary">{uz ? "Sizning kelajagingiz shu yerdan boshlanadi" : "Your next chapter starts here"}</p>
    <h1 className="mt-3 font-extrabold">{uz ? "Salom" : "Welcome back"}, {displayName(data.user)} <span aria-hidden="true">✦</span></h1>
    <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{uz ? "Har kuni bitta kichik qadam. O‘zingizga mos universitetni toping, hikoyangizni yozing va arizangizni bir joyda yig‘ing." : "One small step each day. Find your colleges, tell your story and bring your application together in one place."}</p>
    <Link href="/explore" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold text-primary-foreground">{uz ? "Keyingi qadamim" : "Find my next step"}<ArrowUpRight className="size-4" /></Link>
   </div><Compass aria-hidden="true" className="absolute top-8 right-6 hidden size-36 rotate-12 text-primary/10 xl:block" />
  </header>
  <section className="rounded-3xl bg-card p-5 shadow-card sm:p-7"><div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold">{uz ? "Bugun nima qilamiz?" : "What shall we work on?"}</h2><p className="mt-1 text-sm text-muted-foreground">{uz ? "Maqsadingizga olib boradigan yo‘lni tanlang." : "Pick the path that moves you forward."}</p></div><Link href="/explore" className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-primary">{uz ? "Barchasi" : "All tools"}<ArrowRight className="size-3.5" /></Link></div>
   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{quick.map(item => <Link key={item.href} href={item.href} className={`flex min-h-24 items-center gap-3 rounded-2xl border-b-4 border-black/5 p-4 font-extrabold transition hover:-translate-y-1 ${item.tone}`}><item.icon className="size-7 shrink-0" /><span className="text-sm">{item.title}</span></Link>)}</div>
  </section>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric => <Link key={metric.href} href={metric.href} className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-card transition hover:shadow-card-hover"><span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary"><metric.icon className="size-5" /></span><div><p className="text-2xl font-extrabold tabular-nums">{data.databaseReady ? metric.value : "—"}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{metric.label}</p></div></Link>)}</div>
  <div className="grid gap-5 xl:grid-cols-5">
   <section className="rounded-3xl bg-viz-amber-soft p-6 xl:col-span-2"><CalendarClock className="size-7 text-viz-amber" /><h2 className="mt-4 text-xl font-extrabold">{uz ? "Keyingi deadline" : "Your next deadline"}</h2>
    {overview?.deadline ? <><p className="mt-3 text-2xl font-extrabold">{new Intl.DateTimeFormat(uz ? "uz-UZ" : "en-GB", {dateStyle:"medium",timeZone:"UTC"}).format(overview.deadline.deadline!)}</p><p className="mt-1 text-sm">{overview.deadline.universityName}</p><Link href={`/applications/tracker/${overview.deadline.id}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-5 text-sm font-bold">{uz ? "Arizani davom ettirish" : "Continue application"}<ArrowRight className="size-4" /></Link></> : <><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{uz ? "Arizangizga deadline qo‘shing. Eng yaqin sanani shu yerda eslatamiz." : "Add a deadline to an application. Your next date will appear here."}</p><Link href="/applications/tracker" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-5 text-sm font-bold">{uz ? "Arizalarimni ochish" : "Open my applications"}<ArrowRight className="size-4" /></Link></>}
   </section>
   <section className="rounded-3xl bg-card p-6 shadow-card xl:col-span-3"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-extrabold">{uz ? "Hikoyangiz davom etadi" : "Your story continues"}</h2><Link href="/essays" className="inline-flex min-h-11 items-center text-xs font-bold text-primary">{uz ? "Insholarim" : "My essays"}</Link></div>
    {overview?.drafts.length ? <ul className="mt-4 space-y-3">{overview.drafts.map(draft => <li key={draft.id}><Link href={`/essays/drafts/${draft.id}`} className="flex min-h-16 items-center justify-between gap-4 rounded-2xl bg-muted/70 p-4 text-sm font-bold"><span className="min-w-0 break-words">{draft.title}</span><ArrowUpRight className="size-4 shrink-0 text-primary" /></Link></li>)}</ul> : <div className="mt-4 rounded-2xl bg-viz-rose-soft p-5"><FilePenLine className="size-7 text-viz-rose" /><p className="mt-3 text-sm text-muted-foreground">{uz ? "Bir fikrdan boshlang. Qoralamalar va ularning versiyalari shu yerda saqlanadi." : "Start with one idea. Keep your drafts and their versions here."}</p><Link className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-primary" href="/essays">{uz ? "Birinchi qoralamam" : "My first draft"}<ArrowRight className="size-4" /></Link></div>}
   </section>
  </div>
  <section className="rounded-3xl bg-card p-6 shadow-card"><h2 className="text-xl font-extrabold">{uz ? "Arizagacha bo‘lgan yo‘l" : "Your application journey"}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{quick.map((item,index)=><Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl bg-muted/60 p-4"><span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-xs font-extrabold text-primary">{index+1}</span><span className="text-xs font-bold">{item.title}</span><ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Link>)}</div></section>
  <div className="grid gap-5 lg:grid-cols-2"><UniversitiesCard universities={data.shortlisted} total={data.shortlistCount} /><StartTestCard action={data.todayAction} className="min-h-60" /></div>
 </div>;
}
