/**
 * Practice — pick a test, or review a past one.
 *
 * Two sections: available tests, and this student's history. Both have real
 * empty states, because a fresh install legitimately has neither.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, FileJson, History, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";
import { formatDuration, testTypeLabel } from "@/lib/sat";

export const metadata: Metadata = {
  title: "Practice",
};

export default async function PracticePage() {
  const databaseReady = isDatabaseConfigured();
  const userId = databaseReady ? await getCurrentUserId() : null;
  const t = getDictionary(await getLang());

  const [tests, results] = databaseReady
    ? await prisma.$transaction([
        prisma.test.findMany({
          where: { isPublished: true },
          orderBy: [{ type: "asc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            durationMinutes: true,
            _count: { select: { questions: true } },
          },
        }),
        prisma.testResult.findMany({
          where: { userId: userId ?? "__none__" },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            score: true,
            totalQuestions: true,
            scaledScore: true,
            durationSeconds: true,
            createdAt: true,
            test: { select: { title: true, type: true } },
          },
        }),
      ])
    : [[], []];

  return (
    <div className="mx-auto max-w-7xl space-y-14">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t.pages.practiceEyebrow}
        </p>
        <h1 className="mt-2 text-4xl leading-[1.02] font-extrabold tracking-tightest text-balance sm:text-5xl lg:text-6xl">
          {t.pages.practiceTitle}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {t.pages.practiceBody}
        </p>
      </div>

      {/* Available tests */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t.pages.practiceAvailable}
        </h2>

        {tests.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileJson className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold">
              {t.pages.practiceEmptyTitle}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Sirius ships without question content. Post your own JSON question
              bank to <code className="font-mono text-xs">/api/tests/import</code>{" "}
              and your tests appear here. Send a{" "}
              <code className="font-mono text-xs">GET</code> to the same URL to
              see the accepted payload shape.
            </p>
          </div>
        ) : (
          <StaggerGroup
            immediate
            className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {tests.map((test) => (
              <StaggerItem key={test.id}>
                <article className="flex h-full flex-col justify-between rounded-2xl bg-card p-6 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {testTypeLabel(test.type)}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {test.durationMinutes} min
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold tracking-tight text-balance">
                      {test.title}
                    </h3>

                    {test.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {test.description}
                      </p>
                    )}

                    <p className="mt-3 text-xs text-muted-foreground tnum">
                      {test._count.questions} question
                      {test._count.questions === 1 ? "" : "s"}
                    </p>
                  </div>

                  <Button
                    asChild
                    size="lg"
                    className="group mt-6 h-11 w-full rounded-xl shadow-glow"
                    disabled={test._count.questions === 0}
                  >
                    <Link href={`/simulator/${test.id}`}>
                      <Play className="size-4" />
                      Start
                      <ArrowRight className="ml-0.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </section>

      {/* History */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t.pages.practiceHistory}
        </h2>

        {results.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <History className="size-4" />
            </span>
            <p className="text-sm text-muted-foreground">
              {t.pages.practiceHistoryEmpty}
            </p>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-card">
            {results.map((result) => (
              <li key={result.id}>
                <Link
                  href={`/practice/results/${result.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {result.test.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {testTypeLabel(result.test.type)}
                      {result.durationSeconds
                        ? ` · ${formatDuration(result.durationSeconds)}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Raw</p>
                      <p className="text-sm font-semibold tnum">
                        {result.score}/{result.totalQuestions}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Estimated</p>
                      <p className="text-sm font-semibold tnum">
                        {result.scaledScore ?? "—"}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
