-- AlterEnum
ALTER TYPE "MatchType" ADD VALUE 'SCOUTING';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "draftImageUrl" TEXT;

-- CreateTable
CREATE TABLE "TierList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lineupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TierList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierListChampion" (
    "id" TEXT NOT NULL,
    "tierListId" TEXT NOT NULL,
    "championName" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "role" "Position",
    "notes" TEXT,

    CONSTRAINT "TierListChampion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enemyTeamId" TEXT,
    "lineupId" TEXT,
    "gameVersion" TEXT,
    "ourSide" "Side" NOT NULL DEFAULT 'BLUE',
    "blueBans" TEXT[],
    "redBans" TEXT[],
    "bluePicks" TEXT[],
    "redPicks" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftPlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TierList" ADD CONSTRAINT "TierList_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "Lineup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierListChampion" ADD CONSTRAINT "TierListChampion_tierListId_fkey" FOREIGN KEY ("tierListId") REFERENCES "TierList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPlan" ADD CONSTRAINT "DraftPlan_enemyTeamId_fkey" FOREIGN KEY ("enemyTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPlan" ADD CONSTRAINT "DraftPlan_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "Lineup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
