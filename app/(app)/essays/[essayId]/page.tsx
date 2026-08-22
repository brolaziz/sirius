/**
 * One essay.
 *
 * The body arrives only if this account may read it: `getEssay` checks the lock
 * before it runs the query that loads `content`, so a locked essay's text is
 * never in the page's payload. The lock screen below is what the reader sees
 * instead — not a blurred paragraph with the real words underneath it.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/user";
import { getEssay } from "@/lib/queries/admissions";
import { getDictionary, getLang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Essay",
};

export default async function EssayPage({
  params,
}: PageProps<"/essays/[essayId]">) {
  const { essayId } = await params;
  const userId = await getCurrentUserId();
  const t = getDictionary(await getLang());

  const essay = await getEssay(userId, essayId);
  if (!essay) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/essays">
            <ArrowLeft className="size-4" />
            {t.essays.title}
          </Link>
        </Button>
      </div>

      <header>
        <p className="text-sm text-muted-foreground">
          {essay.universityName ?? t.essays.commonApp}
          {essay.year !== null && ` · ${essay.year}`}
          {" · "}
          {fill(t.essays.wordCount, { count: essay.wordCount })}
        </p>

        <h1 className="mt-3 text-3xl leading-[1.1] font-extrabold tracking-tightest text-balance sm:text-4xl">
          {essay.prompt}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {essay.topicTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium"
            >
              {tag}
            </span>
          ))}

          {essay.isSample && (
            <Badge variant="secondary" className="gap-1">
              <Info className="size-3" />
              {t.uni.sampleAll}
            </Badge>
          )}
        </div>
      </header>

      {essay.unlocked && essay.content !== null ? (
        <article className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
          {/*
           * Paragraphs are split rather than rendered as HTML: the text is
           * imported from outside and is data, not markup — the same rule the
           * passage renderer follows.
           */}
          <div className="space-y-4 text-base leading-relaxed text-pretty">
            {essay.content
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter((paragraph) => paragraph !== "")
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>
        </article>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="size-5" />
          </span>
          <h2 className="mt-5 text-lg font-bold">{t.essays.lockedTitle}</h2>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t.essays.lockedBody}
          </p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        {t.essays.readingNote}
      </p>
    </div>
  );
}
