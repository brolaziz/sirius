-- Drop the tables left behind by the removed mastery / countdown engine.
--
-- These seven tables and two enums are in the database but not in
-- `prisma/schema.prisma`: they belong to an adaptive-mastery system that was
-- taken out of the application before this migration history began. Nothing in
-- the codebase reads or writes them, no foreign key from a live table points at
-- them, and every one of them was verified empty (0 rows) immediately before
-- this file was written.
--
-- What is deliberately NOT dropped: `domains`, `skills` and
-- `skill_prerequisites`. They arrived with the same removed system but carry
-- real content — 8 domains, 31 skills and 29 prerequisite edges, with exam
-- weights — and are now declared in the schema and used by the question bank,
-- the study plan and practice.
--
-- The two enums are dropped last because the only columns typed with them
-- (`attempts.source`, `countdown_snapshots.trend`) belong to tables this file
-- removes first.

-- DropForeignKey
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_question_id_fkey";

-- DropForeignKey
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_test_attempt_id_fkey";

-- DropForeignKey
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "countdown_snapshots" DROP CONSTRAINT "countdown_snapshots_user_id_fkey";

-- DropForeignKey
ALTER TABLE "mastery_snapshots" DROP CONSTRAINT "mastery_snapshots_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "mastery_snapshots" DROP CONSTRAINT "mastery_snapshots_user_id_fkey";

-- DropForeignKey
ALTER TABLE "score_estimates" DROP CONSTRAINT "score_estimates_user_id_fkey";

-- DropForeignKey
ALTER TABLE "skill_masteries" DROP CONSTRAINT "skill_masteries_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "skill_masteries" DROP CONSTRAINT "skill_masteries_user_id_fkey";

-- DropForeignKey
ALTER TABLE "study_days" DROP CONSTRAINT "study_days_user_id_fkey";

-- DropTable
DROP TABLE "attempts";

-- DropTable
DROP TABLE "countdown_snapshots";

-- DropTable
DROP TABLE "extracurriculars";

-- DropTable
DROP TABLE "mastery_snapshots";

-- DropTable
DROP TABLE "score_estimates";

-- DropTable
DROP TABLE "skill_masteries";

-- DropTable
DROP TABLE "study_days";

-- DropEnum
DROP TYPE "AttemptSource";

-- DropEnum
DROP TYPE "CountdownTrend";
