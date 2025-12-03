/*
  Warnings:

  - You are about to drop the column `isWeakSide` on the `MatchParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `roleInComp` on the `MatchParticipant` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LaneAllocation" AS ENUM ('STRONG_SIDE', 'WEAK_SIDE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "ChampionRole" AS ENUM ('ENGAGE', 'PICKUP', 'PROTECT', 'SIEGE', 'SPLITPUSH');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "gameVersion" TEXT,
ADD COLUMN     "lineupId" TEXT;

-- AlterTable
ALTER TABLE "MatchParticipant" DROP COLUMN "isWeakSide",
DROP COLUMN "roleInComp",
ADD COLUMN     "championRole" "ChampionRole",
ADD COLUMN     "communicationRating" DOUBLE PRECISION,
ADD COLUMN     "laneAllocation" "LaneAllocation",
ADD COLUMN     "laningRating" DOUBLE PRECISION,
ADD COLUMN     "macroRating" DOUBLE PRECISION,
ADD COLUMN     "matchupNotes" TEXT,
ADD COLUMN     "mentalRating" DOUBLE PRECISION,
ADD COLUMN     "microRating" DOUBLE PRECISION,
ADD COLUMN     "positioningRating" DOUBLE PRECISION,
ADD COLUMN     "teamfightRating" DOUBLE PRECISION,
ADD COLUMN     "visionWards" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wardsPlaced" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PlayerEvaluation" ADD COLUMN     "improvementGoal" TEXT,
ADD COLUMN     "strengths" TEXT,
ADD COLUMN     "weaknesses" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discordId" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "realName" TEXT;

-- CreateTable
CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "Lineup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
