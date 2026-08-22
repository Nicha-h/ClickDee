import { z } from 'zod'
import { createChatCompletion } from '../lib/openai.js'
import { CLICKDEE_PRODUCT_CONTEXT } from '../lib/product-context.js'
import type { CampaignModel } from '../generated/prisma/models.js'

export type RecommendationItem = {
  campaignId: string
  title: string
  description: string
  actionLabel: string
}

const RecommendationItemSchema = z.object({
  campaignId: z.string().min(1),
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(200),
  actionLabel: z.string().min(1).max(30),
})

const RecommendationAiResultSchema = z.object({
  recommendations: z.array(RecommendationItemSchema).min(1).max(3),
})

const EMPTY_RESULT: { recommendations: RecommendationItem[] } = {
  recommendations: [],
}

// Cap prompt size/cost; listCampaigns already orders by createdAt desc, so
// this naturally favors the user's most recently touched campaigns.
const MAX_CAMPAIGNS_IN_PROMPT = 10

const SYSTEM_PROMPT = `${CLICKDEE_PRODUCT_CONTEXT}

You are generating short, actionable suggestions for a small business owner about their own ad campaigns inside ClickDee, based ONLY on the campaign data provided below (name, caption, status, budget, start/end dates, and how many days old/until-end each campaign is).

Hard constraint: the campaign data you're given does NOT include any performance metrics — no reach, impressions, clicks, CTR, conversions, ROAS, or orders. Meta Ads API integration for reporting is not available yet. You must NEVER invent, imply, or reference any such performance number (e.g. never say things like "ROI is high" or "reach increased") — reason strictly from schedule, budget amount, status, and caption presence/absence.

Good recommendation angles: a campaign's end date is coming up soon (consider extending or reviewing it); a campaign has been in DRAFT status for a while (ready to publish?); a campaign has no caption set (consider adding a promotional message); a campaign just started and has no end date (consider setting one); a PAUSED campaign has been idle for a while (resume or archive?). Keep tone encouraging and concrete, in Thai.

Reply with ONLY strict JSON, no markdown, no code fences, matching exactly this shape:
{"recommendations": [{"campaignId": string, "title": string, "description": string, "actionLabel": string}, ...]}

Rules:
- Produce 1 to 3 recommendations, each about a DIFFERENT campaign id from the list below — never invent a campaignId that isn't in the list.
- "title" is a short Thai headline (like a card title, under ~10 Thai words).
- "description" is one short Thai sentence explaining the suggestion and, if relevant, a concrete next step.
- "actionLabel" is a short Thai button label (2-4 words), e.g. "ดูแคมเปญ", "ตั้งงบใหม่", "เพิ่มแคปชัน".
- Prefer the most time-sensitive or highest-impact suggestion first.`

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
  validIds: Set<string>,
  extraNote?: string,
): Promise<RecommendationItem[] | null> {
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
    console.error('[recommendation-ai] model returned empty content')
    return null
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    console.error(
      '[recommendation-ai] model returned non-JSON content:',
      raw.slice(0, 200),
    )
    return null
  }

  const parsed = RecommendationAiResultSchema.safeParse(json)
  if (!parsed.success) {
    console.error(
      '[recommendation-ai] model JSON failed schema validation:',
      parsed.error.message,
    )
    return null
  }

  // Drop any hallucinated campaignId not in the caller's own list, rather
  // than trusting the model's output verbatim.
  const filtered = parsed.data.recommendations.filter((r) =>
    validIds.has(r.campaignId),
  )
  if (filtered.length === 0) {
    console.error(
      '[recommendation-ai] all recommendations referenced unknown campaign ids',
    )
    return null
  }
  return filtered
}

export async function generateRecommendations(
  campaigns: CampaignModel[],
): Promise<{ recommendations: RecommendationItem[] }> {
  if (campaigns.length === 0) return EMPTY_RESULT

  const validIds = new Set(campaigns.map((c) => c.id))

  try {
    let result = await tryGenerate(campaigns, validIds)
    if (!result) {
      result = await tryGenerate(
        campaigns,
        validIds,
        'Your previous reply could not be parsed, or referenced an unknown campaignId. Reply with ONLY valid JSON matching the exact shape described above, using only the campaignId values listed.',
      )
    }
    if (!result) {
      console.error(
        '[recommendation-ai] giving up after retry: no valid response from the model',
      )
      return EMPTY_RESULT
    }
    return { recommendations: result }
  } catch (err) {
    // Recommendations are supplementary, read-only home-page content, not a
    // blocking flow — unlike onboarding-ai, config/rate-limit failures here
    // fail soft into an empty result (logged) rather than propagating as an
    // error the route has to surface, since there's no "action" being
    // blocked and no existing home-page error-toast UI to route it to.
    console.error(
      '[recommendation-ai] falling back to empty recommendations after an unexpected error:',
      err,
    )
    return EMPTY_RESULT
  }
}
