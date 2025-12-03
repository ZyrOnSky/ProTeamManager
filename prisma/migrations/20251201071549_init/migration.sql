-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COACH', 'PLAYER');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT');

-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('MAIN', 'POCKET', 'LEARNING');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('SCRIM', 'SOLOQ', 'TOURNAMENT');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('WIN', 'LOSS', 'REMAKE');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('BLUE', 'RED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "secondaryPosition" "Position",
    "communicationLevel" INTEGER,
    "personality" TEXT,
    "opggUrl" TEXT,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionPool" (
    "id" TEXT NOT NULL,
    "playerProfileId" TEXT NOT NULL,
    "championName" TEXT NOT NULL,
    "mastery" "MasteryLevel" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ChampionPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRival" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patch" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Patch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "type" "MatchType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "result" "MatchResult",
    "vodLink" TEXT,
    "patchId" TEXT,
    "enemyTeamId" TEXT,
    "ourSide" "Side",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchAnalysis" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "spawnNotes" TEXT,
    "earlyNotes" TEXT,
    "midNotes" TEXT,
    "lateNotes" TEXT,
    "winCondition" TEXT,
    "keyMistakes" TEXT,

    CONSTRAINT "MatchAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerProfileId" TEXT,
    "summonerName" TEXT,
    "championName" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "kills" INTEGER,
    "deaths" INTEGER,
    "assists" INTEGER,
    "cs" INTEGER,
    "gold" INTEGER,
    "damageDealt" INTEGER,
    "isWeakSide" BOOLEAN NOT NULL DEFAULT false,
    "roleInComp" TEXT,

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "matchId" TEXT,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Composition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "winCondition" TEXT,
    "difficulty" INTEGER,
    "topChamp" TEXT,
    "jungleChamp" TEXT,
    "midChamp" TEXT,
    "adcChamp" TEXT,
    "supportChamp" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Composition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_userId_key" ON "PlayerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Patch_version_key" ON "Patch"("version");

-- CreateIndex
CREATE UNIQUE INDEX "MatchAnalysis_matchId_key" ON "MatchAnalysis"("matchId");

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionPool" ADD CONSTRAINT "ChampionPool_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_enemyTeamId_fkey" FOREIGN KEY ("enemyTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAnalysis" ADD CONSTRAINT "MatchAnalysis_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
