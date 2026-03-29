-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "turnStartedAt" TIMESTAMP(3),
ADD COLUMN     "winnerRole" "PlayerRole";

-- CreateIndex
CREATE INDEX "Room_status_currentTurn_idx" ON "Room"("status", "currentTurn");

-- CreateIndex
CREATE INDEX "Room_finishedAt_idx" ON "Room"("finishedAt");

-- CreateIndex
CREATE INDEX "Room_winnerRole_idx" ON "Room"("winnerRole");
