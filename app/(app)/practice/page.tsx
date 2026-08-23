/**
 * Practice — two sections, and one of them is honest about being unavailable.
 *
 * TOP: the full mock. The exam's own shape, stated whether or not the bank can
 * fill it, and offered only when it can. See `components/practice/mock-panel`
 * for why a short sitting is not served as a mock.
 *
 * BELOW: practice. Mixed questions across every topic, or one topic chosen from
 * the taxonomy, with the student choosing the length and whether there is a
 * clock. That is the line between the two sections — the mock's shape belongs
 * to the exam, a practice session's belongs to whoever has twenty minutes.
 *
 * The list of individual "tests" that used to sit here is gone. A test was a
 * fixed list somebody curated, which is why the page could offer a
 * two-question demo as the only thing to sit while forty real questions were
 * unreachable behind an unpublished container row. Questions are now reached
 * through practice and through the mock, both of which draw from the bank.
 *
 * Every section has a real empty state, because a fresh install legitimately
 * has no questions, no history and no weaknesses to report.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";

import { StartPracticeButton } from "@/components/practice/start-practice-button";
import { PracticeControls } from "@/components/practice/practice-controls";
import { MockPanel } from "@/components/practice/mock-panel";
import { PracticePreferencesProvider } from "@/components/practice/practice-preferences";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/config";
import { formatDuration, testTypeLabel } from "@/lib/sat";
import {
  getBankCounts,
  getPracticeSkills,
  getWeakSkills,
  type PracticeSkillOption,
} from "@/lib/queries/practice";
import { mockAvailability } from "@/lib/mock";
import type { Lang } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Practice",
};

export default async function PracticePage() {
  const databaseReady = isDatabaseConfigured();
  const userId = databaseReady ? await getCurrentUserId() : null;
  const lang = await getLang();
  const t = getDictionary(lang);

  const [skills, weak] = userId
    ? await Promise.all([getPracticeSkills(userId), getWeakSkills(userId, 3)])
    : [[], []];

  const availability = mockAvailability(
    databaseReady ? await getBankCounts() : [],
  );

  const byDomain = new Map<string, PracticeSkillOption[]>();
  for (const skill of skills) {
    const group = byDomain.get(skill.domainName) ?? [];
    group.push(skill);
    byDomain.set(skill.domainName, group);
  }

  const [mockTest, results] = databaseReady
    ? await prisma.$transaction([
        /*
         * The row a sitting is recorded against. Its own questions are not the
         * mock — `startAttempt` assembles that from the whole bank — so this is
         * a container, not a curated list.
         */
        prisma.test.findFirst({
          where: { type: "FULL", isPublished: true },
          orderBy: { createdAt: "desc" },
          select: { id: true },
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
    : [null, []];

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

      <MockPanel
        availability={availability}
        mockTestId={mockTest?.id ?? null}
        t={t}
      />

      {/*
        One picker, three ways in. The provider wraps the mixed card, the weak
        topics and the taxonomy so a length chosen once applies to whichever the
        student starts — see `practice-preferences.tsx`.
      */}
      <PracticePreferencesProvider>
        {/* Practice: mixed first, then one topic at a time. */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t.practice.practiceTitle}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {t.practice.practiceBody}
          </p>

          <PracticeControls className="mt-5" />
        </section>

        {/* Weak topics — only when there is enough evidence to name one. */}
        {weak.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t.practice.weakTitle}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {t.practice.weakBody}
            </p>

            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {weak.map((skill) => (
                <li
                  key={skill.code}
                  className="flex h-full flex-col justify-between rounded-2xl bg-card p-5 shadow-card"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {skill.domainName}
                    </p>
                    <p className="mt-1 text-base font-bold tracking-tight text-balance">
                      {skillLabel(skill, lang)}
                    </p>
                    <p className="mt-2 text-sm text-viz-rose tabular-nums">
                      {fill(t.practice.accuracy, {
                        count: Math.round(skill.accuracy * 100),
                      })}{" "}
                      · {skill.correct}/{skill.answered}
                    </p>
                  </div>

                  <StartPracticeButton
                    skillCode={skill.code}
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Topics */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t.practice.topicsTitle}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {t.practice.topicsBody}
          </p>

          {skills.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t.practice.topicsEmpty}
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-8">
              {[...byDomain.entries()].map(([domain, group]) => (
                <div key={domain}>
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {domain}
                  </h3>

                  <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-card">
                    {group.map((skill) => (
                      <li
                        key={skill.code}
                        className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {skillLabel(skill, lang)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                            {fill(t.practice.available, { count: skill.available })}
                            {skill.answered > 0 &&
                              ` · ${fill(t.practice.accuracy, {
                                count: Math.round(
                                  (skill.correct / skill.answered) * 100,
                                ),
                              })}`}
                          </p>
                        </div>

                        <StartPracticeButton
                          skillCode={skill.code}
                          variant="outline"
                          size="sm"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

      </PracticePreferencesProvider>

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
                      {testTypeLabel(result.test.type, t)}
                      {result.durationSeconds
                        ? ` · ${formatDuration(result.durationSeconds)}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t.dash.raw}</p>
                      <p className="text-sm font-semibold tnum">
                        {result.score}/{result.totalQuestions}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t.dash.estimated}</p>
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

/**
 * Skill names are stored in both languages on the taxonomy rows, so this picks
 * rather than translates. A missing Uzbek name falls back to the English one.
 */
function skillLabel(skill: PracticeSkillOption, lang: Lang): string {
  if (lang === "uz" && skill.nameUz) return skill.nameUz;
  return skill.name;
}
