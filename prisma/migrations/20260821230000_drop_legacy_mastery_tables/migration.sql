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
--
-- WHY EVERY STATEMENT IS `IF EXISTS`
--
-- These tables predate the migration history: nothing in `00000000000000_init`
-- or anywhere after it creates them, because they were already in the database
-- when the history was started. That made this file unreplayable — on a fresh
-- database it failed at the first DROP with `relation "attempts" does not
-- exist`, which meant `prisma migrate dev` could not build a shadow database
-- and, more seriously, no new database could be built from this history at all.
-- Per-PR preview branches and any rebuild of production were blocked by it.
--
-- `IF EXISTS` makes the file mean what it always meant — "these should not be
-- here" — on a database that has them and on one that never did.

-- DropForeignKey
ALTER TABLE IF EXISTS "attempts" DROP CONSTRAINT IF EXISTS "attempts_question_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "attempts" DROP CONSTRAINT IF EXISTS "attempts_skill_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "attempts" DROP CONSTRAINT IF EXISTS "attempts_test_attempt_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "attempts" DROP CONSTRAINT IF EXISTS "attempts_user_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "countdown_snapshots" DROP CONSTRAINT IF EXISTS "countdown_snapshots_user_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "mastery_snapshots" DROP CONSTRAINT IF EXISTS "mastery_snapshots_skill_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "mastery_snapshots" DROP CONSTRAINT IF EXISTS "mastery_snapshots_user_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "score_estimates" DROP CONSTRAINT IF EXISTS "score_estimates_user_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "skill_masteries" DROP CONSTRAINT IF EXISTS "skill_masteries_skill_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "skill_masteries" DROP CONSTRAINT IF EXISTS "skill_masteries_user_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "study_days" DROP CONSTRAINT IF EXISTS "study_days_user_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "attempts";

-- DropTable
DROP TABLE IF EXISTS "countdown_snapshots";

-- DropTable
DROP TABLE IF EXISTS "extracurriculars";

-- DropTable
DROP TABLE IF EXISTS "mastery_snapshots";

-- DropTable
DROP TABLE IF EXISTS "score_estimates";

-- DropTable
DROP TABLE IF EXISTS "skill_masteries";

-- DropTable
DROP TABLE IF EXISTS "study_days";

-- DropEnum
DROP TYPE IF EXISTS "AttemptSource";

-- DropEnum
DROP TYPE IF EXISTS "CountdownTrend";
