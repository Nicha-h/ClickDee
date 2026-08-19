import { describe, expect, it, vi } from 'vitest'

vi.mock('../db/client.js', () => ({
  prisma: {
    notification: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}))

import { prisma } from '../db/client.js'
import {
  listNotifications,
  createNotification,
  markRead,
  markAllRead,
  resolveNotificationsForAction,
  updateNotificationLinkForAction,
} from './notification.service.js'

describe('notification.service', () => {
  it('listNotifications scopes by userId, includes pendingAction status, and orders newest first', async () => {
    await listNotifications('user-1')
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { pendingAction: { select: { status: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  })

  it('createNotification sets the owner and defaults pendingActionId to null', async () => {
    await createNotification('user-1', {
      type: 'AI_TASK',
      text: 'AI is working on it',
      link: null,
    })
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'AI_TASK',
        text: 'AI is working on it',
        link: null,
        pendingActionId: null,
      },
    })
  })

  it('markRead scopes by {id, userId}', async () => {
    await markRead('user-1', 'notif-1')
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notif-1', userId: 'user-1' },
      data: { read: true },
    })
  })

  it('markAllRead scopes by userId and only unread rows', async () => {
    await markAllRead('user-1')
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
      data: { read: true },
    })
  })

  it('resolveNotificationsForAction filters by pendingActionId', async () => {
    await resolveNotificationsForAction('action-1')
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { pendingActionId: 'action-1' },
      data: { read: true },
    })
  })

  it('updateNotificationLinkForAction filters by pendingActionId and sets link', async () => {
    await updateNotificationLinkForAction('action-1', '/campaign/campaign-1')
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { pendingActionId: 'action-1' },
      data: { link: '/campaign/campaign-1' },
    })
  })
})
