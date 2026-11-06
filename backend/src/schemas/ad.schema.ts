import { z } from '@hono/zod-openapi'

export const AdSchema = z
  .object({
    id: z.string(),
    adSetId: z.string(),
    creativeId: z.string(),
    name: z.string(),
    metaAdId: z.string().nullable(),
    metaStatus: z.string().nullable(),
    metaEffectiveStatus: z.string().nullable(),
    metaReviewFeedback: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi('Ad')

export const CreateAdSchema = z
  .object({
    name: z.string().min(1),
    creativeId: z.string().min(1),
  })
  .openapi('CreateAdInput')

export const UpdateAdSchema = z
  .object({
    name: z.string().min(1).optional(),
    creativeId: z.string().min(1).optional(),
  })
  .openapi('UpdateAdInput')

export const AdSetScopedParamSchema = z.object({
  campaignId: z.string().openapi({ param: { name: 'campaignId', in: 'path' } }),
  adSetId: z.string().openapi({ param: { name: 'adSetId', in: 'path' } }),
})

export const AdIdParamSchema = AdSetScopedParamSchema.extend({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

export type CreateAdInput = z.infer<typeof CreateAdSchema>
export type UpdateAdInput = z.infer<typeof UpdateAdSchema>
