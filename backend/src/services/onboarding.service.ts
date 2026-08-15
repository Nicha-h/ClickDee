import { prisma } from '../db/client.js'
import { encryptField, decryptField } from '../lib/encryption.js'

export type AiMemoryInput = { question: string; answer: string }

export async function saveAiMemory(userId: string, qas: AiMemoryInput[]) {
  if (qas.length === 0) return
  await prisma.$transaction([
    prisma.aiMemory.createMany({
      data: qas.map((qa) => ({
        userId,
        question: encryptField(qa.question),
        answer: encryptField(qa.answer),
      })),
    }),
    prisma.user.update({
      where: { id: userId },
      data: { aiMemoryConsentAt: new Date() },
    }),
  ])
}

export async function getAiMemoryQas(userId: string) {
  const rows = await prisma.aiMemory.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map((r) => ({
    question: decryptField(r.question),
    answer: decryptField(r.answer),
  }))
}

export async function getAiMemoryItems(userId: string) {
  const rows = await prisma.aiMemory.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map((r) => ({
    id: r.id,
    question: decryptField(r.question),
    answer: decryptField(r.answer),
    createdAt: r.createdAt,
  }))
}

export async function deleteAiMemoryItem(userId: string, id: string) {
  return prisma.aiMemory.deleteMany({ where: { id, userId } })
}

export async function clearAiMemory(userId: string) {
  return prisma.aiMemory.deleteMany({ where: { userId } })
}
