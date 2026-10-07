import type { PrismaClient } from "@/lib/generated/prisma/client";
/** Only the signed-in student's workspace; no public or admin totals. */
export async function getWorkspaceOverview(db: PrismaClient, userId: string, now = new Date()) {
 const from = new Date(now); from.setUTCHours(0, 0, 0, 0);
 const [applicationCount, draftCount, activityCount, drafts, deadline] = await Promise.all([
  db.personalApplication.count({ where: { userId, archivedAt: null } }),
  db.essayDraft.count({ where: { userId, archivedAt: null } }),
  db.userActivity.count({ where: { userId } }),
  db.essayDraft.findMany({ where: { userId, archivedAt: null }, orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, title: true, updatedAt: true } }),
  db.personalApplication.findFirst({ where: { userId, archivedAt: null, deadline: { gte: from }, status: { notIn: ["SUBMITTED", "WAITLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"] } }, orderBy: { deadline: "asc" }, select: { id: true, universityName: true, deadline: true } }),
 ]);
 return { applicationCount, draftCount, activityCount, drafts, deadline };
}
