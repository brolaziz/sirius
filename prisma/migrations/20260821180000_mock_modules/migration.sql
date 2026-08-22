-- AlterTable
ALTER TABLE "test_attempts" ADD COLUMN     "module_index" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "module_plan" JSONB,
ADD COLUMN     "module_started_at" TIMESTAMP(3);
