import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/user";
import { getLang } from "@/lib/i18n";
import { canEditContent } from "@/lib/content-management";
import { CONTENT_COPY } from "@/lib/i18n/content";
import { ContentImport, ContentPublishButton, ContentReviewButtons } from "@/components/content/content-tools";
import { parseQuestionOptions } from "@/lib/simulator";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const actorId = await requireUserId();
  const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { role: true } });
  if (!canEditContent(actor?.role)) notFound();
  const lang = await getLang(); const copy = CONTENT_COPY[lang];
  const rawPage = Number((await searchParams).page ?? 1);
  const page = Number.isSafeInteger(rawPage) ? Math.min(10000, Math.max(1, rawPage)) : 1;
  // Answer keys are loaded only after the server has checked the current role.
  const [questions, tests, audit] = await Promise.all([
    prisma.question.findMany({ orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * 25, take: 26,
      select: { id: true, questionText: true, passageText: true, passageTitle: true, options: true, correctAnswer: true,
        acceptedAnswers: true, explanation: true, reviewStatus: true, reviewedAt: true,
        skillRef: { select: { code: true } }, test: { select: { title: true, sourceName: true, rightsNote: true } } } }),
    prisma.test.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, title: true, isPublished: true, _count: { select: { questions: true } } } }),
    prisma.contentAuditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 20,
      select: { id: true, action: true, entityId: true, createdAt: true, actor: { select: { name: true, email: true } } } }),
  ]);
  return <div className="mx-auto max-w-5xl space-y-8">
    <header><h1 className="text-3xl font-extrabold tracking-tightest">{copy.title}</h1><p className="mt-2 text-muted-foreground">{copy.body}</p></header>
    <ContentImport />
    <section className="space-y-4"><h2 className="text-xl font-bold">{copy.queue}</h2><p className="text-sm text-muted-foreground">{copy.reviewHelp}</p>
      {!questions.length && <p className="rounded-2xl bg-card p-6">{copy.empty}</p>}
      {questions.slice(0, 25).map((q) => <article key={q.id} className="break-words rounded-2xl bg-card p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{q.test.title} · {q.skillRef?.code ?? copy.missing}</span><span>{copy.statuses[q.reviewStatus]}</span></div>
        {q.passageText && <div className="mt-4 whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm"><p className="font-semibold">{q.passageTitle}</p>{q.passageText}</div>}
        <h3 className="mt-4 whitespace-pre-wrap font-semibold">{q.questionText}</h3>
        <ul className="mt-3 space-y-2 text-sm">{parseQuestionOptions(q.options).map((o) => <li key={o.label}>{o.label}. {o.text}</li>)}</ul>
        <p className="mt-4 text-sm"><strong>{copy.answer}: </strong>{q.correctAnswer}{Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0 && ` (${q.acceptedAnswers.join(", ")})`}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm"><strong>{copy.explanation}: </strong>{q.explanation || copy.missing}</p>
        <p className="mt-3 text-xs text-muted-foreground">{copy.source}: {q.test.sourceName ?? copy.missing} · {q.test.rightsNote ?? copy.missing}</p>
        <ContentReviewButtons id={q.id} />
      </article>)}
      <nav aria-label={copy.queue} className="flex justify-between gap-4 text-sm">
        {page > 1 ? <Link className="inline-flex min-h-11 items-center text-primary" href={`/content?page=${page - 1}`}>{copy.previous}</Link> : <span />}
        {questions.length > 25 && <Link className="inline-flex min-h-11 items-center text-primary" href={`/content?page=${page + 1}`}>{copy.next}</Link>}
      </nav>
    </section>
    <section className="space-y-4"><h2 className="text-xl font-bold">{copy.tests}</h2>
      {actor?.role !== "ADMIN" && <p className="text-sm text-muted-foreground">{copy.editorHelp}</p>}
      {tests.map((test) => <article key={test.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-card p-5 shadow-card">
        <div><h3 className="font-semibold">{test.title}</h3><p className="text-xs text-muted-foreground">{test._count.questions} · {test.isPublished ? copy.published : copy.draft}</p></div>
        {actor?.role === "ADMIN" && <ContentPublishButton id={test.id} published={test.isPublished} />}
      </article>)}
    </section>
    <details className="rounded-2xl bg-card p-5 shadow-card"><summary className="min-h-11 cursor-pointer font-semibold">{copy.audit}</summary>
      <ul className="space-y-3 text-xs text-muted-foreground">{audit.map((event) => <li key={event.id} className="break-words">{event.actor.name ?? event.actor.email} · {event.action} · {event.entityId} · {event.createdAt.toISOString()}</li>)}</ul>
    </details>
  </div>;
}
