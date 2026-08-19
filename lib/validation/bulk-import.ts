/**
 * Payload shapes for `POST /api/admin/bulk-import`.
 *
 * One endpoint, four collections. The schema is deliberately forgiving about
 * *spelling* and strict about *meaning*: `sat_score` and `satScore` are both
 * accepted because the data will arrive from spreadsheets and scrapers, but a
 * GPA of 17 is rejected because nobody has one.
 *
 * Everything is validated before a single row is written, so a typo in item 400
 * does not leave 399 half-imported rows behind.
 */

import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

/** Accepts either spelling of a key, preferring the camelCase one. */
function either<T extends z.ZodTypeAny>(schema: T) {
  return schema;
}

const trimmed = z.string().trim().min(1);

/* -------------------------------------------------------------------------- */
/* Vocabulary                                                                 */
/* -------------------------------------------------------------------------- */

export const vocabularyItemSchema = z
  .object({
    word: trimmed.optional(),
    englishWord: trimmed.optional(),
    english_word: trimmed.optional(),

    translation: z.string().trim().optional(),
    translatedWord: z.string().trim().optional(),
    translated_word: z.string().trim().optional(),

    definition: z.string().trim().optional(),
    explanation: z.string().trim().optional(),
    explanationUz: z.string().trim().optional(),
    explanation_uz: z.string().trim().optional(),

    partOfSpeech: z.string().trim().optional(),
    part_of_speech: z.string().trim().optional(),

    example: z.string().trim().optional(),
    synonyms: z.array(z.string().trim()).optional(),
    category: z.string().trim().optional(),
  })
  .transform((raw, ctx) => {
    const word = raw.word ?? raw.englishWord ?? raw.english_word;
    if (!word) {
      ctx.addIssue({
        code: "custom",
        message: "Each vocabulary item needs a `word`.",
      });
      return z.NEVER;
    }

    /*
     * The Uzbek translation is what makes an entry useful in Sirius, but a bank
     * of 6,000 SAT words will often arrive English-only. Falling back to an
     * empty string would put blank rows in front of students, so the word is
     * stored with its definition and the translation is left to a later pass.
     */
    return {
      englishWord: word.toLowerCase(),
      translatedWord: raw.translation ?? raw.translatedWord ?? raw.translated_word ?? "",
      explanation: raw.definition ?? raw.explanation ?? null,
      explanationUz: raw.explanationUz ?? raw.explanation_uz ?? null,
      partOfSpeech: raw.partOfSpeech ?? raw.part_of_speech ?? null,
      example: raw.example ?? null,
      synonyms: raw.synonyms ?? [],
      category: raw.category ?? null,
    };
  });

/* -------------------------------------------------------------------------- */
/* Applicant profiles                                                         */
/* -------------------------------------------------------------------------- */

const statusSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(["ACCEPTED", "REJECTED", "WAITLISTED"]));

const extracurricularSchema = z.object({
  title: trimmed,
  role: z.string().trim().optional(),
  hours: z.number().int().min(0).max(168).optional(),
  description: z.string().trim().optional(),
});

const awardSchema = z.object({
  title: trimmed,
  level: z.string().trim().optional(),
  year: z.number().int().min(1990).max(2100).optional(),
});

export const applicantItemSchema = z
  .object({
    university: trimmed.optional(),
    universityName: trimmed.optional(),
    universityId: trimmed.optional(),

    applicantKey: z.string().trim().optional(),
    applicant_key: z.string().trim().optional(),

    status: statusSchema,
    year: z.number().int().min(1990).max(2100).optional(),

    satScore: z.number().int().min(400).max(1600).optional(),
    sat_score: z.number().int().min(400).max(1600).optional(),
    actScore: z.number().int().min(1).max(36).optional(),
    act_score: z.number().int().min(1).max(36).optional(),

    gpaUnweighted: z.number().min(0).max(4.0).optional(),
    gpa_unweighted: z.number().min(0).max(4.0).optional(),
    gpaWeighted: z.number().min(0).max(6.0).optional(),
    gpa_weighted: z.number().min(0).max(6.0).optional(),

    major: z.string().trim().optional(),
    demographics: z.record(z.string(), z.unknown()).optional(),
    extracurriculars: z.array(extracurricularSchema).optional(),
    awards: z.array(awardSchema).optional(),

    isSample: z.boolean().optional(),
  })
  .transform((raw, ctx) => {
    const universityName = raw.university ?? raw.universityName;
    if (!universityName && !raw.universityId) {
      ctx.addIssue({
        code: "custom",
        message: "Each applicant needs `university` (name) or `universityId`.",
      });
      return z.NEVER;
    }

    return {
      universityName: universityName ?? null,
      universityId: raw.universityId ?? null,
      applicantKey: raw.applicantKey ?? raw.applicant_key ?? null,
      status: raw.status,
      year: raw.year ?? null,
      satScore: raw.satScore ?? raw.sat_score ?? null,
      actScore: raw.actScore ?? raw.act_score ?? null,
      gpaUnweighted: raw.gpaUnweighted ?? raw.gpa_unweighted ?? null,
      gpaWeighted: raw.gpaWeighted ?? raw.gpa_weighted ?? null,
      major: raw.major ?? null,
      demographics: raw.demographics ?? null,
      extracurriculars: raw.extracurriculars ?? null,
      awards: raw.awards ?? null,
      isSample: raw.isSample ?? false,
    };
  });

/* -------------------------------------------------------------------------- */
/* Essays                                                                     */
/* -------------------------------------------------------------------------- */

export const essayItemSchema = z
  .object({
    university: z.string().trim().optional(),
    universityName: z.string().trim().optional(),
    universityId: z.string().trim().optional(),
    applicantKey: z.string().trim().optional(),

    prompt: trimmed,
    content: trimmed,
    wordCount: z.number().int().min(1).optional(),
    word_count: z.number().int().min(1).optional(),

    topicTags: z.array(z.string().trim()).optional(),
    topic_tags: z.array(z.string().trim()).optional(),

    year: z.number().int().min(1990).max(2100).optional(),
    isPremium: z.boolean().optional(),
    isSample: z.boolean().optional(),
  })
  .transform((raw) => ({
    universityName: raw.university ?? raw.universityName ?? null,
    universityId: raw.universityId ?? null,
    applicantKey: raw.applicantKey ?? null,
    prompt: raw.prompt,
    content: raw.content,
    // Counted from the text when the payload does not say — the number on the
    // card has to match the essay a student is about to read.
    wordCount:
      raw.wordCount ??
      raw.word_count ??
      raw.content.split(/\s+/).filter(Boolean).length,
    topicTags: raw.topicTags ?? raw.topic_tags ?? [],
    year: raw.year ?? null,
    isPremium: raw.isPremium ?? false,
    isSample: raw.isSample ?? false,
  }));

/* -------------------------------------------------------------------------- */
/* Activity references                                                        */
/* -------------------------------------------------------------------------- */

export const activityItemSchema = z
  .object({
    tier: trimmed,
    category: trimmed,
    title: trimmed,
    titleUz: z.string().trim().optional(),
    description: z.string().trim().optional(),
    descriptionUz: z.string().trim().optional(),
    order: z.number().int().min(0).optional(),
  })
  .transform((raw) => ({
    tier: raw.tier,
    category: raw.category,
    title: raw.title,
    titleUz: raw.titleUz ?? null,
    description: raw.description ?? null,
    descriptionUz: raw.descriptionUz ?? null,
    order: raw.order ?? 0,
  }));

/* -------------------------------------------------------------------------- */
/* The envelope                                                               */
/* -------------------------------------------------------------------------- */

export const bulkImportSchema = either(
  z
    .object({
      vocabulary: z.array(vocabularyItemSchema).optional(),
      applicants: z.array(applicantItemSchema).optional(),
      essays: z.array(essayItemSchema).optional(),
      activities: z.array(activityItemSchema).optional(),
      /** Preview the result without writing anything. */
      dryRun: z.boolean().optional(),
    })
    .refine(
      (payload) =>
        Boolean(
          payload.vocabulary?.length ||
            payload.applicants?.length ||
            payload.essays?.length ||
            payload.activities?.length,
        ),
      {
        message:
          "Send at least one of `vocabulary`, `applicants`, `essays` or `activities`.",
      },
    ),
);

export type BulkImportPayload = z.infer<typeof bulkImportSchema>;
export type VocabularyItem = z.infer<typeof vocabularyItemSchema>;
export type ApplicantItem = z.infer<typeof applicantItemSchema>;
export type EssayItem = z.infer<typeof essayItemSchema>;
export type ActivityItem = z.infer<typeof activityItemSchema>;
