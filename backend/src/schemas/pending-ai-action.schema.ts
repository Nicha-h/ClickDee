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
  // Optional Meta-specific fields the AI may include when staging a CREATE
  // (see ai.service.ts's stage_create_campaign tool). Must be declared here
  // too, not just on the tool's own arg schema — Zod object schemas strip
  // unknown keys by default, and confirmPendingAction re-parses the stored
  // payload through this schema before using it.
  objective: z
    .enum([
      'OUTCOME_AWARENESS',
      'OUTCOME_TRAFFIC',
      'OUTCOME_ENGAGEMENT',
      'OUTCOME_LEADS',
      'OUTCOME_SALES',
      'OUTCOME_APP_PROMOTION',
    ])
    .optional(),
  specialAdCategories: z
    .array(
      z.enum(['HOUSING', 'EMPLOYMENT', 'CREDIT', 'ISSUES_ELECTIONS_POLITICS']),
    )
    .optional(),
  campaignBudgetOptimization: z.boolean().optional(),
  creativeFormat: z
    .enum(['image_post', 'video_post', 'reels', 'carousel', 'story'])
    .optional(),
  ctaType: z
    .enum([
      'SHOP_NOW',
      'LEARN_MORE',
      'SIGN_UP',
      'BOOK_TRAVEL',
      'CONTACT_US',
      'DOWNLOAD',
      'GET_OFFER',
      'SUBSCRIBE',
      'WATCH_MORE',
      'MESSAGE_PAGE',
      'CALL_NOW',
      'GET_QUOTE',
    ])
    .optional(),
})

export const PendingAiActionSchema = z
  .object({
    id: z.string(),
    type: PendingActionTypeEnum,
    targetCampaignId: z.string().nullable(),
    payload: PendingActionPayloadSchema,
    status: PendingActionStatusEnum,
    createdAt: z.iso.datetime(),
    // Non-blocking content warnings computed at serialization time from
    // payload.caption (see lib/caption-content-screen.ts) — surfaced so the
    // human confirming this action can spot a link or injected-instruction-
    // like phrasing before clicking confirm. Never persisted; always
    // reflects the current payload, including after a research-driven
    // caption revision.
    contentWarnings: z.array(z.string()),
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
