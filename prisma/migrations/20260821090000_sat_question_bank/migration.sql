-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "accepted_answers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "source_topic" TEXT,
ALTER COLUMN "difficulty" DROP NOT NULL,
ALTER COLUMN "difficulty" DROP DEFAULT;
