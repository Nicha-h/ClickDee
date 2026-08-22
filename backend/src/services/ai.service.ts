import { z } from 'zod'
import OpenAI from 'openai'
import { prisma } from '../db/client.js'
import {
  createChatCompletion,
  AiRateLimitError,
  AiContentFilterError,
} from '../lib/openai.js'
import { CLICKDEE_PRODUCT_CONTEXT } from '../lib/product-context.js'
import { getAiMemoryQas } from './onboarding.service.js'
import * as campaignService from './campaign.service.js'
import * as pendingActionService from './pending-ai-action.service.js'
import * as notificationService from './notification.service.js'
import { redactPii } from '../lib/pii-filter.js'
import type { MessageModel, UserModel } from '../generated/prisma/models.js'
import type { PendingAiActionModel } from '../generated/prisma/models.js'

const SYSTEM_PROMPT = `${CLICKDEE_PRODUCT_CONTEXT}

You are "น้อง ดี", an experienced digital marketing strategist and business advisor working inside ClickDee for Thai micro and small SME owners. You are not a scheduling clerk — think like a marketing consultant who happens to also be able to execute. Reply in Thai. You may use Markdown formatting — **bold**, bullet lists with "-", headings, links, and GFM tables for structured data like budget breakdowns — to make responses easy to scan. Do not output raw JSON or code blocks.

# Your expertise
You understand Thai SME marketing realities: LINE OA, Facebook/Instagram ads, TikTok, seasonal spending patterns (Songkran, year-end, 11.11/12.12, Thai New Year promotions), typical SME budget constraints, and basic performance literacy (CTR, CPC, CPM, ROAS, reach vs. conversion objectives). Use this knowledge to advise, not just to execute requests literally.

# How to advise, not just execute
Before proposing a campaign, think like a consultant:
- If the user's goal is vague ("อยากขายของเยอะขึ้น"), ask what's actually being sold, to whom, and what's worked or failed before — don't guess and don't invent facts about their business you weren't told.
- If a stated budget looks mismatched to the stated objective or timeframe (e.g. too small to gather meaningful data, or a multi-week schedule with a same-day budget), say so plainly and explain why, then suggest an adjustment — the user decides, but they should decide informed.
- When proposing a caption or angle, briefly state the reasoning (hook, target audience, call-to-action) in one or two sentences — not just the caption text alone.
- If the user pushes back or a plan clearly missed the mark, say so directly rather than agreeing by default. Don't inflate results, guarantee outcomes, or invent metrics/benchmarks you don't actually have — if you don't have real performance data for their account, say that instead of fabricating a number.
- Keep advice grounded in what the user has told you or in generally accepted marketing practice — flag clearly when something is a rule of thumb rather than data specific to their business.

# Campaign staging tools
You can propose creating, updating, or deleting a campaign using the stage_create_campaign / stage_update_campaign / stage_delete_campaign tools. These tools NEVER take effect immediately — they only stage a proposal that the user must explicitly confirm with a button in the chat UI. After calling one, your reply must clearly state in plain Thai exactly what you are proposing to do:
- For create/update: the campaign name, budget in Thai Baht, schedule (start/end date), and the exact caption you plan to use — plus a short line on the reasoning behind those choices.
- For delete: which campaign, by name.
Always tell the user that, by default, a new campaign will be saved as a draft unless they explicitly choose to publish it when confirming. Never claim you have already created, updated, or deleted anything — only that you are proposing it and waiting for their confirmation. Only call a staging tool once you actually have the information needed (name, budget, start date, caption for a create); ask for anything missing instead of inventing values.

# Format
Most replies should be a single message. If you genuinely have more than one distinct point to make (e.g. a short acknowledgment, then a data table, then a follow-up question) and splitting them into separate chat bubbles would be clearer, put a line containing exactly [[NEXT]] and nothing else between each part. Don't overuse this.`

const HISTORY_LIMIT = 20

const STAGE_CREATE_CAMPAIGN_TOOL: OpenAI.Chat.Completions.ChatCompletionFunctionTool =
  {
    type: 'function',
    function: {
      name: 'stage_create_campaign',
      description:
        'Proposes creating a new advertising campaign. Does NOT create it — only stages it for the user to review and explicitly confirm in the chat UI. Call this once you have a name, budget (THB), start date, and a caption you plan to use.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'A short campaign name.' },
          budget: {
            type: 'number',
            description: 'Total budget in Thai Baht (a positive number).',
          },
          startDate: {
            type: 'string',
            description: 'Start date, e.g. "2026-09-01".',
          },
          endDate: {
            type: 'string',
            description: 'Optional end date, e.g. "2026-09-30".',
          },
          caption: {
            type: 'string',
            description: 'The ad caption/copy you plan to use.',
          },
        },
        required: ['name', 'budget', 'startDate', 'caption'],
        additionalProperties: false,
      },
    },
  }

const STAGE_UPDATE_CAMPAIGN_TOOL: OpenAI.Chat.Completions.ChatCompletionFunctionTool =
  {
    type: 'function',
    function: {
      name: 'stage_update_campaign',
      description:
        'Proposes changes to an existing campaign the user owns. Does NOT apply them — only stages for confirmation. Only include fields that are actually changing. Never propose changing status/publishing — that is always the human confirmer\'s choice.',
      parameters: {
        type: 'object',
        properties: {
          campaignId: { type: 'string' },
          name: { type: 'string' },
          budget: { type: 'number' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          caption: { type: 'string' },
        },
        required: ['campaignId'],
        additionalProperties: false,
      },
    },
  }

const STAGE_DELETE_CAMPAIGN_TOOL: OpenAI.Chat.Completions.ChatCompletionFunctionTool =
  {
    type: 'function',
    function: {
      name: 'stage_delete_campaign',
      description:
        'Proposes deleting an existing campaign the user owns. Does NOT delete it — only stages for confirmation.',
      parameters: {
        type: 'object',
        properties: {
          campaignId: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['campaignId'],
        additionalProperties: false,
      },
    },
  }

const ALL_TOOLS = [
  STAGE_CREATE_CAMPAIGN_TOOL,
  STAGE_UPDATE_CAMPAIGN_TOOL,
  STAGE_DELETE_CAMPAIGN_TOOL,
]

const StageCreateCampaignArgsSchema = z.object({
  name: z.string().min(1).max(200),
  budget: z.number().positive(),
  startDate: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), 'startDate is not a valid date'),
  endDate: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), 'endDate is not a valid date')
    .optional(),
  caption: z.string().min(1).max(2000),
})

const StageUpdateCampaignArgsSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  budget: z.number().positive().optional(),
  startDate: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), 'startDate is not a valid date')
    .optional(),
  endDate: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), 'endDate is not a valid date')
    .optional(),
  caption: z.string().max(2000).optional(),
})

const StageDeleteCampaignArgsSchema = z.object({
  campaignId: z.string().min(1),
  reason: z.string().max(500).optional(),
})

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

function splitIntoBubbles(text: string): string[] {
  const bubbles = text
    .split(/^\[\[NEXT\]\]$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  return bubbles.length > 0 ? bubbles : ['']
}

interface ToolCallResult {
  resultText: string
  pendingAction?: PendingAiActionModel
}

async function executeToolCall(
  userId: string,
  conversationId: string,
  call: OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall,
): Promise<ToolCallResult> {
  const name = call.function.name

  let args: unknown
  try {
    args = JSON.parse(call.function.arguments)
  } catch {
    return {
      resultText: JSON.stringify({
        error: 'Could not parse tool arguments as JSON',
      }),
    }
  }

  try {
    if (name === 'stage_create_campaign') {
      const parsed = StageCreateCampaignArgsSchema.safeParse(args)
      if (!parsed.success) {
        return { resultText: JSON.stringify({ error: parsed.error.message }) }
      }
      const action = await pendingActionService.stagePendingAction(
        userId,
        conversationId,
        'CREATE',
        { ...parsed.data, proposedStatus: 'DRAFT' },
        null,
      )
      return {
        resultText: JSON.stringify({
          staged: true,
          pendingActionId: action.id,
          note: 'Action staged only — not executed. Tell the user what you are about to do (including the caption and schedule) and ask them to confirm; remind them the default is Save as Draft unless they explicitly say Publish.',
        }),
        pendingAction: action,
      }
    }

    if (name === 'stage_update_campaign' || name === 'stage_delete_campaign') {
      const schema =
        name === 'stage_update_campaign'
          ? StageUpdateCampaignArgsSchema
          : StageDeleteCampaignArgsSchema
      const parsed = schema.safeParse(args)
      if (!parsed.success) {
        return { resultText: JSON.stringify({ error: parsed.error.message }) }
      }

      const campaign = await campaignService.getCampaignById(
        userId,
        parsed.data.campaignId,
      )
      if (!campaign) {
        return {
          resultText: JSON.stringify({
            error: 'Campaign not found or not owned by this user.',
          }),
        }
      }

      const type = name === 'stage_update_campaign' ? 'UPDATE' : 'DELETE'
      const payload: Record<string, unknown> = { ...parsed.data }
      delete payload.campaignId
      const action = await pendingActionService.stagePendingAction(
        userId,
        conversationId,
        type,
        { ...payload, proposedStatus: 'DRAFT' },
        parsed.data.campaignId,
      )
      return {
        resultText: JSON.stringify({
          staged: true,
          pendingActionId: action.id,
          campaignName: campaign.name,
          note: 'Action staged only — not executed. Ask the user to confirm in the chat UI before anything changes.',
        }),
        pendingAction: action,
      }
    }

    return { resultText: JSON.stringify({ error: `Unknown tool: ${name}` }) }
  } catch (err) {
    if (err instanceof pendingActionService.TooManyPendingActionsError) {
      return {
        resultText: JSON.stringify({
          error:
            'Too many actions are already awaiting the user\'s confirmation. Ask them to confirm or cancel one first.',
        }),
      }
    }
    console.error('[ai-chat] tool staging failed:', (err as Error)?.name)
    return {
      resultText: JSON.stringify({
        error: 'Failed to stage the action, please try again.',
      }),
    }
  }
}

interface AssistantReply {
  bubbles: string[]
  pendingAction: PendingAiActionModel | null
}

async function generateAssistantReply(
  userId: string,
  conversationId: string,
  user: UserModel | null,
  history: MessageModel[],
  aiMemory: { question: string; answer: string }[],
): Promise<AssistantReply> {
  const contextLine = buildContextLine(user)
  const aiMemoryBlock = buildAiMemoryBlock(aiMemory)
  const dateLine = `Today's date is ${new Date().toISOString().slice(0, 10)}.`

  const baseMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: [SYSTEM_PROMPT, contextLine, aiMemoryBlock, dateLine]
        .filter(Boolean)
        .join('\n'),
    },
    ...history.slice(-HISTORY_LIMIT).map((m) => ({
      role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
  ]

  try {
    const first = await createChatCompletion({
      messages: baseMessages,
      tools: ALL_TOOLS,
      tool_choice: 'auto',
    })

    const choice = first.choices[0]
    if (choice?.finish_reason === 'content_filter') {
      throw new AiContentFilterError('Response blocked by content filter')
    }

    const toolCalls = (choice?.message?.tool_calls ?? []).filter(
      (c): c is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall =>
        c.type === 'function',
    )

    let finalText: string
    let pendingAction: PendingAiActionModel | null = null

    if (toolCalls.length > 0) {
      const toolResultMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        []
      for (const call of toolCalls) {
        const result = await executeToolCall(userId, conversationId, call)
        if (result.pendingAction) {
          pendingAction = result.pendingAction
        }
        toolResultMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: result.resultText,
        })
      }

      const assistantToolCallMessage: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam =
        {
          role: 'assistant',
          content: choice?.message?.content ?? null,
          tool_calls: toolCalls,
        }

      const second = await createChatCompletion({
        messages: [
          ...baseMessages,
          assistantToolCallMessage,
          ...toolResultMessages,
        ],
      })
      const secondChoice = second.choices[0]
      if (secondChoice?.finish_reason === 'content_filter') {
        throw new AiContentFilterError('Response blocked by content filter')
      }
      finalText = secondChoice?.message?.content ?? ''
    } else {
      finalText = choice?.message?.content ?? ''
    }

    return { bubbles: splitIntoBubbles(finalText), pendingAction }
  } catch (err) {
    if (err instanceof AiContentFilterError) throw err
    if (err instanceof AiRateLimitError) throw err
    if (
      err instanceof OpenAI.BadRequestError &&
      err.code === 'content_filter'
    ) {
      throw new AiContentFilterError(err.message)
    }
    throw err
  }
}

function notificationTextFor(action: PendingAiActionModel): string {
  const payload = action.payload as { name?: string }
  const name = payload?.name ?? 'แคมเปญ'
  if (action.type === 'CREATE') {
    return `AI กำลังรอการยืนยันเพื่อสร้างแคมเปญ "${name}"`
  }
  if (action.type === 'UPDATE') {
    return `AI กำลังรอการยืนยันเพื่อแก้ไขแคมเปญ`
  }
  return `AI กำลังรอการยืนยันเพื่อลบแคมเปญ`
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
    include: { pendingAction: true },
  })
}

export async function sendMessage(userId: string, rawText: string) {
  const { text, wasRedacted } = redactPii(rawText)
  const conversation = await getOrCreateConversation(userId)
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'USER',
      content: text,
      redacted: wasRedacted,
    },
  })

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
  })

  const aiMemory = await getAiMemoryQas(userId)
  const { bubbles: bubbleTexts, pendingAction } = await generateAssistantReply(
    userId,
    conversation.id,
    user,
    history,
    aiMemory,
  )

  // Sequential, not Promise.all — createdAt ordering must be deterministic
  // since GET /api/ai/messages sorts by it, and concurrent creates could tie.
  const assistantMessages: (MessageModel & {
    pendingAction: PendingAiActionModel | null
  })[] = []
  for (let i = 0; i < bubbleTexts.length; i++) {
    const isLast = i === bubbleTexts.length - 1
    assistantMessages.push(
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: bubbleTexts[i],
          pendingActionId: isLast && pendingAction ? pendingAction.id : null,
        },
        include: { pendingAction: true },
      }),
    )
  }

  if (pendingAction) {
    await notificationService.createNotification(userId, {
      type: 'AI_TASK',
      text: notificationTextFor(pendingAction),
      link:
        pendingAction.type === 'CREATE'
          ? null
          : `/campaign/${pendingAction.targetCampaignId}`,
      pendingActionId: pendingAction.id,
    })
  }

  return {
    userMessage: { ...userMessage, pendingAction: null as PendingAiActionModel | null },
    assistantMessages,
  }
}
