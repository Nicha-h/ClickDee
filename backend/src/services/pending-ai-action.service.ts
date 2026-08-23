import { prisma } from '../db/client.js'
import * as campaignService from './campaign.service.js'
import * as adSetService from './ad-set.service.js'
import * as notificationService from './notification.service.js'
import { PendingActionPayloadSchema } from '../schemas/pending-ai-action.schema.js'
import type { PendingActionType, Prisma } from '../generated/prisma/client.js'
import type { PendingActionPayload } from '../schemas/pending-ai-action.schema.js'
import type { z } from '@hono/zod-openapi'
import type { OptimizationGoalEnum } from '../schemas/ad-set.schema.js'

type OptimizationGoal = z.infer<typeof OptimizationGoalEnum>

// Maps a chat-staged objective to a reasonable default ad-set optimization
// goal, since the AI staging flow only proposes a campaign — the cascaded
// default ad set below never asks the user for this separately.
const OPTIMIZATION_GOAL_BY_OBJECTIVE: Record<string, OptimizationGoal> = {
  OUTCOME_AWARENESS: 'REACH',
  OUTCOME_TRAFFIC: 'LINK_CLICKS',
  OUTCOME_ENGAGEMENT: 'LINK_CLICKS',
  OUTCOME_LEADS: 'LEAD_GENERATION',
  OUTCOME_SALES: 'OFFSITE_CONVERSIONS',
  OUTCOME_APP_PROMOTION: 'APP_INSTALLS',
}

// Creates a single default Advantage+ ad set under a freshly AI-staged
// campaign, so the local draft hierarchy is one step closer to
// publish-ready without asking the SME a checklist of Meta jargon in chat.
// Deliberately does NOT create an AdCreative/Ad here — every supported
// format needs an uploaded image/video, and media can't be attached through
// a chat tool call; that's a manual follow-up step (see routes/media.ts and
// routes/ad-creatives.ts), not something this cascade can fake around.
async function createDefaultAdSet(
  userId: string,
  campaignId: string,
  payload: PendingActionPayload,
) {
  const optimizationGoal: OptimizationGoal = payload.objective
    ? (OPTIMIZATION_GOAL_BY_OBJECTIVE[payload.objective] ?? 'LINK_CLICKS')
    : 'LINK_CLICKS'

  await adSetService.createAdSet(userId, campaignId, {
    name: `${payload.name ?? 'Campaign'} - Ad Set`,
    optimizationGoal,
    billingEvent: 'IMPRESSIONS',
    targeting: { targeting_automation: { advantage_audience: 1 } },
    advantagePlacements: true,
  })
}

const MAX_PENDING_PER_USER = 5
const PENDING_TTL_MS = 24 * 60 * 60 * 1000

export class TooManyPendingActionsError extends Error {
  constructor() {
    super('Too many pending actions awaiting confirmation')
    this.name = 'TooManyPendingActionsError'
  }
}

function isExpired(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > PENDING_TTL_MS
}

async function expireStaleActions(userId: string) {
  const cutoff = new Date(Date.now() - PENDING_TTL_MS)
  await prisma.pendingAiAction.updateMany({
    where: { userId, status: 'PENDING', createdAt: { lt: cutoff } },
    data: { status: 'EXPIRED', resolvedAt: new Date() },
  })
}

export async function stagePendingAction(
  userId: string,
  conversationId: string,
  type: PendingActionType,
  payload: Record<string, unknown>,
  targetCampaignId?: string | null,
) {
  const jsonPayload = payload as Prisma.InputJsonValue
  // Opportunistically expire the user's own stale rows first, so an
  // abandoned pending action doesn't permanently eat into their cap
  // (there's no cron/background sweeper in this codebase).
  await expireStaleActions(userId)

  const pendingCount = await prisma.pendingAiAction.count({
    where: { userId, status: 'PENDING' },
  })
  if (pendingCount >= MAX_PENDING_PER_USER) {
    throw new TooManyPendingActionsError()
  }

  return prisma.pendingAiAction.create({
    data: {
      userId,
      conversationId,
      type,
      targetCampaignId: targetCampaignId ?? null,
      payload: jsonPayload,
      status: 'PENDING',
    },
  })
}

export function getPendingAction(userId: string, id: string) {
  return prisma.pendingAiAction.findFirst({ where: { id, userId } })
}

// Lets the research pipeline (see ai.service.ts's [[CAPTION]] marker
// handling) revise an already-staged caption once findings come back,
// without re-running the whole staging flow. Same atomic "only if still
// PENDING" guard as confirmPendingAction/cancelPendingAction — a no-op if
// the user already confirmed/canceled before research finished.
export async function updatePendingActionCaption(
  id: string,
  caption: string,
): Promise<void> {
  const action = await prisma.pendingAiAction.findUnique({ where: { id } })
  if (!action || action.status !== 'PENDING') return

  const payload = {
    ...(action.payload as Record<string, unknown>),
    caption,
  } as Prisma.InputJsonValue

  await prisma.pendingAiAction.updateMany({
    where: { id, status: 'PENDING' },
    data: { payload },
  })
}

type ConfirmResult =
  | { outcome: 'notFound' }
  | { outcome: 'invalidState'; status: string }
  | { outcome: 'targetGone' }
  | { outcome: 'confirmed'; campaignId: string | null }

export async function confirmPendingAction(
  userId: string,
  id: string,
  publish: boolean,
): Promise<ConfirmResult> {
  const action = await prisma.pendingAiAction.findFirst({
    where: { id, userId },
  })
  if (!action) return { outcome: 'notFound' }

  if (action.status === 'PENDING' && isExpired(action.createdAt)) {
    await prisma.pendingAiAction.update({
      where: { id },
      data: { status: 'EXPIRED', resolvedAt: new Date() },
    })
    return { outcome: 'invalidState', status: 'EXPIRED' }
  }

  // Atomically claim the row before mutating Campaign, so a confirm/cancel
  // race (double-click, or a concurrent cancel) can't both succeed.
  const claim = await prisma.pendingAiAction.updateMany({
    where: { id, userId, status: 'PENDING' },
    data: { status: 'CONFIRMED', resolvedAt: new Date() },
  })
  if (claim.count === 0) {
    const current = await prisma.pendingAiAction.findFirst({
      where: { id, userId },
    })
    return { outcome: 'invalidState', status: current?.status ?? 'UNKNOWN' }
  }

  const payload = PendingActionPayloadSchema.parse(action.payload)
  let campaignId: string | null = null
  let targetGone = false

  if (action.type === 'CREATE') {
    // THB baht -> satang (Meta's minor-unit budget fields). A fixed
    // start/end schedule reads as a lifetime budget; an open-ended one reads
    // as a daily budget — the AI staging flow only ever proposes one THB
    // figure, so this picks the more sensible Meta-side home for it rather
    // than asking the user to separately specify daily vs lifetime in chat.
    const budgetMinorUnits = payload.budget
      ? Math.round(payload.budget * 100)
      : undefined
    const campaign = await campaignService.createCampaign(userId, {
      name: payload.name!,
      caption: payload.caption,
      budget: payload.budget!,
      startDate: payload.startDate!,
      endDate: payload.endDate ?? undefined,
      status: publish ? 'ACTIVE' : 'DRAFT',
      objective: payload.objective,
      specialAdCategories: payload.specialAdCategories ?? [],
      campaignBudgetOptimization: payload.campaignBudgetOptimization ?? true,
      ...(payload.endDate
        ? { lifetimeBudget: budgetMinorUnits }
        : { dailyBudget: budgetMinorUnits }),
    })
    campaignId = campaign.id
    // Persist the created campaign's id onto the action itself (not just the
    // notification's link) so a later GET /api/ai/messages re-fetch can still
    // show a working "view campaign" link on the resolved card.
    await prisma.pendingAiAction.update({
      where: { id },
      data: { targetCampaignId: campaignId },
    })
    // Local-only cascade — no Meta API call happens here (see
    // meta-publish.service.ts for the only code paths that do). A default
    // ad set is always safe to create since it needs no media; an
    // AdCreative/Ad is deliberately NOT cascaded here even if creativeFormat
    // was staged, since every format needs an uploaded image/video first.
    await createDefaultAdSet(userId, campaignId, payload)
  } else if (action.type === 'UPDATE') {
    const result = await campaignService.updateCampaign(
      userId,
      action.targetCampaignId!,
      {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.caption !== undefined && { caption: payload.caption }),
        ...(payload.budget !== undefined && { budget: payload.budget }),
        ...(payload.startDate !== undefined && {
          startDate: payload.startDate,
        }),
        ...(payload.endDate !== undefined && { endDate: payload.endDate }),
        ...(publish ? { status: 'ACTIVE' as const } : {}),
      },
    )
    if (result.count === 0) {
      targetGone = true
    } else {
      campaignId = action.targetCampaignId
    }
  } else {
    const deleted = await campaignService.deleteCampaign(
      userId,
      action.targetCampaignId!,
    )
    if (!deleted) targetGone = true
  }

  if (targetGone) {
    await prisma.pendingAiAction.update({
      where: { id },
      data: { status: 'EXPIRED' },
    })
    await notificationService.resolveNotificationsForAction(id)
    return { outcome: 'targetGone' }
  }

  if (campaignId) {
    await notificationService.updateNotificationLinkForAction(
      id,
      `/campaign/${campaignId}`,
    )
  }
  await notificationService.resolveNotificationsForAction(id)

  return { outcome: 'confirmed', campaignId }
}

type CancelResult =
  | { outcome: 'notFound' }
  | { outcome: 'invalidState'; status: string }
  | { outcome: 'canceled' }

export async function cancelPendingAction(
  userId: string,
  id: string,
): Promise<CancelResult> {
  const action = await prisma.pendingAiAction.findFirst({
    where: { id, userId },
  })
  if (!action) return { outcome: 'notFound' }

  const claim = await prisma.pendingAiAction.updateMany({
    where: { id, userId, status: 'PENDING' },
    data: { status: 'CANCELED', resolvedAt: new Date() },
  })
  if (claim.count === 0) {
    const current = await prisma.pendingAiAction.findFirst({
      where: { id, userId },
    })
    return { outcome: 'invalidState', status: current?.status ?? 'UNKNOWN' }
  }

  await notificationService.resolveNotificationsForAction(id)
  return { outcome: 'canceled' }
}
