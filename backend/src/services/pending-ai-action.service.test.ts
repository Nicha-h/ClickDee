import { describe, expect, it, vi, beforeEach } from 'vitest'

const {
  findFirstMock,
  updateManyMock,
  updateMock,
  createMock,
  countMock,
} = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  updateManyMock: vi.fn(),
  updateMock: vi.fn(),
  createMock: vi.fn(),
  countMock: vi.fn(),
}))
vi.mock('../db/client.js', () => ({
  prisma: {
    pendingAiAction: {
      findFirst: findFirstMock,
      updateMany: updateManyMock,
      update: updateMock,
      create: createMock,
      count: countMock,
    },
  },
}))

const {
  createCampaignMock,
  updateCampaignMock,
  deleteCampaignMock,
} = vi.hoisted(() => ({
  createCampaignMock: vi.fn(),
  updateCampaignMock: vi.fn(),
  deleteCampaignMock: vi.fn(),
}))
vi.mock('./campaign.service.js', () => ({
  createCampaign: createCampaignMock,
  updateCampaign: updateCampaignMock,
  deleteCampaign: deleteCampaignMock,
}))

const {
  resolveNotificationsForActionMock,
  updateNotificationLinkForActionMock,
} = vi.hoisted(() => ({
  resolveNotificationsForActionMock: vi.fn(),
  updateNotificationLinkForActionMock: vi.fn(),
}))
vi.mock('./notification.service.js', () => ({
  resolveNotificationsForAction: resolveNotificationsForActionMock,
  updateNotificationLinkForAction: updateNotificationLinkForActionMock,
}))

import {
  stagePendingAction,
  confirmPendingAction,
  cancelPendingAction,
  TooManyPendingActionsError,
} from './pending-ai-action.service.js'

function pendingAction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'action-1',
    userId: 'user-1',
    conversationId: 'conv-1',
    type: 'CREATE',
    targetCampaignId: null,
    payload: { name: 'Launch', budget: 1000, startDate: '2026-09-01', caption: 'Hi' },
    status: 'PENDING',
    createdAt: new Date(),
    resolvedAt: null,
    ...overrides,
  }
}

beforeEach(() => {
  findFirstMock.mockReset()
  updateManyMock.mockReset().mockResolvedValue({ count: 1 })
  updateMock.mockReset()
  createMock.mockReset()
  countMock.mockReset().mockResolvedValue(0)
  createCampaignMock.mockReset()
  updateCampaignMock.mockReset()
  deleteCampaignMock.mockReset()
  resolveNotificationsForActionMock.mockReset()
  updateNotificationLinkForActionMock.mockReset()
})

describe('stagePendingAction', () => {
  it('creates a row when under the pending cap', async () => {
    countMock.mockResolvedValueOnce(2)
    createMock.mockResolvedValueOnce(pendingAction())

    await stagePendingAction('user-1', 'conv-1', 'CREATE', { name: 'x' })

    expect(createMock).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        conversationId: 'conv-1',
        type: 'CREATE',
        targetCampaignId: null,
        payload: { name: 'x' },
        status: 'PENDING',
      },
    })
  })

  it('throws TooManyPendingActionsError at the cap', async () => {
    countMock.mockResolvedValueOnce(5)
    await expect(
      stagePendingAction('user-1', 'conv-1', 'CREATE', { name: 'x' }),
    ).rejects.toBeInstanceOf(TooManyPendingActionsError)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('opportunistically expires stale rows before counting', async () => {
    countMock.mockResolvedValueOnce(0)
    createMock.mockResolvedValueOnce(pendingAction())
    await stagePendingAction('user-1', 'conv-1', 'CREATE', { name: 'x' })
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1', status: 'PENDING' }),
        data: { status: 'EXPIRED', resolvedAt: expect.any(Date) },
      }),
    )
  })
})

describe('confirmPendingAction', () => {
  it('returns notFound when the action does not exist for this user', async () => {
    findFirstMock.mockResolvedValueOnce(null)
    const result = await confirmPendingAction('user-1', 'action-1', false)
    expect(result).toEqual({ outcome: 'notFound' })
  })

  it('expires and returns invalidState when the action is past its TTL', async () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000)
    findFirstMock.mockResolvedValueOnce(pendingAction({ createdAt: old }))
    const result = await confirmPendingAction('user-1', 'action-1', false)
    expect(result).toEqual({ outcome: 'invalidState', status: 'EXPIRED' })
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'action-1' },
      data: { status: 'EXPIRED', resolvedAt: expect.any(Date) },
    })
  })

  it('returns invalidState when the row could not be atomically claimed', async () => {
    findFirstMock
      .mockResolvedValueOnce(pendingAction())
      .mockResolvedValueOnce(pendingAction({ status: 'CANCELED' }))
    updateManyMock.mockResolvedValueOnce({ count: 0 })
    const result = await confirmPendingAction('user-1', 'action-1', false)
    expect(result).toEqual({ outcome: 'invalidState', status: 'CANCELED' })
    expect(createCampaignMock).not.toHaveBeenCalled()
  })

  it('CREATE + publish=false creates a DRAFT campaign', async () => {
    findFirstMock.mockResolvedValueOnce(pendingAction())
    createCampaignMock.mockResolvedValueOnce({ id: 'campaign-1' })
    const result = await confirmPendingAction('user-1', 'action-1', false)
    expect(createCampaignMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ status: 'DRAFT' }),
    )
    expect(result).toEqual({ outcome: 'confirmed', campaignId: 'campaign-1' })
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'action-1' },
      data: { targetCampaignId: 'campaign-1' },
    })
    expect(updateNotificationLinkForActionMock).toHaveBeenCalledWith(
      'action-1',
      '/campaign/campaign-1',
    )
    expect(resolveNotificationsForActionMock).toHaveBeenCalledWith('action-1')
  })

  it('CREATE + publish=true creates an ACTIVE campaign', async () => {
    findFirstMock.mockResolvedValueOnce(pendingAction())
    createCampaignMock.mockResolvedValueOnce({ id: 'campaign-1' })
    await confirmPendingAction('user-1', 'action-1', true)
    expect(createCampaignMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ status: 'ACTIVE' }),
    )
  })

  it('UPDATE returns targetGone and expires the action when the campaign no longer exists', async () => {
    findFirstMock.mockResolvedValueOnce(
      pendingAction({
        type: 'UPDATE',
        targetCampaignId: 'campaign-1',
        payload: { budget: 2000 },
      }),
    )
    updateCampaignMock.mockResolvedValueOnce({ count: 0 })
    const result = await confirmPendingAction('user-1', 'action-1', false)
    expect(result).toEqual({ outcome: 'targetGone' })
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'action-1' },
      data: { status: 'EXPIRED' },
    })
  })

  it('DELETE confirms and deletes the campaign', async () => {
    findFirstMock.mockResolvedValueOnce(
      pendingAction({
        type: 'DELETE',
        targetCampaignId: 'campaign-1',
        payload: {},
      }),
    )
    deleteCampaignMock.mockResolvedValueOnce(true)
    const result = await confirmPendingAction('user-1', 'action-1', false)
    expect(deleteCampaignMock).toHaveBeenCalledWith('user-1', 'campaign-1')
    expect(result).toEqual({ outcome: 'confirmed', campaignId: null })
  })
})

describe('cancelPendingAction', () => {
  it('returns notFound when the action does not exist for this user', async () => {
    findFirstMock.mockResolvedValueOnce(null)
    const result = await cancelPendingAction('user-1', 'action-1')
    expect(result).toEqual({ outcome: 'notFound' })
  })

  it('cancels a pending action', async () => {
    findFirstMock.mockResolvedValueOnce(pendingAction())
    const result = await cancelPendingAction('user-1', 'action-1')
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: 'action-1', userId: 'user-1', status: 'PENDING' },
      data: { status: 'CANCELED', resolvedAt: expect.any(Date) },
    })
    expect(result).toEqual({ outcome: 'canceled' })
    expect(resolveNotificationsForActionMock).toHaveBeenCalledWith('action-1')
  })

  it('returns invalidState on a double-cancel', async () => {
    findFirstMock
      .mockResolvedValueOnce(pendingAction())
      .mockResolvedValueOnce(pendingAction({ status: 'CANCELED' }))
    updateManyMock.mockResolvedValueOnce({ count: 0 })
    const result = await cancelPendingAction('user-1', 'action-1')
    expect(result).toEqual({ outcome: 'invalidState', status: 'CANCELED' })
  })
})
