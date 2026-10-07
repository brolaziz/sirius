import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationEditor } from "@/components/applications/application-editor";
import { CreateDraftButton } from "@/components/essays/create-draft-button";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { requireUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";
import { applicationInputSchema } from "@/lib/validation/workspaces";
import { ArchiveWorkspaceButton } from "@/components/applications/archive-workspace-button";

export default async function ApplicationPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const userId = await requireUserId(); const { applicationId } = await params;
  if (!isDatabaseConfigured()) notFound(); const t = getDictionary(await getLang());
  const application = await prisma.personalApplication.findFirst({ where: { id: applicationId, userId },
    include: { drafts: { where: { userId, archivedAt: null }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true } } } });
  if (!application) notFound();
  const activities = await prisma.userActivity.findMany({ where: { userId }, orderBy: { position: "asc" }, select: { id: true, title: true } });
  const parsed = applicationInputSchema.safeParse({ ...application, deadline: application.deadline?.toISOString().slice(0, 10) ?? null,
    activityIds: Array.isArray(application.activityIds) ? application.activityIds.filter((id) => activities.some((a) => a.id === id)) : [] });
  if (!parsed.success) notFound();
  return <div className="mx-auto max-w-3xl space-y-8">
    <Link href="/applications/tracker" className="inline-block min-h-11 text-sm font-medium text-primary">← {t.workspace.tracker}</Link>
    <h1 className="break-words text-3xl font-extrabold tracking-tightest">{application.universityName}</h1>
    <section className="rounded-2xl bg-card p-6 shadow-card sm:p-8">{application.archivedAt ? <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.workspace.archiveHelp}</p><p>{application.intake} · {t.workspace.states[parsed.data.status]}</p><p className="whitespace-pre-wrap text-sm">{application.notes}</p>
      <ArchiveWorkspaceButton id={application.id} revision={application.revision} kind="application" archived />
    </div> : <ApplicationEditor key={`${application.id}:${application.revision}`} initial={{ id: application.id, revision: application.revision, data: parsed.data }} activities={activities} />}</section>
    <section className="rounded-2xl bg-card p-6 shadow-card"><h2 className="mb-5 text-xl font-bold">{t.workspace.myDrafts}</h2>
      {!application.archivedAt && <CreateDraftButton applicationId={application.id} />}
      <ul className="mt-5 space-y-3">{application.drafts.map((draft) => <li key={draft.id}><Link href={`/essays/drafts/${draft.id}`} className="inline-block min-h-11 font-medium text-primary">{draft.title}</Link></li>)}</ul>
      <Link href="/activities" className="mt-4 inline-block min-h-11 text-sm font-medium text-primary">{t.workspace.manageActivities}</Link>
    </section>
  </div>;
}
