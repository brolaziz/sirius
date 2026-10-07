import { ApplicationEditor } from "@/components/applications/application-editor";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { requireUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";

export default async function NewApplicationPage({ searchParams }: { searchParams: Promise<{ universityId?: string }> }) {
  const userId = await requireUserId(); const t = getDictionary(await getLang());
  const universityId = (await searchParams).universityId;
  const [activities, shortlist] = isDatabaseConfigured() ? await Promise.all([
    prisma.userActivity.findMany({ where: { userId }, orderBy: { position: "asc" }, select: { id: true, title: true } }),
    prisma.universityShortlistEntry.findMany({ where: { userId }, select: { university: { select: { name: true } } } }),
  ]) : [[], []];
  const selected = isDatabaseConfigured() && universityId && universityId.length <= 60 ? await prisma.university.findUnique({ where: { id: universityId }, select: { name: true } }) : null;
  return <div className="mx-auto max-w-3xl space-y-8"><h1 className="text-4xl font-extrabold tracking-tightest">{t.workspace.newApplication}</h1>
    <section className="rounded-2xl bg-card p-6 shadow-card sm:p-8"><ApplicationEditor key={selected?.name ?? "new"} initial={null} prefillName={selected?.name} activities={activities} suggestions={shortlist.map((entry) => entry.university.name)} /></section>
  </div>;
}
