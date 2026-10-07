import Link from "next/link";
import { WordReviewCard } from "@/components/words/word-review-card";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { requireUserId } from "@/lib/user";
import { lookupWord } from "@/lib/vocabulary";
import { getDictionary, getLang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/config";

export default async function WordReviewPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const userId = await requireUserId(); const t = getDictionary(await getLang());
  const production = (await searchParams).mode === "production";
  const words = isDatabaseConfigured() ? await prisma.savedWord.findMany({ where: { userId, nextReviewAt: { lte: new Date() } },
    orderBy: [{ nextReviewAt: "asc" }, { id: "asc" }], take: 500, select: { id: true, word: true, nextReviewAt: true } }) : [];
  const cards = words.flatMap((word) => { const entry = lookupWord(word.word); return entry ? [{ id: word.id, word: word.word, due: word.nextReviewAt.toISOString(), entry }] : []; });
  return <div className="mx-auto max-w-3xl space-y-8">
    <Link href="/words" className="inline-block min-h-11 text-sm font-medium text-primary">← {t.app.myWords}</Link>
    <div><h1 className="text-4xl font-extrabold tracking-tightest">{t.recall.title}</h1><p className="mt-3 text-muted-foreground">{cards.length ? fill(t.recall.dueCount, { count: cards.length }) : t.recall.empty}</p></div>
    <nav aria-label={t.recall.title} className="flex flex-wrap gap-3 text-sm">
      <Link aria-current={!production ? "page" : undefined} className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground" href="/words/review">{t.recall.recognition}</Link>
      <Link aria-current={production ? "page" : undefined} className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground" href="/words/review?mode=production">{t.recall.production}</Link>
    </nav>
    {cards[0] && <WordReviewCard key={cards[0].id + cards[0].due + production} card={cards[0]} production={production} />}
    <p className="text-xs leading-relaxed text-muted-foreground">{t.recall.dictionaryHelp}</p>
  </div>;
}
