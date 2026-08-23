import { describe, expect, it } from 'vitest'
import { CreateCampaignSchema } from './campaign.schema.js'

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Launch',
    budget: 1500,
    startDate: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('CreateCampaignSchema', () => {
  it('accepts a minimal plain draft with no Meta-specific fields', () => {
    const result = CreateCampaignSchema.safeParse(validInput())
    expect(result.success).toBe(true)
  })

  it('rejects a non-ODAX objective value', () => {
    const result = CreateCampaignSchema.safeParse(
      validInput({ objective: 'LINK_CLICKS' }),
    )
    expect(result.success).toBe(false)
  })

  it('accepts every ODAX objective value', () => {
    for (const objective of [
      'OUTCOME_AWARENESS',
      'OUTCOME_TRAFFIC',
      'OUTCOME_ENGAGEMENT',
      'OUTCOME_LEADS',
      'OUTCOME_SALES',
      'OUTCOME_APP_PROMOTION',
    ]) {
      expect(
        CreateCampaignSchema.safeParse(validInput({ objective })).success,
      ).toBe(true)
    }
  })

  it('defaults specialAdCategories to an empty array', () => {
    const result = CreateCampaignSchema.parse(validInput())
    expect(result.specialAdCategories).toEqual([])
  })

  it('rejects setting both dailyBudget and lifetimeBudget', () => {
    const result = CreateCampaignSchema.safeParse(
      validInput({ dailyBudget: 10000, lifetimeBudget: 50000 }),
    )
    expect(result.success).toBe(false)
  })

  it('requires a bid amount when using a capped bid strategy', () => {
    const result = CreateCampaignSchema.safeParse(
      validInput({ bidStrategy: 'COST_CAP' }),
    )
    expect(result.success).toBe(false)
  })

  it('accepts a capped bid strategy with a bid amount', () => {
    const result = CreateCampaignSchema.safeParse(
      validInput({ bidStrategy: 'COST_CAP', bidAmount: 500 }),
    )
    expect(result.success).toBe(true)
  })

  it('rejects a bid amount with the uncapped bid strategy', () => {
    const result = CreateCampaignSchema.safeParse(
      validInput({ bidStrategy: 'LOWEST_COST_WITHOUT_CAP', bidAmount: 500 }),
    )
    expect(result.success).toBe(false)
  })

  it('rejects a campaign-level budget when campaignBudgetOptimization is off', () => {
    const result = CreateCampaignSchema.safeParse(
      validInput({ campaignBudgetOptimization: false, dailyBudget: 10000 }),
    )
    expect(result.success).toBe(false)
  })

  it('does not require a budget just because campaignBudgetOptimization defaults to true', () => {
    // Regression guard: this rule is enforced at publish time (see
    // meta-publish.service.ts), not at schema/local-draft-creation time —
    // otherwise every plain draft campaign without a Meta budget yet would
    // 400 on creation, per campaignBudgetOptimization's default(true).
    const result = CreateCampaignSchema.safeParse(validInput())
    expect(result.success).toBe(true)
  })
})
