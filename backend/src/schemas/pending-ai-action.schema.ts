import { z } from '@hono/zod-openapi'

export const PendingActionTypeEnum = z.enum(['CREATE', 'UPDATE', 'DELETE'])

export const PendingActionStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELED',
  'EXPIRED',
])

export const PendingActionPayloadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  budget: z.number().positive().optional(),
  startDate: z
    .string()
    .refine((s: string) => !Number.isNaN(Date.parse(s)))
    .optional(),
  endDate: z
    .string()
    .refine((s: string) => !Number.isNaN(Date.parse(s)))
    .nullable()
    .optional(),
  caption: z.string().max(2000).optional(),
  proposedStatus: z.literal('DRAFT').optional(),
})

export const PendingAiActionSchema = z
  .object({
    id: z.string(),
    type: PendingActionTypeEnum,
    targetCampaignId: z.string().nullable(),
    payload: PendingActionPayloadSchema,
    status: PendingActionStatusEnum,
    createdAt: z.string().datetime(),
  })
  .openapi('PendingAiAction')

export const ConfirmPendingActionSchema = z
  .object({
    publish: z.boolean().default(false),
  })
  .openapi('ConfirmPendingActionInput')

export const ConfirmPendingActionResponseSchema = z
  .object({
    campaignId: z.string().nullable(),
    status: PendingActionStatusEnum,
  })
  .openapi('ConfirmPendingActionResponse')

export const CancelPendingActionResponseSchema = z
  .object({
    status: PendingActionStatusEnum,
  })
  .openapi('CancelPendingActionResponse')

export const PendingActionIdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

export type PendingActionPayload = z.infer<typeof PendingActionPayloadSchema>
export type ConfirmPendingActionInput = z.infer<
  typeof ConfirmPendingActionSchema
>
