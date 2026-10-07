import { z } from "zod";
export const practiceAnswerSchema = z.object({ sessionId: z.string().min(1).max(60), questionId: z.string().min(1).max(60),
  answer: z.string().trim().min(1).max(200), timeSpentSeconds: z.number().int().min(0).max(3600) });
export type PracticeAnswerInput = z.infer<typeof practiceAnswerSchema>;
