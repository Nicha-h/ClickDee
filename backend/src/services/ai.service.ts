import OpenAI from 'openai'
import { prisma } from '../db/client.js'
import {
  getOpenAiClient,
  AiRateLimitError,
  AiContentFilterError,
} from '../lib/openai.js'
import { env } from '../config/env.js'
import { CLICKDEE_PRODUCT_CONTEXT } from '../lib/product-context.js'
import { getAiMemoryQas } from './onboarding.service.js'
import type { MessageModel, UserModel } from '../generated/prisma/models.js'

const SYSTEM_PROMPT = `${CLICKDEE_PRODUCT_CONTEXT}

You are "น้อง ดี", a friendly Thai-language marketing assistant inside ClickDee. Reply in Thai. You may use light Markdown formatting (**bold**, bullet lists with "-") to make responses easy to scan — do not output JSON, tables, or code blocks.`

const HISTORY_LIMIT = 20

async function getOrCreateConversation(userId: string) {
  const existing = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  return existing ?? prisma.conversation.create({ data: { userId } })
}

function buildContextLine(user: UserModel | null): string | undefined {
  if (!user?.businessName) return undefined
  const fields: [string, string | null | undefined][] = [
    ['category', user.category],
    ['goal', user.goal],
    ['location', user.location],
    ['signatureProduct', user.signatureProduct],
    ['adExperience', user.adExperience],
    ['budget', user.budget],
  ]
  const parts = fields.filter(([, v]) => v).map(([k, v]) => `${k}=${v}`)
  if (user.platforms.length > 0) {
    parts.push(`platforms=${user.platforms.join(', ')}`)
  }
  return `Business context: name=${user.businessName}${parts.length ? ', ' + parts.join(', ') : ''}.`
}

function buildAiMemoryBlock(
  aiMemory: { question: string; answer: string }[],
): string | undefined {
  if (aiMemory.length === 0) return undefined
  const lines = aiMemory
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n')
  return `Onboarding notes (from the user's earlier AI follow-up answers):\n${lines}`
}

async function generateAssistantReply(
  user: UserModel | null,
  history: MessageModel[],
  aiMemory: { question: string; answer: string }[],
): Promise<string> {
  const client = getOpenAiClient()
  const contextLine = buildContextLine(user)
  const aiMemoryBlock = buildAiMemoryBlock(aiMemory)

  try {
    const completion = await client.chat.completions.create({
      model: env.AZURE_OPENAI_DEPLOYMENT!,
      messages: [
        {
          role: 'system',
          content: [SYSTEM_PROMPT, contextLine, aiMemoryBlock]
            .filter(Boolean)
            .join('\n'),
        },
        ...history.slice(-HISTORY_LIMIT).map((m) => ({
          role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
          content: m.content,
        })),
      ],
    })

    const choice = completion.choices[0]
    if (choice?.finish_reason === 'content_filter') {
      throw new AiContentFilterError('Response blocked by content filter')
    }
    return choice?.message?.content ?? ''
  } catch (err) {
    if (err instanceof AiContentFilterError) throw err
    if (err instanceof OpenAI.RateLimitError) {
      throw new AiRateLimitError(err.message)
    }
    if (
      err instanceof OpenAI.BadRequestError &&
      err.code === 'content_filter'
    ) {
      throw new AiContentFilterError(err.message)
    }
    throw err
  }
}

export async function getConversationMessages(userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  if (!conversation) return []
  return prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
  })
}

export async function sendMessage(userId: string, text: string) {
  const conversation = await getOrCreateConversation(userId)
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const userMessage = await prisma.message.create({
    data: { conversationId: conversation.id, role: 'USER', content: text },
  })

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
  })

  const aiMemory = await getAiMemoryQas(userId)
  const assistantText = await generateAssistantReply(user, history, aiMemory)

  const assistantMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'ASSISTANT',
      content: assistantText,
    },
  })

  return { userMessage, assistantMessage }
}
