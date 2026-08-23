import { z } from '@hono/zod-openapi'

export const CampaignIdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

// Meta status values we allow setting via the API — ARCHIVED is the
// permanent-stop state; ACTIVE is deliberately gated behind this one
// explicit endpoint (see meta-publish.service.ts's setMetaStatus) rather
// than being settable through the plain campaign PATCH route, so nothing
// can start spending as a side effect of an unrelated field edit.
export const SetMetaStatusSchema = z
  .object({
    status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']),
  })
  .openapi('SetMetaStatusInput')

export const PublishToMetaResponseSchema = z
  .object({
    campaignId: z.string(),
    metaCampaignId: z.string(),
    metaStatus: z.string().nullable(),
    metaEffectiveStatus: z.string().nullable(),
    adSets: z.array(
      z.object({
        id: z.string(),
        metaAdSetId: z.string(),
        metaEffectiveStatus: z.string().nullable(),
      }),
    ),
    ads: z.array(
      z.object({
        id: z.string(),
        metaAdId: z.string(),
        metaEffectiveStatus: z.string().nullable(),
        metaReviewFeedback: z.string().nullable(),
      }),
    ),
  })
  .openapi('PublishToMetaResponse')

export const SetMetaStatusResponseSchema = z
  .object({
    campaignId: z.string(),
    metaStatus: z.string(),
  })
  .openapi('SetMetaStatusResponse')
