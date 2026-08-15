import { describe, expect, it, vi } from 'vitest'

const { aiMemoryRows } = vi.hoisted(() => ({ aiMemoryRows: [] as unknown[] }))

vi.mock('../db/client.js', () => ({
  prisma: {
    aiMemory: {
      createMany: vi.fn((args: { data: unknown[] }) => {
        aiMemoryRows.push(...args.data)
        return Promise.resolve({ count: args.data.length })
      }),
      findMany: vi.fn(() => Promise.resolve(aiMemoryRows)),
    },
    user: {
      update: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}))

import { saveAiMemory, getAiMemoryQas } from './onboarding.service.js'

describe('onboarding.service AiMemory encryption', () => {
  it('stores question and answer as ciphertext, not plaintext', async () => {
    aiMemoryRows.length = 0
    await saveAiMemory('user-1', [
      { question: 'ลูกค้าหลักของคุณคือใคร?', answer: 'พนักงานออฟฟิศ' },
    ])
    const [row] = aiMemoryRows as { question: string; answer: string }[]
    expect(row.question).not.toBe('ลูกค้าหลักของคุณคือใคร?')
    expect(row.answer).not.toBe('พนักงานออฟฟิศ')
    expect(row.question.split(':')).toHaveLength(3)
    expect(row.answer.split(':')).toHaveLength(3)
  })

  it('round-trips through getAiMemoryQas back to the original plaintext', async () => {
    aiMemoryRows.length = 0
    await saveAiMemory('user-1', [
      { question: 'ลูกค้าหลักของคุณคือใคร?', answer: 'พนักงานออฟฟิศ' },
    ])
    const qas = await getAiMemoryQas('user-1')
    expect(qas).toEqual([
      { question: 'ลูกค้าหลักของคุณคือใคร?', answer: 'พนักงานออฟฟิศ' },
    ])
  })
})
