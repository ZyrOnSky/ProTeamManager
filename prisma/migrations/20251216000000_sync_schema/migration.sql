-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "isCaptain" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "jobTitle" TEXT;

-- CreateTable
CREATE TABLE "EnemyPick" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "championName" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "EnemyPick_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EnemyPick" ADD CONSTRAINT "EnemyPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
