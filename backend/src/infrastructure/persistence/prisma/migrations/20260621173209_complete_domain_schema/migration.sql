/*
  Warnings:

  - You are about to drop the `system_health` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('FEATURE', 'BUG', 'INFRA', 'SRE', 'ON_CALL', 'DOCS', 'RESEARCH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('PREFER_SKILL', 'AVOID_SKILL', 'PREFER_CATEGORY', 'AVOID_CATEGORY', 'PREFER_DOMAIN', 'PREFER_WEEKDAY', 'AVOID_WEEKDAY', 'BLACKOUT_DATE', 'MAX_TASKS_PER_SPRINT', 'FOCUS_PREFERENCE', 'COOLDOWN_AFTER', 'LEARN_SKILL');

-- CreateEnum
CREATE TYPE "EquityMode" AS ENUM ('UTILITARIAN', 'MAX_MIN', 'NASH');

-- CreateEnum
CREATE TYPE "PlanningStrategy" AS ENUM ('CPSAT', 'RANDOM', 'GREEDY');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('OPTIMAL', 'FEASIBLE', 'INFEASIBLE', 'TIMEOUT');

-- DropTable
DROP TABLE "system_health";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "user_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("user_id","skill_id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "sprint_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "effort_days" INTEGER NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "domain" TEXT NOT NULL,
    "deadline_day" INTEGER,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "type" "RuleType" NOT NULL,
    "params" JSONB NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "is_hard" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_runs" (
    "id" TEXT NOT NULL,
    "sprint_id" TEXT NOT NULL,
    "strategy" "PlanningStrategy" NOT NULL,
    "equity_mode" "EquityMode" NOT NULL,
    "status" "RunStatus" NOT NULL,
    "objective_value" DOUBLE PRECISION,
    "message" TEXT,
    "per_user_happiness" JSONB,
    "rule_evaluations" JSONB,
    "solver_stats" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planning_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "planning_run_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_day" INTEGER NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TaskRequiredSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskRequiredSkills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TaskDependencies" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskDependencies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "rules_owner_id_idx" ON "rules"("owner_id");

-- CreateIndex
CREATE INDEX "planning_runs_sprint_id_idx" ON "planning_runs"("sprint_id");

-- CreateIndex
CREATE INDEX "assignments_user_id_idx" ON "assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_planning_run_id_task_id_key" ON "assignments"("planning_run_id", "task_id");

-- CreateIndex
CREATE INDEX "_TaskRequiredSkills_B_index" ON "_TaskRequiredSkills"("B");

-- CreateIndex
CREATE INDEX "_TaskDependencies_B_index" ON "_TaskDependencies"("B");

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_runs" ADD CONSTRAINT "planning_runs_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_planning_run_id_fkey" FOREIGN KEY ("planning_run_id") REFERENCES "planning_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskRequiredSkills" ADD CONSTRAINT "_TaskRequiredSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskRequiredSkills" ADD CONSTRAINT "_TaskRequiredSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskDependencies" ADD CONSTRAINT "_TaskDependencies_A_fkey" FOREIGN KEY ("A") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskDependencies" ADD CONSTRAINT "_TaskDependencies_B_fkey" FOREIGN KEY ("B") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
