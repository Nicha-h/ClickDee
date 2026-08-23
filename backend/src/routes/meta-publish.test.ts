import { describe, expect, it, vi } from 'vitest'
import {
  MetaTokenExpiredError,
  MetaRateLimitError,
  MetaInvalidParameterError,
  MetaPolicyViolationError,
} from '../lib/meta-client.js'
import { MetaNotConfiguredError } from '../config/meta.js'

vi.mock('../services/meta-publish.service.js', () => ({
  publishCampaignToMeta: vi.fn(),
  setMetaStatus: vi.fn(),
}))

import { app } from '../app.js'
import * as metaPublishService from '../services/meta-publish.service.js'
import { signSessionToken } from '../lib/auth.js'

const authHeader = async (userId: string) => ({
  Cookie: `session=${await signSessionToken(userId)}`,
})
const csrfHeader = { 'X-Requested-With': 'XMLHttpRequest' }

async function publish() {
  return app.request('/api/campaigns/campaign-1/publish-to-meta', {
    method: 'POST',
    headers: { ...csrfHeader, ...(await authHeader('user-1')) },
  })
}

describe('POST /api/campaigns/:id/publish-to-meta error mapping', () => {
  it('maps MetaTokenExpiredError (code 190) to 401 with a reauth flag', async () => {
    vi.mocked(metaPublishService.publishCampaignToMeta).mockRejectedValueOnce(
      new MetaTokenExpiredError({ message: 'expired', code: 190 }, 401),
    )
    const res = await publish()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.reauth).toBe(true)
  })

  it('maps MetaRateLimitError (code 17) to 429', async () => {
    vi.mocked(metaPublishService.publishCampaignToMeta).mockRejectedValueOnce(
      new MetaRateLimitError({ message: 'rate limited', code: 17 }, 400),
    )
    const res = await publish()
    expect(res.status).toBe(429)
  })

  it('maps MetaInvalidParameterError (code 100) to 400 with the SME-facing message', async () => {
    vi.mocked(metaPublishService.publishCampaignToMeta).mockRejectedValueOnce(
      new MetaInvalidParameterError(
        {
          message: 'bad param',
          code: 100,
          error_user_msg: 'Please pick a valid objective.',
        },
        400,
      ),
    )
    const res = await publish()
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toBe('Please pick a valid objective.')
  })

  it('maps MetaPolicyViolationError (code 2635) to 422 "needs revision"', async () => {
    vi.mocked(metaPublishService.publishCampaignToMeta).mockRejectedValueOnce(
      new MetaPolicyViolationError(
        { message: 'policy violation', code: 2635 },
        400,
      ),
    )
    const res = await publish()
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.message).toMatch(/rejected/i)
  })

  it('maps MetaNotConfiguredError to 400', async () => {
    vi.mocked(metaPublishService.publishCampaignToMeta).mockRejectedValueOnce(
      new MetaNotConfiguredError(),
    )
    const res = await publish()
    expect(res.status).toBe(400)
  })

  it('returns 404 when the campaign is not found', async () => {
    vi.mocked(metaPublishService.publishCampaignToMeta).mockResolvedValueOnce(
      null,
    )
    const res = await publish()
    expect(res.status).toBe(404)
  })

  it('returns 200 with the publish summary on success', async () => {
    vi.mocked(metaPublishService.publishCampaignToMeta).mockResolvedValueOnce({
      campaignId: 'campaign-1',
      metaCampaignId: 'meta-1',
      metaStatus: 'PAUSED',
      metaEffectiveStatus: 'PAUSED',
      adSets: [],
      ads: [],
    })
    const res = await publish()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.metaStatus).toBe('PAUSED')
  })
})
