import { z } from '@hono/zod-openapi'

// Meta's optimization_goal/billing_event/destination_type vocabularies are
// large and grow independently of our releases — curated to the values this
// app's supported objectives actually use, not the full Meta list. Extend
// as new objectives/formats are supported.
export const OptimizationGoalEnum = z.enum([
  'LINK_CLICKS',
  'REACH',
  'IMPRESSIONS',
  'CONVERSIONS',
  'LANDING_PAGE_VIEWS',
  'OFFSITE_CONVERSIONS',
  'THRUPLAY',
  'LEAD_GENERATION',
  'APP_INSTALLS',
])

export const BillingEventEnum = z.enum(['IMPRESSIONS', 'LINK_CLICKS'])

export const DestinationTypeEnum = z.enum([
  'APP_STORE',
  'ON_AD',
  'WEBSITE',
  'MESSENGER',
  'WHATSAPP',
])

// Deliberately permissive (catchall) — this is Meta's own targeting object,
// passed through close to as-is rather than re-modeling every possible key.
const TargetingSchema = z
  .object({
    geo_locations: z.record(z.string(), z.unknown()).optional(),
    age_min: z.number().int().min(13).max(65).optional(),
    age_max: z.number().int().min(13).max(65).optional(),
    genders: z.array(z.number().int()).optional(),
    interests: z
      .array(z.object({ id: z.string(), name: z.string().optional() }))
      .optional(),
    custom_audiences: z.array(z.object({ id: z.string() })).optional(),
    // Recommended default for SMEs with no existing audience data — Meta
    // auto-finds the audience instead of requiring manual targeting.
    targeting_automation: z
      .object({ advantage_audience: z.union([z.literal(0), z.literal(1)]) })
      .optional(),
    publisher_platforms: z.array(z.string()).optional(),
    facebook_positions: z.array(z.string()).optional(),
    instagram_positions: z.array(z.string()).optional(),
  })
  .catchall(z.unknown())
  .openapi('AdSetTargeting')

const superRefineBudget = (
  data: { dailyBudget?: number; lifetimeBudget?: number },
  ctx: z.RefinementCtx,
) => {
  if (data.dailyBudget !== undefined && data.lifetimeBudget !== undefined) {
    ctx.addIssue({
      code: 'custom',
      message:
        'Set either a daily budget or a lifetime budget on this ad set, not both.',
      path: ['dailyBudget'],
    })
  }
}

export const AdSetSchema = z
  .object({
    id: z.string(),
    campaignId: z.string(),
    name: z.string(),
    optimizationGoal: z.string(),
    billingEvent: z.string(),
    destinationType: z.string().nullable(),
    dsaBeneficiary: z.string().nullable(),
    targeting: z.record(z.string(), z.unknown()),
    dailyBudget: z.number().int().nullable(),
    lifetimeBudget: z.number().int().nullable(),
    bidAmount: z.number().int().nullable(),
    startTime: z.iso.datetime().nullable(),
    endTime: z.iso.datetime().nullable(),
    promotedObject: z.record(z.string(), z.unknown()).nullable(),
    advantagePlacements: z.boolean(),
    metaAdSetId: z.string().nullable(),
    metaStatus: z.string().nullable(),
    metaEffectiveStatus: z.string().nullable(),
    metaReviewFeedback: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi('AdSet')

export const CreateAdSetSchema = z
  .object({
    name: z.string().min(1),
    optimizationGoal: OptimizationGoalEnum,
    billingEvent: BillingEventEnum,
    targeting: TargetingSchema.optional().default({
      targeting_automation: { advantage_audience: 1 },
    }),
    dailyBudget: z.number().int().positive().optional(),
    lifetimeBudget: z.number().int().positive().optional(),
    bidAmount: z.number().int().positive().optional(),
    startTime: z.iso.datetime().optional(),
    endTime: z.iso.datetime().optional(),
    // Conditionally required (checked in ad-set.service.ts against the
    // parent campaign's objective, since app-install/lead-gen campaigns need
    // these but this schema alone doesn't know the campaign's objective).
    promotedObject: z.record(z.string(), z.unknown()).optional(),
    destinationType: DestinationTypeEnum.optional(),
    // EU delivery requirement — likely N/A for Thailand-only targeting, but
    // deliberately not hardcoded out; it's a per-campaign config the SME (or
    // their agency) sets, not something we should infer/omit.
    dsaBeneficiary: z.string().optional(),
    advantagePlacements: z.boolean().optional().default(true),
  })
  .openapi('CreateAdSetInput')
  .superRefine(superRefineBudget)

export const UpdateAdSetSchema = z
  .object({
    name: z.string().min(1).optional(),
    optimizationGoal: OptimizationGoalEnum.optional(),
    billingEvent: BillingEventEnum.optional(),
    targeting: TargetingSchema.optional(),
    dailyBudget: z.number().int().positive().optional(),
    lifetimeBudget: z.number().int().positive().optional(),
    bidAmount: z.number().int().positive().optional(),
    startTime: z.iso.datetime().optional(),
    endTime: z.iso.datetime().optional(),
    promotedObject: z.record(z.string(), z.unknown()).optional(),
    destinationType: DestinationTypeEnum.optional(),
    dsaBeneficiary: z.string().optional(),
    advantagePlacements: z.boolean().optional(),
  })
  .openapi('UpdateAdSetInput')
  .superRefine(superRefineBudget)

export const CampaignIdParamSchema = z.object({
  campaignId: z.string().openapi({ param: { name: 'campaignId', in: 'path' } }),
})

export const AdSetIdParamSchema = z.object({
  campaignId: z.string().openapi({ param: { name: 'campaignId', in: 'path' } }),
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

export type CreateAdSetInput = z.infer<typeof CreateAdSetSchema>
export type UpdateAdSetInput = z.infer<typeof UpdateAdSetSchema>
