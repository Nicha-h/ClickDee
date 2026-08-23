import { z } from 'zod'
import { createChatCompletion } from '../lib/openai.js'
import { researchForCaption } from '../lib/compound.js'
import { CLICKDEE_PRODUCT_CONTEXT } from '../lib/product-context.js'
import type { CampaignModel } from '../generated/prisma/models.js'

export class CreativeGenerationError extends Error {}

const CreativeResultSchema = z.object({
  caption: z.string().min(1).max(2000),
})

const SYSTEM_PROMPT = `${CLICKDEE_PRODUCT_CONTEXT}

You are writing a single new ad caption/creative copy for an existing campaign on ClickDee, for a Thai SME owner. Reply in Thai.

Reply with ONLY strict JSON, no markdown, no code fences, matching exactly this shape:
{"caption": string}

Rules:
- The caption is ready-to-use short ad copy (a few sentences at most), grounded in the user's brief below and the campaign's existing context.
- If research findings are provided, incorporate anything genuinely useful (season/trend/local relevance) — never fabricate facts not present in the brief, campaign context, or findings.
- Never invent performance numbers, guarantees, or claims about the business you weren't told.`

function buildUserContent(
  campaign: Pick<CampaignModel, 'name' | 'caption'>,
  prompt: string,
  researchFindings: string | null,
): string {
  const lines = [
    `Campaign name: ${campaign.name}`,
    campaign.caption
      ? `Existing campaign caption: ${campaign.caption}`
      : undefined,
    `User's brief for this new creative: ${prompt}`,
    researchFindings ? `Research findings:\n${researchFindings}` : undefined,
  ].filter(Boolean)
  return lines.join('\n')
}

export async function generateCreativeCaption(
  campaign: Pick<CampaignModel, 'name' | 'caption' | 'budget'>,
  prompt: string,
): Promise<string> {
  const researchFindings = await researchForCaption({
    name: campaign.name,
    budget: Number(campaign.budget),
    caption: prompt,
  })

  const completion = await createChatCompletion({
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildUserContent(campaign, prompt, researchFindings),
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    throw new CreativeGenerationError('Model returned empty content')
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    throw new CreativeGenerationError('Model returned non-JSON content')
  }

  const parsed = CreativeResultSchema.safeParse(json)
  if (!parsed.success) {
    throw new CreativeGenerationError(
      `Model JSON failed schema validation: ${parsed.error.message}`,
    )
  }

  return parsed.data.caption
}
