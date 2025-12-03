-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "blueBans" TEXT[],
ADD COLUMN     "redBans" TEXT[];

-- AlterTable
ALTER TABLE "MatchParticipant" ADD COLUMN     "isEnemy" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'es',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'GMT-5';
