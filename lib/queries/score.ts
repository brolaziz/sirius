/**
 * "What does this student score?" — one answer, used everywhere it is asked.
 *
 * Two sources, in order of how much they are worth believing:
 *
 *   1. the scaled score of their most recent graded sitting;
 *   2. the number they typed into onboarding.
 *
 * A measurement beats a memory, which is why the order is not the other way
 * round. Null means neither exists, and every caller has to render that as "we
 * do not know yet" rather than as a zero — a student with no score is not a
 * student who scored badly.
 */

import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function getLatestScore(userId: string): Promise<number | null> {
  if (!isDatabaseConfigured()) return null;

  const [result, user] = await Promise.all([
    prisma.testResult.findFirst({
      where: { userId, scaledScore: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { scaledScore: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { currentScore: true },
    }),
  ]);

  return result?.scaledScore ?? user?.currentScore ?? null;
}
