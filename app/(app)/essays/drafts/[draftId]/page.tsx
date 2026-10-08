import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftEditor } from "@/components/essays/draft-editor";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { requireUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";
import { ArchiveWorkspaceButton } from "@/components/applications/archive-workspace-button";

export default async function DraftPage({ params }: { params: Promise<{ draftId: string }> }) {
  const userId = await requireUserId(); const { draftId } = await params;
  if (!isDatabaseConfigured()) notFound(); const t = getDictionary(await getLang());
  const draft = await prisma.essayDraft.findFirst({ where: { id: draftId, userId },
    include: { revisions: { orderBy: { version: "desc" }, take: 50, select: { version: true, createdAt: true } } } });
  if (!draft) notFound();
  return <div className="mx-auto max-w-4xl space-y-7">
    <Link href="/essay-editor" className="inline-block min-h-11 text-sm font-medium text-primary">← {t.workspace.myDrafts}</Link>
    {draft.applicationId && <Link href={`/applications/tracker/${draft.applicationId}`} className="ml-5 inline-block min-h-11 text-sm font-medium text-primary">{t.workspace.linkedApplication}</Link>}
    <h1 className="text-3xl font-extrabold tracking-tightest">{t.workspace.draftWorkspace}</h1>
    <section className="rounded-2xl bg-card p-5 shadow-card sm:p-8">{draft.archivedAt ? <div className="space-y-4"><p className="text-sm text-muted-foreground">{t.workspace.archiveHelp}</p><h2 className="font-bold">{draft.title}</h2><p className="whitespace-pre-wrap text-sm">{draft.content}</p><ArchiveWorkspaceButton id={draft.id} revision={draft.revision} kind="draft" archived /></div> : <DraftEditor key={`${draft.id}:${draft.revision}`} initial={{ id: draft.id, revision: draft.revision,
      data: { title: draft.title, prompt: draft.prompt, content: draft.content, wordLimit: draft.wordLimit } }}
      versions={draft.revisions.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() }))} />}</section>
  </div>;
}
