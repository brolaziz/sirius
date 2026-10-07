import type { Prisma } from "@/lib/generated/prisma/client";
export const LEARNING_EVENT_TYPES = ["onboarding_completed", "practice_started", "practice_completed", "explanation_opened", "plan_task_completed", "mistake_retried", "mock_started", "mock_completed", "word_review_completed", "application_task_completed"] as const;
export const RETURN_ACTIVITY_TYPES = ["practice_completed", "mock_completed", "word_review_completed", "application_task_completed"] as const;
/** Server-derived IDs only. No answer, passage, essay, notes or payment data. */
export async function recordLearningEvent(tx: Prisma.TransactionClient, userId: string, type: typeof LEARNING_EVENT_TYPES[number], entityId: string) {
  await tx.learningEvent.upsert({ where: { userId_type_entityId: { userId, type, entityId } },
    create: { userId, type, entityId }, update: {} });
}
