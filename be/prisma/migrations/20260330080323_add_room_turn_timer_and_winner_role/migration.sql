/*
  Warnings:

  - A unique constraint covering the columns `[codeLength]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Room_codeLength_key" ON "Room"("codeLength");
