CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'EDITOR', 'ADMIN');
CREATE TYPE "ContentReviewStatus" AS ENUM ('UNREVIEWED', 'VERIFIED', 'REJECTED');
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'STUDENT';
ALTER TABLE "tests" ADD COLUMN "source_name" TEXT, ADD COLUMN "rights_note" TEXT;
ALTER TABLE "questions" ADD COLUMN "review_status" "ContentReviewStatus" NOT NULL DEFAULT 'UNREVIEWED',
  ADD COLUMN "reviewed_at" TIMESTAMP(3), ADD COLUMN "reviewed_by_id" TEXT;
ALTER TABLE "questions" ADD CONSTRAINT "questions_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "content_audit_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actor_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "content_audit_events_entity_id_created_at_idx" ON "content_audit_events"("entity_id", "created_at");
ALTER TABLE "content_audit_events" ADD CONSTRAINT "content_audit_events_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
