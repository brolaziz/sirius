-- Mixed practice: a session that spans every topic.
--
-- Both statements are expand-phase per DATABASE.md — additive, and safe to run
-- while the previous version of the application is still serving. Adding an
-- enum value does not affect existing rows, and relaxing NOT NULL cannot
-- invalidate one. The running code keeps writing a skill_id until the deploy
-- that stops doing so, which is the point of doing it in this order.
--
-- skill_id becomes nullable rather than pointing a mixed session at an
-- arbitrary skill: per-skill accuracy feeds the weak-topics list and the study
-- plan, and a wrong attribution would quietly poison both.

-- AlterEnum
ALTER TYPE "PracticeSource" ADD VALUE 'MIXED';

-- AlterTable
ALTER TABLE "practice_sessions" ALTER COLUMN "skill_id" DROP NOT NULL;
