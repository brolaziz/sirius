ALTER TABLE "test_attempts" ADD COLUMN "question_ids" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "duration_minutes" INTEGER;
ALTER TABLE "test_results" ADD COLUMN "attempt_id" TEXT,
  ADD COLUMN "question_ids" JSONB NOT NULL DEFAULT '[]';
CREATE UNIQUE INDEX "test_results_attempt_id_key" ON "test_results"("attempt_id");
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_attempt_id_fkey"
  FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
