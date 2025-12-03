-- AlterTable
ALTER TABLE "MatchParticipant" ADD COLUMN     "laneOpponent" TEXT,
ADD COLUMN     "matchupScore" INTEGER;

-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "lineupId" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "riotId" TEXT;

-- CreateTable
CREATE TABLE "Lineup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerEvaluation" (
    "id" TEXT NOT NULL,
    "playerProfileId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "communication" INTEGER NOT NULL,
    "mental" INTEGER NOT NULL,
    "mechanics" INTEGER NOT NULL,
    "gameKnowledge" INTEGER NOT NULL,
    "teamplay" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "PlayerEvaluation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "Lineup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvaluation" ADD CONSTRAINT "PlayerEvaluation_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvaluation" ADD CONSTRAINT "PlayerEvaluation_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
