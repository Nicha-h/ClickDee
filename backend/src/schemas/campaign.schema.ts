import { z } from '@hono/zod-openapi'

export const CampaignStatusEnum = z.enum([
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
])

// ODAX outcome-based objectives only — Meta rejects legacy values (e.g.
// CONVERSIONS/LINK_CLICKS) on campaign creation.
export const CampaignObjectiveEnum = z.enum([
  'OUTCOME_AWARENESS',
  'OUTCOME_TRAFFIC',
  'OUTCOME_ENGAGEMENT',
  'OUTCOME_LEADS',
  'OUTCOME_SALES',
  'OUTCOME_APP_PROMOTION',
])

export const SpecialAdCategoryEnum = z.enum([
  'HOUSING',
  'EMPLOYMENT',
  'CREDIT',
  'ISSUES_ELECTIONS_POLITICS',
])

export const BidStrategyEnum = z.enum([
  'LOWEST_COST_WITHOUT_CAP',
  'LOWEST_COST_WITH_BID_CAP',
  'COST_CAP',
  'LOWEST_COST_WITH_MIN_ROAS',
])

export const BuyingTypeEnum = z.enum(['AUCTION'])

const CAPPED_BID_STRATEGIES = new Set([
  'LOWEST_COST_WITH_BID_CAP',
  'COST_CAP',
  'LOWEST_COST_WITH_MIN_ROAS',
])

// Shared by create/update: encodes the Task-1 validation rules that only
// make sense once you know both fields at once (bid strategy vs bid amount,
// CBO vs where the budget lives, daily vs lifetime budget). Applied whenever
// the relevant fields are present — a campaign with none of these fields set
// yet (an in-progress local draft) is left alone; the full "ready to publish
// to Meta" check happens in meta-publish.service.ts once every hierarchy
// level is filled in.
function superRefineMetaFields<
  T extends {
    bidStrategy?: string
    bidAmount?: number
    campaignBudgetOptimization?: boolean
    dailyBudget?: number
    lifetimeBudget?: number
  },
>(data: T, ctx: z.RefinementCtx) {
  if (data.dailyBudget !== undefined && data.lifetimeBudget !== undefined) {
    ctx.addIssue({
      code: 'custom',
      message:
        'Set either a daily budget or a lifetime budget, not both — Meta rejects campaigns with both set.',
      path: ['dailyBudget'],
    })
  }

  if (data.bidStrategy !== undefined) {
    const requiresCap = CAPPED_BID_STRATEGIES.has(data.bidStrategy)
    if (requiresCap && data.bidAmount === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: `A bid amount is required when using the "${data.bidStrategy}" bid strategy.`,
        path: ['bidAmount'],
      })
    }
    if (!requiresCap && data.bidAmount !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message:
          'A bid amount cannot be set with the "LOWEST_COST_WITHOUT_CAP" bid strategy — Meta ignores it, so remove it to avoid confusion.',
        path: ['bidAmount'],
      })
    }
  }

  // Note: "campaignBudgetOptimization=true requires a campaign-level budget"
  // is intentionally NOT checked here. campaignBudgetOptimization defaults
  // to true on every CreateCampaignSchema parse, so enforcing that rule at
  // this layer would reject every local draft campaign that hasn't set a
  // Meta budget yet — which breaks the local-draft-first design (a campaign
  // can be built up incrementally, e.g. via the AI staging flow, before it's
  // ready to publish). This rule is enforced once, correctly, at publish
  // time in meta-publish.service.ts's assertCampaignReadyForMeta, which
  // reads the actual stored value rather than a schema default.

  if (
    data.campaignBudgetOptimization === false &&
    (data.dailyBudget !== undefined || data.lifetimeBudget !== undefined)
  ) {
    ctx.addIssue({
      code: 'custom',
      message:
        'When campaign budget optimization is off, set the budget on each ad set instead of on the campaign.',
      path: ['dailyBudget'],
    })
  }
}

export const CampaignSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    caption: z.string().nullable(),
    status: CampaignStatusEnum,
    budget: z.string().openapi({ example: '1500.00' }),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().nullable(),
    objective: CampaignObjectiveEnum.nullable(),
    specialAdCategories: z.array(SpecialAdCategoryEnum),
    bidStrategy: BidStrategyEnum.nullable(),
    bidAmount: z.number().int().nullable(),
    buyingType: BuyingTypeEnum.nullable(),
    campaignBudgetOptimization: z.boolean(),
    dailyBudget: z.number().int().nullable(),
    lifetimeBudget: z.number().int().nullable(),
    metaCampaignId: z.string().nullable(),
    metaStatus: z.string().nullable(),
    metaEffectiveStatus: z.string().nullable(),
    metaReviewFeedback: z.string().nullable(),
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
    objective: CampaignObjectiveEnum.optional(),
    specialAdCategories: z.array(SpecialAdCategoryEnum).optional().default([]),
    bidStrategy: BidStrategyEnum.optional(),
    bidAmount: z.number().int().positive().optional(),
    buyingType: BuyingTypeEnum.optional(),
    campaignBudgetOptimization: z.boolean().optional().default(true),
    // Minor currency unit (satang for THB) — never a major-unit decimal.
    dailyBudget: z.number().int().positive().optional(),
    lifetimeBudget: z.number().int().positive().optional(),
  })
  .openapi('CreateCampaignInput')
  .superRefine(superRefineMetaFields)

export const UpdateCampaignSchema = z
  .object({
    name: z.string().min(1).optional(),
    caption: z.string().max(2000).nullable().optional(),
    budget: z.number().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().nullable().optional(),
    status: CampaignStatusEnum.optional(),
    objective: CampaignObjectiveEnum.optional(),
    specialAdCategories: z.array(SpecialAdCategoryEnum).optional(),
    bidStrategy: BidStrategyEnum.optional(),
    bidAmount: z.number().int().positive().optional(),
    buyingType: BuyingTypeEnum.optional(),
    campaignBudgetOptimization: z.boolean().optional(),
    dailyBudget: z.number().int().positive().optional(),
    lifetimeBudget: z.number().int().positive().optional(),
  })
  .openapi('UpdateCampaignInput')
  .superRefine(superRefineMetaFields)

export const CampaignIdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>
