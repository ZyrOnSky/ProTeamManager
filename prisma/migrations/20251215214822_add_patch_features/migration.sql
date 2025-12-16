/*
  Warnings:

  - Added the required column `updatedAt` to the `Patch` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChampionClass" AS ENUM ('FIGHTER', 'MAGE', 'ASSASSIN', 'TANK', 'MARKSMAN', 'SUPPORT', 'SPECIALIST');

-- AlterTable
ALTER TABLE "DraftPlan" ADD COLUMN     "allyTierListId" TEXT,
ADD COLUMN     "enemyTierListId" TEXT;

-- AlterTable
ALTER TABLE "Patch" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "officialLink" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "startDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "opggUrl" TEXT;

-- AlterTable
ALTER TABLE "TierList" ADD COLUMN     "enemyTeamId" TEXT,
ADD COLUMN     "patchId" TEXT;

-- CreateTable
CREATE TABLE "ChampionDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "laneStyle" "LaneAllocation",
    "compStyle" "ChampionRole",
    "compStyleSecondary" "ChampionRole",
    "class" "ChampionClass",
    "primaryRole" "Position",
    "secondaryRole" "Position",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChampionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnemyPlayer" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Position" NOT NULL,
    "opggUrl" TEXT,
    "notes" TEXT,

    CONSTRAINT "EnemyPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnemyBan" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "championName" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "EnemyBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineupConfiguration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lineupId" TEXT,
    "assignments" JSONB NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineupConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lineupId" TEXT,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyScene" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyScene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChampionDefinition_name_key" ON "ChampionDefinition"("name");

-- AddForeignKey
ALTER TABLE "EnemyPlayer" ADD CONSTRAINT "EnemyPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnemyBan" ADD CONSTRAINT "EnemyBan_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierList" ADD CONSTRAINT "TierList_enemyTeamId_fkey" FOREIGN KEY ("enemyTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierList" ADD CONSTRAINT "TierList_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPlan" ADD CONSTRAINT "DraftPlan_allyTierListId_fkey" FOREIGN KEY ("allyTierListId") REFERENCES "TierList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPlan" ADD CONSTRAINT "DraftPlan_enemyTierListId_fkey" FOREIGN KEY ("enemyTierListId") REFERENCES "TierList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupConfiguration" ADD CONSTRAINT "LineupConfiguration_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "Lineup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playbook" ADD CONSTRAINT "Playbook_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "Lineup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playbook" ADD CONSTRAINT "Playbook_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyScene" ADD CONSTRAINT "StrategyScene_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StrategyScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyScene" ADD CONSTRAINT "StrategyScene_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
