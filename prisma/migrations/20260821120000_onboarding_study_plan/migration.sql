-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM ('GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12', 'GRADUATED');

-- CreateEnum
CREATE TYPE "StudyPriority" AS ENUM ('SAT', 'ADMISSIONS', 'BOTH');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_score" INTEGER,
ADD COLUMN     "grade_level" "GradeLevel",
ADD COLUMN     "onboarding_completed_at" TIMESTAMP(3),
ADD COLUMN     "priority" "StudyPriority";

-- CreateTable
CREATE TABLE "study_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_score" INTEGER,
    "target_score" INTEGER NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "weekly_study_minutes" INTEGER NOT NULL,
    "weeks" INTEGER NOT NULL,
    "weekly_questions" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "projected_score" INTEGER,
    "on_track" BOOLEAN NOT NULL,
    "shortfall_minutes_per_week" INTEGER NOT NULL DEFAULT 0,
    "bank_limited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_tasks" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "skill_id" TEXT NOT NULL,
    "target_questions" INTEGER NOT NULL,
    "completed_questions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_plan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_plans_user_id_created_at_idx" ON "study_plans"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "study_plan_tasks_plan_id_week_idx" ON "study_plan_tasks"("plan_id", "week");

-- CreateIndex
CREATE UNIQUE INDEX "study_plan_tasks_plan_id_week_skill_id_key" ON "study_plan_tasks"("plan_id", "week", "skill_id");

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_tasks" ADD CONSTRAINT "study_plan_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_tasks" ADD CONSTRAINT "study_plan_tasks_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
