import { z } from '@hono/zod-openapi'
import { PendingActionStatusEnum } from './pending-ai-action.schema.js'

export const NotificationTypeEnum = z.enum(['AI_TASK', 'SYSTEM'])

export const NotificationSchema = z
  .object({
    id: z.string(),
    type: NotificationTypeEnum,
    text: z.string(),
    link: z.string().nullable(),
    pendingActionId: z.string().nullable(),
    pendingActionStatus: PendingActionStatusEnum.nullable(),
    read: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .openapi('Notification')

export const NotificationIdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})
