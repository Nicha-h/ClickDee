import { env } from '../config/env.js'
import { getGroqClient } from './openai.js'
import { distillCaptionRequest, type DistillCaptionInput } from './distiller.js'
import { getCachedResearch, setCachedResearch } from './compound-cache.js'

const RESEARCH_SYSTEM_PROMPT = `You are a research assistant for a Thai SME marketing platform. Given a topic, research current trends, relevant weather if applicable, and any other timely context useful for writing an ad caption. Be concise. Cite sources where possible.`

function ttlMsFor(tags: string[]): number {
  const seconds = tags.includes('weather')
    ? env.COMPOUND_CACHE_WEATHER_TTL_SECONDS
    : env.COMPOUND_CACHE_DEFAULT_TTL_SECONDS
  return seconds * 1000
}

// Stage 1 + orchestration for the caption research pipeline: Distiller ->
// cache -> Compound. Never throws — a failure anywhere in this pipeline
// means research is skipped, not that caption staging fails.
export async function researchForCaption(
  input: DistillCaptionInput,
): Promise<string | null> {
  if (!env.GROQ_API_KEY) return null

  const distilled = await distillCaptionRequest(input)
  if (!distilled) return null

  const cached = getCachedResearch(distilled.cacheKey)
  if (cached !== undefined) {
    console.debug('[compound] cache hit, skipping Compound call')
    return cached
  }

  try {
    const client = getGroqClient()
    const completion = await client.chat.completions.create({
      model: env.GROQ_COMPOUND_MODEL,
      messages: [
        { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
        { role: 'user', content: distilled.researchQuery },
      ],
    })
    const findings = completion.choices[0]?.message?.content
    if (!findings) {
      console.error('[compound] model returned empty content')
      return null
    }

    setCachedResearch(distilled.cacheKey, findings, ttlMsFor(distilled.tags))
    console.debug('[compound] served fresh research, cached')
    return findings
  } catch (err) {
    console.error('[compound] research call failed:', err)
    return null
  }
}
