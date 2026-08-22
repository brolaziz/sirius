-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_premium" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "activity_references" ADD COLUMN     "participation_rate" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "organisation" TEXT,
    "role" TEXT,
    "description" VARCHAR(150),
    "hours_per_week" INTEGER,
    "weeks_per_year" INTEGER,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_activities_user_id_idx" ON "user_activities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_activities_user_id_position_key" ON "user_activities"("user_id", "position");

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "activity_references"("id") ON DELETE SET NULL ON UPDATE CASCADE;
