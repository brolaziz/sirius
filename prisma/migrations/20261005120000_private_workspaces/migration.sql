ALTER TABLE "saved_words" ADD COLUMN "next_review_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "last_reviewed_at" TIMESTAMP(3), ADD COLUMN "repetitions" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "interval_days" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "saved_words_user_id_next_review_at_idx" ON "saved_words"("user_id", "next_review_at");
CREATE TABLE "personal_applications" (
  "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "university_name" TEXT NOT NULL, "intake" TEXT NOT NULL,
  "deadline" TIMESTAMP(3), "status" TEXT NOT NULL DEFAULT 'PLANNING', "checklist" JSONB NOT NULL DEFAULT '[]',
  "activity_ids" JSONB NOT NULL DEFAULT '[]', "notes" TEXT NOT NULL DEFAULT '', "revision" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "personal_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "personal_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "personal_applications_user_id_deadline_idx" ON "personal_applications"("user_id", "deadline");
CREATE TABLE "essay_drafts" (
  "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "application_id" TEXT, "title" TEXT NOT NULL, "prompt" TEXT NOT NULL DEFAULT '',
  "content" TEXT NOT NULL DEFAULT '', "word_limit" INTEGER, "revision" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "essay_drafts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "essay_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "essay_drafts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "personal_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "essay_drafts_user_id_updated_at_idx" ON "essay_drafts"("user_id", "updated_at");
CREATE TABLE "essay_draft_revisions" (
  "id" TEXT NOT NULL, "draft_id" TEXT NOT NULL, "version" INTEGER NOT NULL, "title" TEXT NOT NULL,
  "prompt" TEXT NOT NULL, "content" TEXT NOT NULL, "word_limit" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "essay_draft_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "essay_draft_revisions_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "essay_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "essay_draft_revisions_draft_id_version_key" ON "essay_draft_revisions"("draft_id", "version");
