/**
 * The essay library.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS IS EMPTY
 *
 * Essays are somebody's writing. The ones on competitor sites were submitted by
 * students to those sites, and copying them here would be taking work that is
 * not ours from people who never agreed to it. So the library ships with no
 * content, the page says so, and the import path (`POST /api/admin/bulk-import`)
 * is how essays arrive once there is a source that can be used honestly —
 * students donating their own, with permission.
 *
 * The paywall is real but narrow: it gates *content*, never the study tools,
 * and it is enforced in `lib/queries/admissions.ts`, which does not load a
 * locked body at all.
 * ───────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Info, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { getCurrentUserId } from "@/lib/user";
import { getEssays } from "@/lib/queries/admissions";
import { getDictionary, getLang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Essays",
};

export default async function EssaysPage() {
  const userId = await getCurrentUserId();
  const t = getDictionary(await getLang());

  const essays = await getEssays(userId);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t.essays.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl leading-[1.02] font-extrabold tracking-tightest text-balance sm:text-5xl lg:text-6xl">
          {t.essays.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t.essays.body}
        </p>
      </div>

      {essays.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </span>
          <h2 className="mt-5 text-lg font-bold">{t.essays.empty}</h2>
          <p className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {t.essays.emptyBody}
          </p>
        </div>
      ) : (
        <StaggerGroup immediate className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {essays.map((essay) => (
            <StaggerItem key={essay.id}>
              <Link
                href={`/essays/${essay.id}`}
                className="flex h-full flex-col justify-between rounded-2xl bg-card p-6 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {essay.universityName ?? t.essays.commonApp}
                      {essay.year !== null && ` · ${essay.year}`}
                    </p>

                    {!essay.unlocked && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                        <Lock className="size-3" />
                        {t.essays.locked}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-base leading-snug font-bold text-balance">
                    {essay.prompt}
                  </h2>

                  {essay.topicTags.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {essay.topicTags.slice(0, 3).map((tag) => (
                        <li key={tag}>
                          <span className="inline-flex rounded-lg bg-muted px-2 py-1 text-xs">
                            {tag}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {fill(t.essays.wordCount, { count: essay.wordCount })}
                  </p>

                  {essay.isSample && (
                    <Badge variant="secondary" className="gap-1">
                      <Info className="size-3" />
                      {t.uni.sampleAll}
                    </Badge>
                  )}
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
