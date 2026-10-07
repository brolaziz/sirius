import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { requireUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";
import { checklistSchema } from "@/lib/validation/workspaces";

export const metadata = { title: "My applications" };
export default async function TrackerPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const userId = await requireUserId(); const lang = await getLang(); const t = getDictionary(lang);
  const archived = (await searchParams).archived === "1";
  const applications = isDatabaseConfigured() ? await prisma.personalApplication.findMany({ where: { userId, archivedAt: archived ? { not: null } : null },
    orderBy: [{ deadline: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }], take: 200,
    select: { id: true, universityName: true, intake: true, status: true, deadline: true, checklist: true } }) : [];
  return <div className="mx-auto max-w-5xl space-y-8">
    <div className="flex flex-wrap items-start justify-between gap-5"><div>
      <h1 className="text-4xl font-extrabold tracking-tightest">{t.workspace.tracker}</h1><p className="mt-3 max-w-xl text-muted-foreground">{t.workspace.trackerHelp}</p>
    </div><Button asChild><Link href="/applications/tracker/new">{t.workspace.newApplication}</Link></Button></div>
    <Link href={archived ? "/applications/tracker" : "/applications/tracker?archived=1"} className="inline-flex min-h-11 items-center text-sm font-medium text-primary">{archived ? t.workspace.activeItems : t.workspace.archivedItems}</Link>
    {!applications.length ? <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-muted-foreground">{t.workspace.applicationsEmpty}</p>
      : <ul className="grid gap-5 sm:grid-cols-2">{applications.map((row) => {
        const parsed = checklistSchema.safeParse(row.checklist); const checklist = parsed.success ? parsed.data : [];
        const label = t.workspace.states[row.status as keyof typeof t.workspace.states] ?? row.status;
        return <li key={row.id}><Link href={`/applications/tracker/${row.id}`} className="block h-full rounded-2xl bg-card p-6 shadow-card hover:shadow-card-hover">
          <p className="text-xs font-semibold text-primary">{label} · {row.intake}</p><h2 className="mt-3 break-words text-xl font-bold">{row.universityName}</h2>
          <p className="mt-4 text-sm text-muted-foreground">{t.workspace.checklist}: {checklist.filter((item) => item.done).length}/{checklist.length}</p>
          {row.deadline && <p className="mt-2 text-sm text-muted-foreground">{t.workspace.deadline}: {new Intl.DateTimeFormat(lang === "uz" ? "uz-UZ" : "en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(row.deadline)}</p>}
        </Link></li>;
      })}</ul>}
    <Link href="/applications" className="inline-block min-h-11 text-sm font-medium text-primary">{t.workspace.viewOutcomes}</Link>
  </div>;
}
