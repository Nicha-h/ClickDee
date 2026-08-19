-- CreateEnum
CREATE TYPE "PendingActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "PendingActionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('AI_TASK', 'SYSTEM');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "caption" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "pendingActionId" TEXT,
ADD COLUMN     "redacted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "pending_ai_actions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "type" "PendingActionType" NOT NULL,
    "targetCampaignId" TEXT,
    "payload" JSONB NOT NULL,
    "status" "PendingActionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "pending_ai_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "text" TEXT NOT NULL,
    "link" TEXT,
    "pendingActionId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_ai_actions_userId_status_idx" ON "pending_ai_actions"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "pending_ai_actions" ADD CONSTRAINT "pending_ai_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_ai_actions" ADD CONSTRAINT "pending_ai_actions_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pendingActionId_fkey" FOREIGN KEY ("pendingActionId") REFERENCES "pending_ai_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_pendingActionId_fkey" FOREIGN KEY ("pendingActionId") REFERENCES "pending_ai_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
