import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  NotificationSchema,
  NotificationIdParamSchema,
} from '../schemas/notification.schema.js'
import * as notificationService from '../services/notification.service.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import type { NotificationModel } from '../generated/prisma/models.js'
import type { PendingActionStatus } from '../generated/prisma/client.js'

type NotificationWithAction = NotificationModel & {
  pendingAction: { status: PendingActionStatus } | null
}

function serializeNotification(notification: NotificationWithAction) {
  return {
    id: notification.id,
    type: notification.type,
    text: notification.text,
    link: notification.link,
    pendingActionId: notification.pendingActionId,
    pendingActionStatus: notification.pendingAction?.status ?? null,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  }
}

export const notificationsApp = new OpenAPIHono<{ Variables: AuthVariables }>()

const listNotificationsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Notifications'],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: {
        'application/json': { schema: z.array(NotificationSchema) },
      },
      description: "List the caller's notifications, newest first",
    },
  },
})
notificationsApp.openapi(listNotificationsRoute, async (c) => {
  const userId = c.get('userId')
  const notifications = await notificationService.listNotifications(userId)
  return c.json(notifications.map(serializeNotification), 200)
})

const markReadRoute = createRoute({
  method: 'post',
  path: '/{id}/read',
  tags: ['Notifications'],
  middleware: [requireAuth] as const,
  request: { params: NotificationIdParamSchema },
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ success: z.boolean() }) },
      },
      description: 'Marked as read',
    },
  },
})
notificationsApp.openapi(markReadRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  await notificationService.markRead(userId, id)
  return c.json({ success: true }, 200)
})

const markAllReadRoute = createRoute({
  method: 'post',
  path: '/read-all',
  tags: ['Notifications'],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ success: z.boolean() }) },
      },
      description: 'Marked all as read',
    },
  },
})
notificationsApp.openapi(markAllReadRoute, async (c) => {
  const userId = c.get('userId')
  await notificationService.markAllRead(userId)
  return c.json({ success: true }, 200)
})
