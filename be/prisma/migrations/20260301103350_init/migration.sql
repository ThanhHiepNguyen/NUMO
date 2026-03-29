-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'SETTING_SECRET', 'PLAYING', 'FINISHED');

-- CreateEnum
CREATE TYPE "RoomEndReason" AS ENUM ('FULL_CODE_WIN', 'MISS_LIMIT', 'MAX_ROUNDS_TIE', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('PLAYER_1', 'PLAYER_2');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "winCount" INTEGER NOT NULL DEFAULT 0,
    "lossCount" INTEGER NOT NULL DEFAULT 0,
    "drawCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "codeLength" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "currentTurn" "PlayerRole",
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "endReason" "RoomEndReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerInRoom" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,
    "nickname" TEXT NOT NULL,
    "role" "PlayerRole" NOT NULL,
    "secretCode" TEXT,
    "missCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerInRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guess" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "playerInRoomId" TEXT NOT NULL,
    "roundIndex" INTEGER NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "guessValue" TEXT NOT NULL,
    "correctDigits" INTEGER NOT NULL,
    "correctPositions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE INDEX "Room_code_idx" ON "Room"("code");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE INDEX "PlayerInRoom_roomId_idx" ON "PlayerInRoom"("roomId");

-- CreateIndex
CREATE INDEX "PlayerInRoom_userId_idx" ON "PlayerInRoom"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerInRoom_roomId_role_key" ON "PlayerInRoom"("roomId", "role");

-- CreateIndex
CREATE INDEX "Guess_roomId_idx" ON "Guess"("roomId");

-- CreateIndex
CREATE INDEX "Guess_playerInRoomId_idx" ON "Guess"("playerInRoomId");

-- CreateIndex
CREATE INDEX "Guess_roomId_createdAt_idx" ON "Guess"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerInRoom" ADD CONSTRAINT "PlayerInRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerInRoom" ADD CONSTRAINT "PlayerInRoom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guess" ADD CONSTRAINT "Guess_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guess" ADD CONSTRAINT "Guess_playerInRoomId_fkey" FOREIGN KEY ("playerInRoomId") REFERENCES "PlayerInRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
