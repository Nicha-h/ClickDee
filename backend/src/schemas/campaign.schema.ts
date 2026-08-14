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
    status: CampaignStatusEnum.optional(),
    budget: z.number().positive(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
  })
  .openapi('CreateCampaignInput')

export const CampaignIdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>
