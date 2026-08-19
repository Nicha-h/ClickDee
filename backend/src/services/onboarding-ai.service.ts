import { z } from 'zod'
import OpenAI from 'openai'
import {
  getOpenAiClient,
  AiNotConfiguredError,
  AiRateLimitError,
} from '../lib/openai.js'
import { env } from '../config/env.js'
import { CLICKDEE_PRODUCT_CONTEXT } from '../lib/product-context.js'

export type BusinessProfile = {
  businessName?: string
  category?: string
  goal?: string
  signatureProduct?: string
  location?: string
  adExperience?: string
  budget?: string
  platforms?: string[]
}

export type FollowupQa = { question: string; answer: string }

export type FollowupResult = {
  done: boolean
  question: string | null
  type: 'text' | 'choice'
  choices: string[] | null
}

const FollowupResultSchema = z
  .object({
    done: z.boolean(),
    question: z.string().nullable(),
    type: z.enum(['text', 'choice']).default('text'),
    choices: z
      .array(z.string().min(1).max(100))
      .min(2)
      .max(6)
      .nullable()
      .optional(),
  })
  .transform((v) => ({ ...v, choices: v.choices ?? null }))
  .refine((v) => v.type !== 'choice' || v.choices !== null, {
    message: 'choices must have 2-6 items when type is "choice"',
    path: ['choices'],
  })
  .refine((v) => v.type !== 'text' || v.choices === null, {
    message: 'choices must be omitted when type is "text"',
    path: ['choices'],
  })

const DONE_RESULT: FollowupResult = {
  done: true,
  question: null,
  type: 'text',
  choices: null,
}

const SYSTEM_PROMPT = `${CLICKDEE_PRODUCT_CONTEXT}

You are running a data-collection period for a small business owner who is new to ClickDee. This is not a one-time onboarding form — treat it as a short discovery conversation where both you and the owner get to know their business better before any campaign work starts. Based on their business profile and any previous answers, decide whether you have enough information to help tailor their ad campaigns, or whether one more short clarifying question (in Thai) would meaningfully help.
Your job is not just to fill gaps in the profile — it's to help the owner see their own business more accurately. Many small business owners hold assumptions about their business that don't match reality: they may believe their customers are mostly Gen Z when the real buyers skew Gen Y/millennial, assume walk-in traffic when most orders are actually delivery, or think they're competing on price when customers actually return for something else entirely. Favor questions that surface concrete, observable facts over abstract preferences — e.g. who actually buys from them today and keeps coming back, what those customers ask for or say, when/how they usually buy, what made their last few customers choose them — rather than a question that just restates a field already in the business profile. A good question can gently reveal a mismatch between what the owner assumes and what's actually true, so ClickDee ends up targeting the real customer, not the imagined one.
Think of each question as building one more piece of a shared picture of the business — one that the owner didn't necessarily have written down before either. Where it fits naturally, a question can also give the owner a small useful realization about their own business, not just extract data for ClickDee's use.

Reply with ONLY strict JSON, no markdown, no code fences, matching exactly this shape:
{"done": boolean, "question": string | null, "type": "text" | "choice", "choices": string[] | null}

Rules:
- If you need one more piece of information, set "done" to false and "question" to a single short, specific Thai-language question (not a summary, not multiple questions).
- Set "type" to "choice" and "choices" to 2-6 short Thai option strings when the answer naturally fits a small fixed set (e.g. yes/no, how often, which of a few categories) — this is easier for the owner to answer than typing. Otherwise set "type" to "text" and leave "choices" as null.
- Prefer questions that clarify who the business's real customers are (age range/generation, habits, what draws them back) over questions that just restate business profile fields.
- If the most recent answer is vague, uncertain, or a non-answer (e.g. "ไม่ทราบ", "ไม่แน่ใจ", "ไม่รู้", "unsure", "idk"), do NOT treat that as sufficient information to finish. Set "done" to false and ask a different, more concrete and easier-to-answer question — narrow the scope or offer a concrete example, or turn it into a "choice" question — rather than repeating the same abstract question or ending the flow.
- The user message lists every question already asked under "Questions already asked" — never repeat one of those, and never ask something that means the same thing in different words.
- Since this is a discovery period rather than a form to rush through, don't set "done" to true just because the minimum profile fields are technically filled — set it to true once you and the owner have actually built a clear, concrete picture of who really buys from them and why, or once further questions would stop adding new information.`

function buildUserContent(
  businessProfile: BusinessProfile,
  previousAnswers: FollowupQa[],
  extraNote?: string,
) {
  const profileLines = Object.entries(businessProfile)
    .filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n')
  const askedQuestions = previousAnswers
    .map((qa, i) => `${i + 1}. ${qa.question}`)
    .join('\n')
  const historyLines = previousAnswers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n')
  return [
    'Business profile:',
    profileLines || '(none provided)',
    '',
    'Questions already asked — never repeat or ask something with the same meaning as any of these:',
    askedQuestions || '(none yet)',
    '',
    'Full conversation so far:',
    historyLines || '(none yet)',
    ...(extraNote ? ['', extraNote] : []),
  ].join('\n')
}

// Character-bigram Jaccard similarity — works without word segmentation,
// which matters here since Thai text doesn't reliably space-delimit words
// (a whitespace word-overlap check would barely catch anything).
function charBigrams(text: string): Set<string> {
  const cleaned = text
    .toLowerCase()
    .replace(/[\s?？!！.,，。()"'“”‘’:：;；]/g, '')
  const grams = new Set<string>()
  for (let i = 0; i < cleaned.length - 1; i++) {
    grams.add(cleaned.slice(i, i + 2))
  }
  return grams
}

const REPEAT_SIMILARITY_THRESHOLD = 0.5

function isLikelyRepeat(
  question: string,
  previousAnswers: FollowupQa[],
): boolean {
  const candidate = charBigrams(question)
  if (candidate.size === 0) return false
  return previousAnswers.some(({ question: asked }) => {
    const askedGrams = charBigrams(asked)
    if (askedGrams.size === 0) return false
    let intersection = 0
    for (const gram of candidate) {
      if (askedGrams.has(gram)) intersection++
    }
    const union = candidate.size + askedGrams.size - intersection
    return intersection / union >= REPEAT_SIMILARITY_THRESHOLD
  })
}

async function tryGenerate(
  client: ReturnType<typeof getOpenAiClient>,
  businessProfile: BusinessProfile,
  previousAnswers: FollowupQa[],
  extraNote?: string,
): Promise<FollowupResult | null> {
  const completion = await client.chat.completions.create({
    model: env.AZURE_OPENAI_DEPLOYMENT!,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildUserContent(businessProfile, previousAnswers, extraNote),
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    console.error('[onboarding-ai] model returned empty content')
    return null
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    console.error(
      '[onboarding-ai] model returned non-JSON content:',
      raw.slice(0, 200),
    )
    return null
  }

  const parsed = FollowupResultSchema.safeParse(json)
  if (!parsed.success) {
    console.error(
      '[onboarding-ai] model JSON failed schema validation:',
      parsed.error.message,
    )
    return null
  }
  return parsed.data
}

export async function generateFollowupQuestion(
  businessProfile: BusinessProfile,
  previousAnswers: FollowupQa[],
): Promise<FollowupResult> {
  if (previousAnswers.length >= env.MAX_FOLLOWUP_QUESTIONS) {
    return DONE_RESULT
  }

  try {
    const client = getOpenAiClient()

    let result = await tryGenerate(client, businessProfile, previousAnswers)
    if (!result) {
      result = await tryGenerate(
        client,
        businessProfile,
        previousAnswers,
        'Your previous reply could not be parsed. Reply with ONLY valid JSON matching the exact shape described above — no markdown, no extra text.',
      )
    }
    if (!result) {
      console.error(
        '[onboarding-ai] giving up after retry: no valid response from the model',
      )
      return DONE_RESULT
    }

    if (
      !result.done &&
      result.question &&
      isLikelyRepeat(result.question, previousAnswers)
    ) {
      const retried = await tryGenerate(
        client,
        businessProfile,
        previousAnswers,
        `Your candidate question "${result.question}" repeats or closely paraphrases a question that was already asked. Ask a different, more specific question instead.`,
      )
      if (retried) {
        result = retried
      } else {
        console.error(
          '[onboarding-ai] retry-on-repeat produced no valid response; keeping the original (possibly repeated) question',
        )
      }
    }

    return result
  } catch (err) {
    if (err instanceof AiNotConfiguredError) throw err
    if (err instanceof OpenAI.RateLimitError) {
      throw new AiRateLimitError(err.message)
    }
    // Any other failure (bad JSON, content filter, transient API error) fails
    // safe rather than leaving the onboarding flow stuck.
    console.error(
      '[onboarding-ai] falling back to done:true after an unexpected error:',
      err,
    )
    return DONE_RESULT
  }
}
