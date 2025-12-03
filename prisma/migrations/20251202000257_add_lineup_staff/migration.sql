-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignedLineupId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedLineupId_fkey" FOREIGN KEY ("assignedLineupId") REFERENCES "Lineup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
