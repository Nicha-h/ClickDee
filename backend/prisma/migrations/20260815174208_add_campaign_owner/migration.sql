/*
  Warnings:

  - Added the required column `userId` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "campaigns_userId_idx" ON "campaigns"("userId");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
