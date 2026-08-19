import { prisma } from '../db/client.js'
import type { NotificationType } from '../generated/prisma/client.js'

export function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    include: { pendingAction: { select: { status: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export function createNotification(
  userId: string,
  input: {
    type: NotificationType
    text: string
    link: string | null
    pendingActionId?: string | null
  },
) {
  return prisma.notification.create({
    data: {
      userId,
      type: input.type,
      text: input.text,
      link: input.link,
      pendingActionId: input.pendingActionId ?? null,
    },
  })
}

export function markRead(userId: string, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  })
}

export function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

export function resolveNotificationsForAction(pendingActionId: string) {
  return prisma.notification.updateMany({
    where: { pendingActionId },
    data: { read: true },
  })
}

export function updateNotificationLinkForAction(
  pendingActionId: string,
  link: string,
) {
  return prisma.notification.updateMany({
    where: { pendingActionId },
    data: { link },
  })
}
