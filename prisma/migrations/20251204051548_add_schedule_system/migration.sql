/*
  Warnings:

  - Added the required column `lineupId` to the `ScheduleEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ScheduleEvent` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `ScheduleEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SCRIM', 'TOURNAMENT', 'TRAINING', 'ACTIVITY_LOG');

-- CreateEnum
CREATE TYPE "ScrimType" AS ENUM ('WARMUP', 'EVALUATION', 'SCRIM');

-- CreateEnum
CREATE TYPE "EventModality" AS ENUM ('BO1', 'BO2', 'BO3', 'BO5', 'TWO_MAPS', 'THREE_MAPS', 'FIVE_MAPS');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'PENDING');

-- AlterTable
ALTER TABLE "Lineup" ADD COLUMN     "scheduleLink" TEXT;

-- AlterTable
ALTER TABLE "ScheduleEvent" ADD COLUMN     "activityType" TEXT,
ADD COLUMN     "lineupId" TEXT NOT NULL,
ADD COLUMN     "modality" "EventModality",
ADD COLUMN     "opponentContact" TEXT,
ADD COLUMN     "opponentName" TEXT,
ADD COLUMN     "scrimType" "ScrimType",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "EventType" NOT NULL;

-- CreateTable
CREATE TABLE "EventAttendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "EventAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendance_eventId_userId_key" ON "EventAttendance"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "Lineup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ScheduleEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
