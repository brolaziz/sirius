import { z } from "zod";
import { currentScoreSchema, satScoreSchema, examDateSchema } from "@/lib/validation/onboarding";

export const studyPreferencesSchema = z.object({
  currentScore: currentScoreSchema,
  targetScore: satScoreSchema,
  examDate: examDateSchema.refine((date) => {
    const parsed = new Date(`${date}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  }, { error: "Pick a real calendar date." }),
  weeklyStudyMinutes: z.number().int().min(30).max(2100).multipleOf(15),
}).refine((data) => data.currentScore === null || data.targetScore >= data.currentScore, {
  error: "Your target cannot be lower than your current score.", path: ["targetScore"],
});
export type StudyPreferencesInput = z.infer<typeof studyPreferencesSchema>;
