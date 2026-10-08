import Link from "next/link";
import { FilePenLine, ArrowUpRight } from "lucide-react";
import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { getLang } from "@/lib/i18n";
import { CreateDraftButton } from "@/components/essays/create-draft-button";

export const metadata = { title: "Essay editor" };
export default async function EssayEditorDirectory({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const userId = await requireUserId(); const uz = await getLang() === "uz"; const archived = (await searchParams).archived === "1";
  const drafts = await prisma.essayDraft.findMany({ where: { userId, archivedAt: archived ? { not: null } : null }, orderBy: { updatedAt: "desc" }, take: 100, select: { id: true, title: true, revision: true, updatedAt: true } });
  return <div className="mx-auto max-w-6xl space-y-7"><header className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Apply · Essay editor</p><h1 className="mt-3 font-extrabold">{uz ? "Insho editori" : "Essay editor"}</h1><p className="mt-3 text-muted-foreground">{uz ? "Shaxsiy qoralamalar, so‘z limiti va versiyalar tarixi." : "Private drafts, word limits and version history."}</p></div><CreateDraftButton /></header>
    <div className="flex flex-wrap gap-3"><Link href={archived ? "/essay-editor" : "/essay-editor?archived=1"} className="inline-flex min-h-11 items-center rounded-full border bg-card px-5 text-sm font-semibold">{uz ? (archived ? "Faol qoralamalar" : "Arxiv") : (archived ? "Active drafts" : "Archive")}</Link><Link href="/essays" className="inline-flex min-h-11 items-center px-4 text-sm font-semibold text-primary">{uz ? "Insho namunalari" : "Essay library"}<ArrowUpRight className="ml-2 size-4" /></Link></div>
    {drafts.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{drafts.map(draft => <Link key={draft.id} href={`/essays/drafts/${draft.id}`} className="rounded-2xl border border-border/60 bg-card p-6 transition hover:shadow-card-hover"><FilePenLine className="size-6 text-primary" /><h2 className="mt-5 text-lg font-semibold break-words">{draft.title}</h2><p className="mt-2 text-xs text-muted-foreground">{uz ? "Versiya" : "Version"} {draft.revision} · {new Intl.DateTimeFormat(uz ? "uz-UZ" : "en-GB", {dateStyle:"medium"}).format(draft.updatedAt)}</p></Link>)}</div> : <section className="rounded-2xl border border-dashed bg-card p-8"><FilePenLine className="size-7 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">{uz ? (archived ? "Arxiv bo‘sh" : "Qoralama yo‘q") : (archived ? "Archive is empty" : "No drafts yet")}</h2><p className="mt-2 text-sm text-muted-foreground">{uz ? "Yangi qoralama yarating yoki mavjud insho ustida ishlashni davom ettiring." : "Create a draft or continue working on an existing essay."}</p></section>}
  </div>;
}
