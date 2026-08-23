import { randomUUID } from 'node:crypto'
import { prisma } from '../db/client.js'
import { metaRequest } from '../lib/meta-client.js'
import { env } from '../config/env.js'
import {
  getDevMetaCredentials,
  MetaNotConfiguredError,
} from '../config/meta.js'
import type { MetaCredentials } from '../config/meta.js'
import type {
  AdModel,
  AdSetModel,
  CampaignModel,
} from '../generated/prisma/models.js'

// Demo/offline escape hatch (env.META_SIMULATE_PUBLISH) — see config/env.ts.
// Produces an obviously-fake id (never mistakable for a real Meta id) so a
// simulated object is easy to spot in the DB after the fact.
function simulatedMetaId(prefix: string) {
  return `sim_${prefix}_${randomUUID()}`
}

export class MetaPublishValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MetaPublishValidationError'
  }
}

interface MetaIdResponse {
  id: string
}

interface MetaObjectStatusResponse {
  status?: string
  effective_status?: string
  // Field name unverified against Meta's current docs — re-check at
  // implementation/testing time; this is a best-effort surface of "why
  // isn't this live" for the frontend, not load-bearing logic.
  ad_review_feedback?: unknown
}

async function fetchMetaStatus(
  metaId: string,
  credentials: MetaCredentials,
  includeReviewFeedback: boolean,
): Promise<{
  status: string | null
  effectiveStatus: string | null
  reviewFeedback: string | null
}> {
  const fields = includeReviewFeedback
    ? 'status,effective_status,ad_review_feedback'
    : 'status,effective_status'
  const result = await metaRequest<MetaObjectStatusResponse>(metaId, {
    accessToken: credentials.accessToken,
    params: { fields },
  })
  return {
    status: result.status ?? null,
    effectiveStatus: result.effective_status ?? null,
    reviewFeedback: result.ad_review_feedback
      ? JSON.stringify(result.ad_review_feedback)
      : null,
  }
}

// Task 1's required/conditionally-required rules, enforced here (at publish
// time) rather than at local draft creation, since the local-draft-first
// design lets a campaign be built up incrementally (e.g. via the AI staging
// flow) before it's ready to actually go to Meta.
function assertCampaignReadyForMeta(campaign: CampaignModel) {
  if (!campaign.objective) {
    throw new MetaPublishValidationError(
      'Set a campaign objective before publishing to Meta.',
    )
  }
  if (
    campaign.campaignBudgetOptimization &&
    campaign.dailyBudget === null &&
    campaign.lifetimeBudget === null
  ) {
    throw new MetaPublishValidationError(
      'Set a daily or lifetime budget on the campaign before publishing (campaign budget optimization is on).',
    )
  }
}

function assertAdSetReadyForMeta(campaign: CampaignModel, adSet: AdSetModel) {
  if (
    !campaign.campaignBudgetOptimization &&
    adSet.dailyBudget === null &&
    adSet.lifetimeBudget === null
  ) {
    throw new MetaPublishValidationError(
      `Set a daily or lifetime budget on ad set "${adSet.name}" before publishing (campaign budget optimization is off, so each ad set needs its own budget).`,
    )
  }
}

async function pushCampaign(
  campaign: CampaignModel,
  credentials: MetaCredentials,
) {
  if (campaign.metaCampaignId) return campaign

  if (env.META_SIMULATE_PUBLISH) {
    return prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        metaCampaignId: simulatedMetaId('campaign'),
        metaStatus: 'PAUSED',
        metaEffectiveStatus: 'PAUSED',
      },
    })
  }

  const result = await metaRequest<MetaIdResponse>(
    `act_${credentials.adAccountId}/campaigns`,
    {
      method: 'POST',
      accessToken: credentials.accessToken,
      params: {
        name: campaign.name,
        objective: campaign.objective,
        // Always PAUSED on creation — never ACTIVE. A separate explicit
        // setMetaStatus call is the only path that can activate.
        status: 'PAUSED',
        special_ad_categories: campaign.specialAdCategories,
        buying_type: campaign.buyingType ?? 'AUCTION',
        ...(campaign.bidStrategy && { bid_strategy: campaign.bidStrategy }),
        ...(campaign.bidAmount !== null && { bid_amount: campaign.bidAmount }),
        is_campaign_budget_optimization_enabled:
          campaign.campaignBudgetOptimization,
        ...(campaign.campaignBudgetOptimization &&
          campaign.dailyBudget !== null && {
            daily_budget: campaign.dailyBudget,
          }),
        ...(campaign.campaignBudgetOptimization &&
          campaign.lifetimeBudget !== null && {
            lifetime_budget: campaign.lifetimeBudget,
          }),
      },
    },
  )

  const status = await fetchMetaStatus(result.id, credentials, false)
  return prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      metaCampaignId: result.id,
      metaStatus: status.status ?? 'PAUSED',
      metaEffectiveStatus: status.effectiveStatus,
    },
  })
}

async function pushAdSet(
  adSet: AdSetModel,
  metaCampaignId: string,
  campaignBudgetOptimization: boolean,
  credentials: MetaCredentials,
) {
  if (adSet.metaAdSetId) return adSet

  if (env.META_SIMULATE_PUBLISH) {
    return prisma.adSet.update({
      where: { id: adSet.id },
      data: {
        metaAdSetId: simulatedMetaId('adset'),
        metaStatus: 'PAUSED',
        metaEffectiveStatus: 'PAUSED',
      },
    })
  }

  const result = await metaRequest<MetaIdResponse>(
    `act_${credentials.adAccountId}/adsets`,
    {
      method: 'POST',
      accessToken: credentials.accessToken,
      params: {
        name: adSet.name,
        campaign_id: metaCampaignId,
        optimization_goal: adSet.optimizationGoal,
        billing_event: adSet.billingEvent,
        targeting: adSet.targeting,
        status: 'PAUSED',
        ...(!campaignBudgetOptimization &&
          adSet.dailyBudget !== null && { daily_budget: adSet.dailyBudget }),
        ...(!campaignBudgetOptimization &&
          adSet.lifetimeBudget !== null && {
            lifetime_budget: adSet.lifetimeBudget,
          }),
        ...(adSet.bidAmount !== null && { bid_amount: adSet.bidAmount }),
        ...(adSet.startTime && {
          start_time: adSet.startTime.toISOString(),
        }),
        ...(adSet.endTime && { end_time: adSet.endTime.toISOString() }),
        ...(adSet.promotedObject && { promoted_object: adSet.promotedObject }),
        ...(adSet.destinationType && {
          destination_type: adSet.destinationType,
        }),
        ...(adSet.dsaBeneficiary && { dsa_beneficiary: adSet.dsaBeneficiary }),
      },
    },
  )

  const status = await fetchMetaStatus(result.id, credentials, false)
  return prisma.adSet.update({
    where: { id: adSet.id },
    data: {
      metaAdSetId: result.id,
      metaStatus: status.status ?? 'PAUSED',
      metaEffectiveStatus: status.effectiveStatus,
    },
  })
}

async function pushCreative(
  creative: {
    id: string
    name: string
    objectStorySpec: unknown
    metaCreativeId: string | null
  },
  credentials: MetaCredentials,
) {
  if (creative.metaCreativeId) return creative.metaCreativeId

  if (env.META_SIMULATE_PUBLISH) {
    const metaCreativeId = simulatedMetaId('creative')
    await prisma.adCreative.update({
      where: { id: creative.id },
      data: { metaCreativeId },
    })
    return metaCreativeId
  }

  const result = await metaRequest<MetaIdResponse>(
    `act_${credentials.adAccountId}/adcreatives`,
    {
      method: 'POST',
      accessToken: credentials.accessToken,
      params: {
        name: creative.name,
        object_story_spec: creative.objectStorySpec,
      },
    },
  )

  await prisma.adCreative.update({
    where: { id: creative.id },
    data: { metaCreativeId: result.id },
  })
  return result.id
}

async function pushAd(
  ad: AdModel,
  metaAdSetId: string,
  metaCreativeId: string,
  credentials: MetaCredentials,
) {
  if (ad.metaAdId) return ad

  if (env.META_SIMULATE_PUBLISH) {
    return prisma.ad.update({
      where: { id: ad.id },
      data: {
        metaAdId: simulatedMetaId('ad'),
        metaStatus: 'PAUSED',
        metaEffectiveStatus: 'PAUSED',
        metaReviewFeedback: null,
      },
    })
  }

  const result = await metaRequest<MetaIdResponse>(
    `act_${credentials.adAccountId}/ads`,
    {
      method: 'POST',
      accessToken: credentials.accessToken,
      params: {
        name: ad.name,
        adset_id: metaAdSetId,
        creative: { creative_id: metaCreativeId },
        status: 'PAUSED',
      },
    },
  )

  const status = await fetchMetaStatus(result.id, credentials, true)
  return prisma.ad.update({
    where: { id: ad.id },
    data: {
      metaAdId: result.id,
      metaStatus: status.status ?? 'PAUSED',
      metaEffectiveStatus: status.effectiveStatus,
      metaReviewFeedback: status.reviewFeedback,
    },
  })
}

// Pushes the whole local hierarchy (campaign -> ad sets -> creatives -> ads)
// to Meta in order, everything created PAUSED. This is the only code path
// that talks to Meta for object creation — the cross-cutting "never spend by
// accident" rule. Idempotent per level: an object that already has a
// metaXId is skipped, so re-running after a partial failure only pushes
// what's still missing.
export async function publishCampaignToMeta(
  userId: string,
  campaignId: string,
) {
  const credentials = getDevMetaCredentials()
  if (!credentials) throw new MetaNotConfiguredError()

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      adSets: { include: { creatives: true, ads: true } },
    },
  })
  if (!campaign) return null

  assertCampaignReadyForMeta(campaign)
  for (const adSet of campaign.adSets) {
    assertAdSetReadyForMeta(campaign, adSet)
  }

  const pushedCampaign = await pushCampaign(campaign, credentials)

  const adSetResults: {
    id: string
    metaAdSetId: string
    metaEffectiveStatus: string | null
  }[] = []
  const adResults: {
    id: string
    metaAdId: string
    metaEffectiveStatus: string | null
    metaReviewFeedback: string | null
  }[] = []

  for (const adSet of campaign.adSets) {
    const pushedAdSet = await pushAdSet(
      adSet,
      pushedCampaign.metaCampaignId!,
      campaign.campaignBudgetOptimization,
      credentials,
    )
    adSetResults.push({
      id: pushedAdSet.id,
      metaAdSetId: pushedAdSet.metaAdSetId!,
      metaEffectiveStatus: pushedAdSet.metaEffectiveStatus,
    })

    const creativeMetaIds = new Map<string, string>()
    for (const creative of adSet.creatives) {
      const metaCreativeId = await pushCreative(creative, credentials)
      creativeMetaIds.set(creative.id, metaCreativeId)
    }

    for (const ad of adSet.ads) {
      const metaCreativeId = creativeMetaIds.get(ad.creativeId)
      if (!metaCreativeId) {
        throw new MetaPublishValidationError(
          `Ad "${ad.name}" references a creative that wasn't pushed to Meta.`,
        )
      }
      const pushedAd = await pushAd(
        ad,
        pushedAdSet.metaAdSetId!,
        metaCreativeId,
        credentials,
      )
      adResults.push({
        id: pushedAd.id,
        metaAdId: pushedAd.metaAdId!,
        metaEffectiveStatus: pushedAd.metaEffectiveStatus,
        metaReviewFeedback: pushedAd.metaReviewFeedback,
      })
    }
  }

  return {
    campaignId: pushedCampaign.id,
    metaCampaignId: pushedCampaign.metaCampaignId!,
    metaStatus: pushedCampaign.metaStatus,
    metaEffectiveStatus: pushedCampaign.metaEffectiveStatus,
    adSets: adSetResults,
    ads: adResults,
  }
}

// --- Sync for post-publish edits ------------------------------------------
// Extends the "only two Meta-mutating functions" invariant documented above
// to three. Still PAUSED-safe and untouched by the ACTIVE-status rule
// (setMetaStatus stays the only path to ACTIVE) — these only ever repoint
// which (already non-active-status-changing) creative an existing ad serves.
// Meta ad creatives are immutable via the Graph API once created, so
// "editing" a published one means pushing a brand-new Meta creative object
// and repointing every live ad at it, not patching the old one in place —
// the old Meta creative object is simply left orphaned/unused, which is
// harmless (Meta doesn't require explicit deletion).

async function pushReplacementCreative(
  creative: { id: string; name: string; objectStorySpec: unknown },
  credentials: MetaCredentials,
): Promise<string> {
  if (env.META_SIMULATE_PUBLISH) {
    const metaCreativeId = simulatedMetaId('creative')
    await prisma.adCreative.update({
      where: { id: creative.id },
      data: { metaCreativeId },
    })
    return metaCreativeId
  }

  const result = await metaRequest<MetaIdResponse>(
    `act_${credentials.adAccountId}/adcreatives`,
    {
      method: 'POST',
      accessToken: credentials.accessToken,
      params: {
        name: creative.name,
        object_story_spec: creative.objectStorySpec,
      },
    },
  )

  await prisma.adCreative.update({
    where: { id: creative.id },
    data: { metaCreativeId: result.id },
  })
  return result.id
}

async function repointAdOnMeta(
  metaAdId: string,
  metaCreativeId: string,
  credentials: MetaCredentials,
) {
  if (env.META_SIMULATE_PUBLISH) return

  await metaRequest(metaAdId, {
    method: 'POST',
    accessToken: credentials.accessToken,
    params: { creative: { creative_id: metaCreativeId } },
  })
}

// Called by ad-creative.service.ts's updateAdCreative when the edited
// creative already has a metaCreativeId — pushes a replacement Meta creative
// and repoints every sibling Ad that's already live. Ads not yet published
// are untouched; they pick up the (already-updated) metaCreativeId naturally
// on their first publishCampaignToMeta run.
export async function syncCreativeEditToMeta(
  userId: string,
  campaignId: string,
  adSetId: string,
  creativeId: string,
) {
  const credentials = getDevMetaCredentials()
  if (!credentials) throw new MetaNotConfiguredError()

  const adSet = await prisma.adSet.findFirst({
    where: { id: adSetId, campaignId, userId },
  })
  if (!adSet) return null

  const creative = await prisma.adCreative.findFirst({
    where: { id: creativeId, adSetId, userId },
  })
  if (!creative) return null

  const metaCreativeId = await pushReplacementCreative(creative, credentials)

  const ads = await prisma.ad.findMany({
    where: { creativeId, adSetId, userId, metaAdId: { not: null } },
  })
  for (const ad of ads) {
    await repointAdOnMeta(ad.metaAdId!, metaCreativeId, credentials)
  }

  return { metaCreativeId, repointedAdIds: ads.map((a) => a.id) }
}

// Called by ad.service.ts's updateAd when an already-published ad's
// creativeId changes — ensures the *target* creative has a metaCreativeId
// (reuses the existing idempotent pushCreative, since its content isn't
// changing, just being pointed at) then repoints the ad.
export async function syncAdCreativeChangeToMeta(
  userId: string,
  campaignId: string,
  adSetId: string,
  adId: string,
) {
  const credentials = getDevMetaCredentials()
  if (!credentials) throw new MetaNotConfiguredError()

  const adSet = await prisma.adSet.findFirst({
    where: { id: adSetId, campaignId, userId },
  })
  if (!adSet) return null

  const ad = await prisma.ad.findFirst({
    where: { id: adId, adSetId, userId },
    include: { creative: true },
  })
  if (!ad || !ad.metaAdId) return null

  const metaCreativeId = await pushCreative(ad.creative, credentials)
  await repointAdOnMeta(ad.metaAdId, metaCreativeId, credentials)

  return { metaCreativeId }
}

// The only path that can push ACTIVE to Meta. Cascades to child ad sets and
// ads too — Meta requires the campaign AND its ad sets AND its ads to all be
// enabled for delivery to actually happen, not just the campaign.
export async function setMetaStatus(
  userId: string,
  campaignId: string,
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
) {
  const credentials = getDevMetaCredentials()
  if (!credentials) throw new MetaNotConfiguredError()

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: { adSets: { include: { ads: true } } },
  })
  if (!campaign) return null
  if (!campaign.metaCampaignId) {
    throw new MetaPublishValidationError(
      'Publish this campaign to Meta before changing its status there.',
    )
  }

  if (!env.META_SIMULATE_PUBLISH) {
    await metaRequest(campaign.metaCampaignId, {
      method: 'POST',
      accessToken: credentials.accessToken,
      params: { status },
    })
  }

  for (const adSet of campaign.adSets) {
    if (!adSet.metaAdSetId) continue
    if (!env.META_SIMULATE_PUBLISH) {
      await metaRequest(adSet.metaAdSetId, {
        method: 'POST',
        accessToken: credentials.accessToken,
        params: { status },
      })
    }
    await prisma.adSet.update({
      where: { id: adSet.id },
      data: { metaStatus: status },
    })

    for (const ad of adSet.ads) {
      if (!ad.metaAdId) continue
      if (!env.META_SIMULATE_PUBLISH) {
        await metaRequest(ad.metaAdId, {
          method: 'POST',
          accessToken: credentials.accessToken,
          params: { status },
        })
      }
      await prisma.ad.update({
        where: { id: ad.id },
        data: { metaStatus: status },
      })
    }
  }

  const updated = await prisma.campaign.update({
    where: { id: campaign.id },
    data: { metaStatus: status },
  })

  return { campaignId: updated.id, metaStatus: updated.metaStatus! }
}
