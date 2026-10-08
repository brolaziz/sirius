import Link from "next/link";
import { ArrowUpRight, Check, Circle } from "lucide-react";
import { requireUserId } from "@/lib/user";
import { getLang } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOverview } from "@/lib/queries/workspace";
import { checklistSchema } from "@/lib/validation/workspaces";

export const metadata = { title: "Admissions analysis" };
export default async function AdmissionsAnalysisPage() {
  const userId = await requireUserId(); const uz = await getLang() === "uz";
  const [overview, shortlist, applications] = await Promise.all([
    getWorkspaceOverview(prisma, userId),
    prisma.universityShortlistEntry.count({ where: { userId } }),
    prisma.personalApplication.findMany({ where: { userId, archivedAt: null }, orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }], take: 100, select: { id: true, universityName: true, deadline: true, checklist: true, status: true } }),
  ]);
  const checks = [
    { label: uz ? "Universitetlar saqlangan" : "College shortlist", count: shortlist, href: "/universities" },
    { label: uz ? "Faoliyatlar kiritilgan" : "Activities recorded", count: overview.activityCount, href: "/activities" },
    { label: uz ? "Insho qoralamalari" : "Essay drafts", count: overview.draftCount, href: "/essay-editor" },
    { label: uz ? "Arizalar yaratilgan" : "Applications created", count: overview.applicationCount, href: "/applications/tracker" },
  ];
  return <div className="mx-auto max-w-6xl space-y-7"><header><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Essentials · Admissions</p><h1 className="mt-3 font-extrabold">{uz ? "Ariza tayyorgarligi tahlili" : "Admissions preparation analysis"}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{uz ? "Profilingizdagi ishlar va o‘zingiz belgilagan checklistlar bo‘yicha holat." : "A review of your recorded work and application checklists."}</p></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{checks.map(item => <Link key={item.href} href={item.href} className="rounded-2xl border border-border/60 bg-card p-5"><div className="flex items-center justify-between">{item.count > 0 ? <Check className="size-5 text-viz-emerald" /> : <Circle className="size-5 text-muted-foreground" />}<ArrowUpRight className="size-4 text-muted-foreground" /></div><h2 className="mt-4 text-sm font-semibold">{item.label}</h2><p className="mt-2 text-2xl font-bold">{item.count}</p></Link>)}</div>
    <section className="rounded-2xl border border-border/60 bg-card p-6"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-bold">{uz ? "Universitet bo‘yicha checklist" : "Application checklists"}</h2><Link href="/applications/tracker" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">{uz ? "Arizalarim" : "My applications"}</Link></div>
      {applications.length ? <ul className="mt-4 space-y-3">{applications.map(application => {
        const parsed = checklistSchema.safeParse(application.checklist); const items = parsed.success ? parsed.data : []; const done = items.filter(item => item.done).length;
        return <li key={application.id}><Link href={`/applications/tracker/${application.id}`} className="flex min-h-20 flex-wrap items-center justify-between gap-4 rounded-xl bg-muted/50 p-4"><div className="min-w-0"><p className="font-semibold break-words">{application.universityName}</p><p className="mt-1 text-xs text-muted-foreground">{application.deadline ? new Intl.DateTimeFormat(uz ? "uz-UZ" : "en-GB", {dateStyle:"medium",timeZone:"UTC"}).format(application.deadline) : (uz ? "Deadline belgilanmagan" : "No deadline set")}</p></div><div className="flex items-center gap-3"><span className="text-sm tabular-nums">{items.length ? `${done}/${items.length}` : (uz ? "Checklist bo‘sh" : "No checklist")}</span><ArrowUpRight className="size-4" /></div></Link></li>;
      })}</ul> : <p className="mt-4 rounded-xl bg-muted/50 p-5 text-sm text-muted-foreground">{uz ? "Ariza yaratilgach, uning vazifalari va muddatlari shu yerda ko‘rinadi." : "Create an application to see its tasks and deadlines here."}</p>}
      {overview.applicationCount > applications.length && <p className="mt-4 text-xs text-muted-foreground">{uz ? "Birinchi 100 ariza ko‘rsatilmoqda. To‘liq ro‘yxat uchun arizalar bo‘limini oching." : "Showing the first 100 applications. Open your applications for the full list."}</p>}
    </section>
  </div>;
}
