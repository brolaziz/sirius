-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('READING', 'MATH', 'FULL');

-- CreateEnum
CREATE TYPE "TestModule" AS ENUM ('MODULE_1', 'MODULE_2');

-- CreateEnum
CREATE TYPE "QuestionFormat" AS ENUM ('MULTIPLE_CHOICE', 'SPR');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('ACCEPTED', 'REJECTED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SatSection" AS ENUM ('RW', 'MATH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "target_score" INTEGER,
    "target_exam_date" TIMESTAMP(3),
    "weekly_study_minutes" INTEGER NOT NULL DEFAULT 300,
    "locale" TEXT NOT NULL DEFAULT 'uz',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_uz" TEXT,
    "section" "SatSection" NOT NULL,
    "exam_weight" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_uz" TEXT,
    "domain_id" TEXT NOT NULL,
    "weight_in_domain" DOUBLE PRECISION NOT NULL,
    "base_questions_to_mastery" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_prerequisites" (
    "skill_id" TEXT NOT NULL,
    "prerequisite_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_prerequisites_pkey" PRIMARY KEY ("skill_id","prerequisite_id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "external_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TestType" NOT NULL DEFAULT 'FULL',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "duration_minutes" INTEGER NOT NULL DEFAULT 32,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "external_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    "module" "TestModule" NOT NULL DEFAULT 'MODULE_1',
    "passage_text" TEXT,
    "passage_title" TEXT,
    "question_text" TEXT NOT NULL,
    "format" "QuestionFormat" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "options" JSONB,
    "correct_answer" TEXT NOT NULL,
    "explanation" TEXT,
    "skill_id" TEXT,
    "domain" TEXT,
    "skill" TEXT,
    "irt_b" DOUBLE PRECISION,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "answers" JSONB NOT NULL DEFAULT '{}',
    "flagged" JSONB NOT NULL DEFAULT '[]',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "scaled_score" INTEGER,
    "rw_score" INTEGER,
    "math_score" INTEGER,
    "answers_record" JSONB NOT NULL,
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary" (
    "id" TEXT NOT NULL,
    "english_word" TEXT NOT NULL,
    "translated_word" TEXT NOT NULL,
    "explanation" TEXT,
    "explanation_uz" TEXT,
    "part_of_speech" TEXT,
    "example" TEXT,
    "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_words" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "vocabulary_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "scorecard_id" INTEGER,
    "data_source" TEXT NOT NULL DEFAULT 'curated',
    "name" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "state" TEXT,
    "acceptance_rate" DOUBLE PRECISION,
    "min_sat" INTEGER,
    "min_ielts" DOUBLE PRECISION,
    "min_toefl" INTEGER,
    "sat_math" INTEGER,
    "sat_reading" INTEGER,
    "student_size" INTEGER,
    "average_gpa" DOUBLE PRECISION,
    "description" TEXT,
    "description_uz" TEXT,
    "popular_majors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "popular_majors_uz" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "student_profile" TEXT,
    "student_profile_uz" TEXT,
    "image_url" TEXT,
    "extracurriculars" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extracurriculars_uz" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tuition_usd" INTEGER,
    "meets_full_need" BOOLEAN NOT NULL DEFAULT false,
    "world_ranking" INTEGER,
    "website_url" TEXT,
    "application_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_shortlist_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "university_shortlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "slug" TEXT,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "done_at" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_profiles" (
    "id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "applicant_key" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "year" INTEGER,
    "sat_score" INTEGER,
    "act_score" INTEGER,
    "gpa_unweighted" DOUBLE PRECISION,
    "gpa_weighted" DOUBLE PRECISION,
    "major" TEXT,
    "demographics" JSONB,
    "extracurriculars" JSONB,
    "awards" JSONB,
    "is_sample" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applicant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "essays" (
    "id" TEXT NOT NULL,
    "university_id" TEXT,
    "applicant_profile_id" TEXT,
    "prompt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "topic_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "year" INTEGER,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "is_sample" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "essays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_references" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_uz" TEXT,
    "description" TEXT,
    "description_uz" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "domains_code_key" ON "domains"("code");

-- CreateIndex
CREATE INDEX "domains_section_order_idx" ON "domains"("section", "order");

-- CreateIndex
CREATE UNIQUE INDEX "skills_code_key" ON "skills"("code");

-- CreateIndex
CREATE INDEX "skills_domain_id_order_idx" ON "skills"("domain_id", "order");

-- CreateIndex
CREATE INDEX "skill_prerequisites_prerequisite_id_idx" ON "skill_prerequisites"("prerequisite_id");

-- CreateIndex
CREATE UNIQUE INDEX "tests_external_id_key" ON "tests"("external_id");

-- CreateIndex
CREATE INDEX "tests_is_published_type_idx" ON "tests"("is_published", "type");

-- CreateIndex
CREATE INDEX "questions_test_id_module_order_idx" ON "questions"("test_id", "module", "order");

-- CreateIndex
CREATE INDEX "questions_skill_id_idx" ON "questions"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "questions_test_id_external_id_key" ON "questions"("test_id", "external_id");

-- CreateIndex
CREATE INDEX "test_attempts_user_id_status_idx" ON "test_attempts"("user_id", "status");

-- CreateIndex
CREATE INDEX "test_results_user_id_created_at_idx" ON "test_results"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_english_word_key" ON "vocabulary"("english_word");

-- CreateIndex
CREATE INDEX "vocabulary_category_idx" ON "vocabulary"("category");

-- CreateIndex
CREATE UNIQUE INDEX "saved_words_user_id_word_key" ON "saved_words"("user_id", "word");

-- CreateIndex
CREATE UNIQUE INDEX "universities_scorecard_id_key" ON "universities"("scorecard_id");

-- CreateIndex
CREATE UNIQUE INDEX "universities_name_key" ON "universities"("name");

-- CreateIndex
CREATE INDEX "universities_min_sat_idx" ON "universities"("min_sat");

-- CreateIndex
CREATE UNIQUE INDEX "university_shortlist_entries_user_id_university_id_key" ON "university_shortlist_entries"("user_id", "university_id");

-- CreateIndex
CREATE INDEX "roadmap_tasks_user_id_is_done_order_idx" ON "roadmap_tasks"("user_id", "is_done", "order");

-- CreateIndex
CREATE INDEX "applicant_profiles_university_id_status_idx" ON "applicant_profiles"("university_id", "status");

-- CreateIndex
CREATE INDEX "applicant_profiles_sat_score_idx" ON "applicant_profiles"("sat_score");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_profiles_applicant_key_university_id_key" ON "applicant_profiles"("applicant_key", "university_id");

-- CreateIndex
CREATE INDEX "essays_university_id_idx" ON "essays"("university_id");

-- CreateIndex
CREATE INDEX "essays_topic_tags_idx" ON "essays"("topic_tags");

-- CreateIndex
CREATE INDEX "activity_references_tier_order_idx" ON "activity_references"("tier", "order");

-- CreateIndex
CREATE INDEX "activity_references_category_idx" ON "activity_references"("category");

-- CreateIndex
CREATE UNIQUE INDEX "activity_references_tier_title_key" ON "activity_references"("tier", "title");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabulary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_shortlist_entries" ADD CONSTRAINT "university_shortlist_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_shortlist_entries" ADD CONSTRAINT "university_shortlist_entries_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_profiles" ADD CONSTRAINT "applicant_profiles_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essays" ADD CONSTRAINT "essays_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essays" ADD CONSTRAINT "essays_applicant_profile_id_fkey" FOREIGN KEY ("applicant_profile_id") REFERENCES "applicant_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
