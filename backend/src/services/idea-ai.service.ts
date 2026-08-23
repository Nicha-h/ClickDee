import { z } from 'zod'
import { createChatCompletion } from '../lib/openai.js'
import { CLICKDEE_PRODUCT_CONTEXT } from '../lib/product-context.js'
import { buildContextLine } from '../lib/user-context.js'
import type { CampaignModel, UserModel } from '../generated/prisma/models.js'

const IdeaAiResultSchema = z.object({
  ideas: z.array(z.string().min(1).max(160)).min(1).max(3),
})

const EMPTY_RESULT: { ideas: string[] } = { ideas: [] }

const CAMPAIGN_IDEA_SYSTEM_PROMPT = `${CLICKDEE_PRODUCT_CONTEXT}

You are suggesting quick-start campaign brief ideas for a Thai SME owner who is about to describe a new ad campaign to ClickDee's AI assistant in their own words. Each idea is a short, ready-to-use example brief (the kind of thing the user could click to pre-fill a prompt textarea, then edit or submit as-is) — NOT a recommendation card, NOT advice, just a plausible starting brief for THIS business.

Ground every idea in the business context provided below (category, product, location, budget, goal, ad experience). Never invent specifics about the business you weren't told (no fake locations, products, or numbers beyond what's given) — keep ideas generic enough to be safe when a detail is missing, but flavor them with whatever context is present.

Reply with ONLY strict JSON, no markdown, no code fences, matching exactly this shape:
{"ideas": [string, ...]}

Rules:
- Produce 2 to 3 short Thai campaign brief examples, each one sentence, in the same style as: "เพิ่มลูกค้าใหม่ในรัศมี 3 กม. งบ 200 บาท/วัน" — a goal + rough budget/scope, written as if the business owner is describing what they want.
- Each idea must be a different angle (e.g. new customer acquisition, a specific product/menu push, a time-of-day or seasonal promo).`

const CREATIVE_IDEA_SYSTEM_PROMPT = `${CLICKDEE_PRODUCT_CONTEXT}

You are suggesting quick-start creative brief ideas for a Thai SME owner who is about to describe what kind of new ad creative (image + caption) they want for an EXISTING campaign on ClickDee. Each idea is a short, ready-to-use example brief (the kind of thing the user could click to pre-fill a prompt textarea, then edit or submit as-is) — NOT a recommendation, just a plausible starting brief for THIS specific campaign and business.

Ground every idea in the campaign (name, existing caption if any) and business context provided below. Never invent specifics you weren't told.

Reply with ONLY strict JSON, no markdown, no code fences, matching exactly this shape:
{"ideas": [string, ...]}

Rules:
- Produce 2 to 3 short Thai creative brief examples, each one sentence, in the same style as: "โปรโมทส่วนลด 20% เน้นความคุ้มค่า สไตล์สดใส" — a creative angle/style direction for the ad image + caption.
- Each idea must be a different angle (e.g. discount/value framing, new-menu highlight, urgency/limited-time framing).`

async function tryGenerate(
  systemPrompt: string,
  userContent: string,
  extraNote?: string,
): Promise<string[] | null> {
  const completion = await createChatCompletion({
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [userContent, ...(extraNote ? ['', extraNote] : [])].join(
          '\n',
        ),
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    console.error('[idea-ai] model returned empty content')
    return null
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    console.error(
      '[idea-ai] model returned non-JSON content:',
      raw.slice(0, 200),
    )
    return null
  }

  const parsed = IdeaAiResultSchema.safeParse(json)
  if (!parsed.success) {
    console.error(
      '[idea-ai] model JSON failed schema validation:',
      parsed.error.message,
    )
    return null
  }
  return parsed.data.ideas
}

async function generate(
  systemPrompt: string,
  userContent: string | null,
): Promise<{ ideas: string[] }> {
  if (!userContent) return EMPTY_RESULT

  try {
    let result = await tryGenerate(systemPrompt, userContent)
    if (!result) {
      result = await tryGenerate(
        systemPrompt,
        userContent,
        'Your previous reply could not be parsed. Reply with ONLY valid JSON matching the exact shape described above.',
      )
    }
    if (!result) {
      console.error(
        '[idea-ai] giving up after retry: no valid response from the model',
      )
      return EMPTY_RESULT
    }
    return { ideas: result }
  } catch (err) {
    // Quick-start ideas are supplementary, read-only prompt-entry content,
    // not a blocking flow — fail soft into an empty result (logged) rather
    // than propagating an error, mirroring recommendation-ai.service.ts.
    console.error(
      '[idea-ai] falling back to empty ideas after an unexpected error:',
      err,
    )
    return EMPTY_RESULT
  }
}

export async function generateCampaignIdeas(
  user: UserModel | null,
): Promise<{ ideas: string[] }> {
  const contextLine = buildContextLine(user)
  return generate(CAMPAIGN_IDEA_SYSTEM_PROMPT, contextLine ?? null)
}

export async function generateCreativeIdeas(
  campaign: Pick<CampaignModel, 'name' | 'caption'>,
  user: UserModel | null,
): Promise<{ ideas: string[] }> {
  const contextLine = buildContextLine(user)
  const lines = [
    `Campaign name: ${campaign.name}`,
    campaign.caption
      ? `Existing campaign caption: ${campaign.caption}`
      : '(no caption set yet)',
    ...(contextLine ? [contextLine] : []),
  ]
  return generate(CREATIVE_IDEA_SYSTEM_PROMPT, lines.join('\n'))
}
