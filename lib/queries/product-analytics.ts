import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import { LEARNING_EVENT_TYPES, RETURN_ACTIVITY_TYPES } from "@/lib/learning-events";

/** Counts are events, not learning improvement. Only a current administrator may read them. */
export async function getProductAnalytics(db: PrismaClient, actorId: string, now = new Date()) {
  const actor = await db.user.findUnique({ where: { id: actorId }, select: { role: true } });
  if (actor?.role !== "ADMIN") return null;
  const from = new Date(now.getTime() - 30 * 86400_000);
  const cohort = { role: "STUDENT" as const, createdAt: { gte: from, lte: now } };
  const [students, onboarded, eventCounts, firstPractice, completedPractice, firstMock, completedMock] = await Promise.all([
    db.user.count({ where: cohort }),
    db.user.count({ where: { ...cohort, onboardingCompletedAt: { lte: now } } }),
    db.learningEvent.groupBy({ by: ["type"], where: { type: { in: [...LEARNING_EVENT_TYPES] }, createdAt: { gte: from, lte: now }, user: { role: "STUDENT" } }, _count: { _all: true } }),
    db.user.count({ where: { ...cohort, learningEvents: { some: { type: "practice_started", createdAt: { lte: now } } } } }),
    db.user.count({ where: { ...cohort, learningEvents: { some: { type: "practice_completed", createdAt: { lte: now } } } } }),
    db.user.count({ where: { ...cohort, learningEvents: { some: { type: "mock_started", createdAt: { lte: now } } } } }),
    db.user.count({ where: { ...cohort, learningEvents: { some: { type: "mock_completed", createdAt: { lte: now } } } } }),
  ]);
  // Aggregate in Postgres so a large cohort is not truncated or loaded into the browser.
  // D7 means [first meaningful activity + 7 days, + 8 days), with a fully
  // elapsed observation window. D14 uses [14, 15). These are rolling 24h windows.
  const retention = await db.$queryRaw<Array<{ day: number; eligible: bigint; returned: bigint }>>`
    WITH first_activity AS (
      SELECT e.user_id, MIN(e.created_at) AS first_at
      FROM learning_events e JOIN users u ON u.id = e.user_id
      WHERE u.role = 'STUDENT' AND e.type IN (${Prisma.join(RETURN_ACTIVITY_TYPES)}) AND e.created_at <= ${now}
      GROUP BY e.user_id
    ), windows AS (SELECT 7 AS day UNION ALL SELECT 14)
    SELECT w.day, COUNT(f.user_id) AS eligible,
      COUNT(f.user_id) FILTER (WHERE EXISTS (
        SELECT 1 FROM learning_events r WHERE r.user_id = f.user_id
          AND r.type IN (${Prisma.join(RETURN_ACTIVITY_TYPES)})
          AND r.created_at >= f.first_at + w.day * INTERVAL '1 day'
          AND r.created_at < f.first_at + (w.day + 1) * INTERVAL '1 day'
      )) AS returned
    FROM windows w LEFT JOIN first_activity f ON f.first_at >= ${from}
      AND f.first_at + (w.day + 1) * INTERVAL '1 day' <= ${now}
    GROUP BY w.day ORDER BY w.day
  `;
  const counts = new Map(eventCounts.map((e) => [e.type, e._count._all]));
  return { from, until: now, students, onboarded, firstPractice, completedPractice, firstMock, completedMock,
    retention: retention.map((row) => ({ day: row.day, eligible: Number(row.eligible), returned: Number(row.returned),
      rate: Number(row.eligible) > 0 ? Number(row.returned) / Number(row.eligible) : null })),
    events: LEARNING_EVENT_TYPES.map((type) => ({ type, count: counts.get(type) ?? 0 })) };
}

export type ProductAnalytics = NonNullable<Awaited<ReturnType<typeof getProductAnalytics>>>;
