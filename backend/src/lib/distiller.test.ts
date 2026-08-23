import { describe, expect, it, vi, beforeEach } from 'vitest'

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }))
vi.mock('./openai.js', () => ({ createChatCompletion: createMock }))

import { distillCaptionRequest } from './distiller.js'

function completionWith(content: string | null) {
  return { choices: [{ message: { content } }] }
}

beforeEach(() => {
  createMock.mockReset()
})

describe('distillCaptionRequest', () => {
  it('returns a normalized researchQuery, tags, and a deterministic cacheKey', async () => {
    createMock.mockResolvedValueOnce(
      completionWith(
        JSON.stringify({
          researchQuery: 'coffee shop rainy season promo',
          tags: ['Weather', 'Promotion'],
        }),
      ),
    )

    const result = await distillCaptionRequest({ caption: 'ลดหน้าฝน!' })

    expect(result).not.toBeNull()
    expect(result?.researchQuery).toBe('coffee shop rainy season promo')
    expect(result?.tags).toEqual(['Weather', 'Promotion'])
    expect(result?.cacheKey).toMatch(/^[a-f0-9]{64}$/)
  })

  it('produces the same cacheKey for two differently-worded equivalent inputs', async () => {
    createMock
      .mockResolvedValueOnce(
        completionWith(
          JSON.stringify({
            researchQuery: 'Coffee Shop Rainy Season Promo',
            tags: ['weather', 'promotion'],
          }),
        ),
      )
      .mockResolvedValueOnce(
        completionWith(
          JSON.stringify({
            researchQuery: 'coffee shop rainy season promo',
            tags: ['promotion', 'weather'],
          }),
        ),
      )

    const first = await distillCaptionRequest({
      caption: 'promo idea for my cafe',
    })
    const second = await distillCaptionRequest({
      caption: "it's raining a lot, need a promo",
    })

    expect(first?.cacheKey).toBe(second?.cacheKey)
  })

  it('returns null when the model returns empty content', async () => {
    createMock.mockResolvedValueOnce(completionWith(null))

    const result = await distillCaptionRequest({ caption: 'x' })

    expect(result).toBeNull()
  })

  it('returns null when the model returns non-JSON content', async () => {
    createMock.mockResolvedValueOnce(completionWith('not json'))

    const result = await distillCaptionRequest({ caption: 'x' })

    expect(result).toBeNull()
  })

  it('returns null when the JSON fails schema validation', async () => {
    createMock.mockResolvedValueOnce(
      completionWith(JSON.stringify({ researchQuery: '' })),
    )

    const result = await distillCaptionRequest({ caption: 'x' })

    expect(result).toBeNull()
  })

  it('returns null when createChatCompletion throws', async () => {
    createMock.mockImplementationOnce(() => {
      throw new Error('boom')
    })

    const result = await distillCaptionRequest({ caption: 'x' })

    expect(result).toBeNull()
  })
})
