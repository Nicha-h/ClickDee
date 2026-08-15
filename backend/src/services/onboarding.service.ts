import { prisma } from '../db/client.js'
import { encryptField } from '../lib/encryption.js'

export type AiMemoryInput = { question: string; answer: string }

export async function saveAiMemory(userId: string, qas: AiMemoryInput[]) {
  if (qas.length === 0) return
  await prisma.$transaction([
    prisma.aiMemory.createMany({
      data: qas.map((qa) => ({
        userId,
        question: qa.question,
        answer: encryptField(qa.answer),
      })),
    }),
    prisma.user.update({
      where: { id: userId },
      data: { aiMemoryConsentAt: new Date() },
    }),
  ])
}
