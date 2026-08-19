import { z } from '@hono/zod-openapi'

export const CampaignStatusEnum = z.enum([
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
])

export const CampaignSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    caption: z.string().nullable(),
    status: CampaignStatusEnum,
    budget: z.string().openapi({ example: '1500.00' }),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('Campaign')

export const CreateCampaignSchema = z
  .object({
    name: z.string().min(1),
    caption: z.string().max(2000).optional(),
    status: CampaignStatusEnum.optional(),
    budget: z.number().positive(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
  })
  .openapi('CreateCampaignInput')

export const UpdateCampaignSchema = z
  .object({
    name: z.string().min(1).optional(),
    caption: z.string().max(2000).nullable().optional(),
    budget: z.number().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().nullable().optional(),
    status: CampaignStatusEnum.optional(),
  })
  .openapi('UpdateCampaignInput')

export const CampaignIdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>
