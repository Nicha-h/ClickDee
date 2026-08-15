import { z } from 'zod'
import OpenAI from 'openai'
import {
  getOpenAiClient,
  AiNotConfiguredError,
  AiRateLimitError,
} from '../lib/openai.js'
import { env } from '../config/env.js'

export const MAX_FOLLOWUP_QUESTIONS = 5

export type BusinessProfile = {
  businessName?: string
  category?: string
  goal?: string
  signatureProduct?: string
  location?: string
}

export type FollowupQa = { question: string; answer: string }

export type FollowupResult = { done: boolean; question: string | null }

const FollowupResultSchema = z.object({
  done: z.boolean(),
  question: z.string().nullable(),
})

const SYSTEM_PROMPT = `You are helping onboard a small business owner onto ClickDee, a Thai ad-campaign management tool. Based on their business profile and any previous answers, decide whether you have enough information to help tailor their ad campaigns, or whether one more short clarifying question (in Thai) would meaningfully help.

Reply with ONLY strict JSON, no markdown, no code fences, matching exactly this shape:
{"done": boolean, "question": string | null}

Rules:
- If you need one more piece of information, set "done" to false and "question" to a single short, specific Thai-language question (not a summary, not multiple questions).
- If you already have enough information, or the previous answers already cover the business well, set "done" to true and "question" to null.
- Never repeat a question that was already asked.`

function buildUserContent(
  businessProfile: BusinessProfile,
  previousAnswers: FollowupQa[],
) {
  const profileLines = Object.entries(businessProfile)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  const historyLines = previousAnswers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n')
  return [
    'Business profile:',
    profileLines || '(none provided)',
    '',
    'Previous follow-up Q&A:',
    historyLines || '(none yet)',
  ].join('\n')
}

export async function generateFollowupQuestion(
  businessProfile: BusinessProfile,
  previousAnswers: FollowupQa[],
): Promise<FollowupResult> {
  if (previousAnswers.length >= MAX_FOLLOWUP_QUESTIONS) {
    return { done: true, question: null }
  }

  try {
    const client = getOpenAiClient()
    const completion = await client.chat.completions.create({
      model: env.AZURE_OPENAI_DEPLOYMENT!,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildUserContent(businessProfile, previousAnswers),
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) return { done: true, question: null }

    const parsed = FollowupResultSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return { done: true, question: null }
    return parsed.data
  } catch (err) {
    if (err instanceof AiNotConfiguredError) throw err
    if (err instanceof OpenAI.RateLimitError) {
      throw new AiRateLimitError(err.message)
    }
    // Any other failure (bad JSON, content filter, transient API error) fails
    // safe rather than leaving the onboarding flow stuck.
    return { done: true, question: null }
  }
}
