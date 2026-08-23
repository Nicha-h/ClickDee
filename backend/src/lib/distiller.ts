import { createHash } from 'node:crypto'
import { z } from 'zod'
import { createChatCompletion } from './openai.js'

export type DistillCaptionInput = {
  name?: string
  budget?: number
  caption: string
  businessContext?: string
}

export type DistilledCaptionRequest = {
  cacheKey: string
  researchQuery: string
  tags: string[]
}

const DistillResultSchema = z.object({
  researchQuery: z.string().min(1).max(300),
  tags: z.array(z.string().min(1).max(40)).max(10).default([]),
})

const SYSTEM_PROMPT = `Extract a normalized research query from a draft ad campaign, for a web-research step that runs BEFORE the final caption is written. Two requests about the same underlying topic (even if worded differently) must produce the same normalized query and tags, since this output is used as a cache key.

Reply with ONLY strict JSON, no markdown, no code fences, matching exactly this shape:
{"researchQuery": string, "tags": string[]}

Rules:
- "researchQuery" is a short, lowercase, canonical phrase describing what to research (topic, product category, location if mentioned, timeframe/season if mentioned) — strip filler words, brand voice, and tone. Do not include the exact caption text.
- "tags" is a small set of lowercase single-word or short-phrase labels describing the query's nature. Include "weather" if the request is weather- or season-sensitive (e.g. mentions rain, heat, a specific season, "today", "now"). Include other relevant labels like "trend", "holiday", "promotion" where they apply.
- Never invent facts (location, product, timeframe) that aren't implied by the input.`

function buildUserContent(input: DistillCaptionInput): string {
  const lines = [
    input.name ? `Campaign name: ${input.name}` : undefined,
    input.budget ? `Budget (THB): ${input.budget}` : undefined,
    `Draft caption: ${input.caption}`,
    input.businessContext ? input.businessContext : undefined,
  ].filter(Boolean)
  return lines.join('\n')
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

function computeCacheKey(researchQuery: string, tags: string[]): string {
  const normalizedTags = [...tags].map(normalize).sort().join(',')
  const normalizedQuery = normalize(researchQuery)
  return createHash('sha256')
    .update(`${normalizedQuery}|${normalizedTags}`)
    .digest('hex')
}

// Stage 0 of the caption research pipeline. Runs through the existing
// Gemini/Groq cascade (never Compound) — this is a small structured-
// extraction task, not something that needs a dedicated research model.
// Never throws: a failure here just means research gets skipped, it must
// not block caption staging.
export async function distillCaptionRequest(
  input: DistillCaptionInput,
): Promise<DistilledCaptionRequest | null> {
  let raw: string | null | undefined
  try {
    const completion = await createChatCompletion({
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserContent(input) },
      ],
    })
    raw = completion.choices[0]?.message?.content
  } catch (err) {
    console.error('[distiller] createChatCompletion failed:', err)
    return null
  }

  if (!raw) {
    console.error('[distiller] model returned empty content')
    return null
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    console.error(
      '[distiller] model returned non-JSON content:',
      raw.slice(0, 200),
    )
    return null
  }

  const parsed = DistillResultSchema.safeParse(json)
  if (!parsed.success) {
    console.error(
      '[distiller] model JSON failed schema validation:',
      parsed.error.message,
    )
    return null
  }

  const { researchQuery, tags } = parsed.data
  return {
    researchQuery,
    tags,
    cacheKey: computeCacheKey(researchQuery, tags),
  }
}
