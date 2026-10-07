import { z } from "zod";
export const APPLICATION_STATES = ["PLANNING", "IN_PROGRESS", "SUBMITTED", "WAITLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const;
export const checklistSchema = z.array(z.object({ id: z.string().min(1).max(80), title: z.string().trim().min(1).max(120), done: z.boolean() })).max(30)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length, { error: "Checklist IDs must be unique." });
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((text) => {
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
});
export const applicationInputSchema = z.object({
  universityName: z.string().trim().min(1).max(300), intake: z.string().trim().min(1).max(80),
  deadline: calendarDate.nullable(), status: z.enum(APPLICATION_STATES), checklist: checklistSchema,
  activityIds: z.array(z.string().min(1).max(60)).max(10).refine((ids) => new Set(ids).size === ids.length), notes: z.string().max(4000),
});
export const draftInputSchema = z.object({ title: z.string().trim().min(1).max(200), prompt: z.string().max(5000),
  content: z.string().max(60_000), wordLimit: z.number().int().min(1).max(10_000).nullable() });
export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type DraftInput = z.infer<typeof draftInputSchema>;
export type ChecklistItem = z.infer<typeof checklistSchema>[number];
