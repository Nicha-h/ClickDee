import { z } from 'zod'
import { createChatCompletion } from '../lib/openai.js'
import { CLICKDEE_PRODUCT_CONTEXT } from '../lib/product-context.js'
import type { CampaignModel } from '../generated/prisma/models.js'

const InsightAiResultSchema = z.object({
  insights: z.array(z.string().min(1).max(200)).min(1).max(3),
})

const EMPTY_RESULT: { insights: string[] } = { insights: [] }

// Cap prompt size/cost; listCampaigns already orders by createdAt desc, so
// this naturally favors the user's most recently touched campaigns.
const MAX_CAMPAIGNS_IN_PROMPT = 10

const SYSTEM_PROMPT = `${CLICKDEE_PRODUCT_CONTEXT}

You are writing a short factual/observational summary for a small business owner about their own ad campaign(s) inside ClickDee, based ONLY on the campaign data provided below (name, caption, status, budget, start/end dates, and how many days old/until-end each campaign is).

Hard constraint: the campaign data you're given does NOT include any performance metrics — no reach, impressions, clicks, CTR, conversions, ROAS, or orders. Meta Ads API integration for reporting is not available yet. You must NEVER invent, imply, or reference any such performance number (e.g. never say things like "ROI is high" or "reach increased") — reason strictly from schedule, budget amount, status, and caption presence/absence.

Good observation angles: how the budget is allocated across active campaigns; a campaign's end date coming up soon; a campaign that's been in DRAFT status for a while; a campaign with no caption set; a PAUSED campaign that's been idle for a while; how many campaigns are currently active vs draft/paused/ended. Keep tone informative and factual (not a call to action), in Thai, written as a female persona — use "ค่ะ" as the sentence-ending particle where it reads naturally, and "ฉัน" if you refer to yourself.

Reply with ONLY strict JSON, no markdown, no code fences, matching exactly this shape:
{"insights": [string, ...]}

Rules:
- Produce 1 to 3 short Thai sentences, each a standalone observation (like a bullet point in a summary card).
- Never fabricate a fact not present in the data below.
- Prefer the most notable or time-sensitive observation first.`

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000)
}

function buildUserContent(campaigns: CampaignModel[]): string {
  const now = new Date()
  const lines = campaigns.slice(0, MAX_CAMPAIGNS_IN_PROMPT).map((c) => {
    const daysSinceCreated = daysBetween(now, c.createdAt)
    const daysUntilEnd = c.endDate ? daysBetween(c.endDate, now) : null
    return [
      `- campaignId: ${c.id}`,
      `  name: ${c.name}`,
      `  status: ${c.status}`,
      `  budget: ฿${c.budget.toString()}`,
      `  caption: ${c.caption ? `"${c.caption}"` : '(no caption set)'}`,
      `  createdAt: ${c.createdAt.toISOString().slice(0, 10)} (${daysSinceCreated} days ago)`,
      `  startDate: ${c.startDate.toISOString().slice(0, 10)}`,
      `  endDate: ${
        c.endDate
          ? `${c.endDate.toISOString().slice(0, 10)} (${daysUntilEnd} days from now)`
          : '(none set)'
      }`,
    ].join('\n')
  })
  return ['Campaigns:', ...lines].join('\n')
}

async function tryGenerate(
  campaigns: CampaignModel[],
  extraNote?: string,
): Promise<string[] | null> {
  const completion = await createChatCompletion({
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          buildUserContent(campaigns),
          ...(extraNote ? ['', extraNote] : []),
        ].join('\n'),
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    console.error('[insight-ai] model returned empty content')
    return null
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    console.error(
      '[insight-ai] model returned non-JSON content:',
      raw.slice(0, 200),
    )
    return null
  }

  const parsed = InsightAiResultSchema.safeParse(json)
  if (!parsed.success) {
    console.error(
      '[insight-ai] model JSON failed schema validation:',
      parsed.error.message,
    )
    return null
  }
  return parsed.data.insights
}

export async function generateInsights(
  campaigns: CampaignModel[],
): Promise<{ insights: string[] }> {
  if (campaigns.length === 0) return EMPTY_RESULT

  try {
    let result = await tryGenerate(campaigns)
    if (!result) {
      result = await tryGenerate(
        campaigns,
        'Your previous reply could not be parsed. Reply with ONLY valid JSON matching the exact shape described above.',
      )
    }
    if (!result) {
      console.error(
        '[insight-ai] giving up after retry: no valid response from the model',
      )
      return EMPTY_RESULT
    }
    return { insights: result }
  } catch (err) {
    // Insights are supplementary, read-only report content, not a blocking
    // flow — fail soft into an empty result (logged) rather than propagating
    // an error, mirroring recommendation-ai.service.ts.
    console.error(
      '[insight-ai] falling back to empty insights after an unexpected error:',
      err,
    )
    return EMPTY_RESULT
  }
}
