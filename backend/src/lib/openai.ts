import OpenAI, { RateLimitError } from 'openai'
import { env } from '../config/env.js'

export class AiNotConfiguredError extends Error {}
export class AiRateLimitError extends Error {}
export class AllTiersExhaustedError extends AiRateLimitError {}
export class AiContentFilterError extends Error {}

type Provider = 'gemini' | 'groq'

interface ChainEntry {
  provider: Provider
  model: string
}

// Pinned model ids only — no "-latest" aliases, since cooldowns are tracked
// per exact model id and an alias silently pointing elsewhere would break
// that tracking. Ordered by preference; the last Groq entry is a preview
// model and treated as the least stable tier.
const CHAIN: ChainEntry[] = [
  { provider: 'gemini', model: 'gemini-3.7-flash' },
  { provider: 'gemini', model: 'gemini-3.6-flash' },
  { provider: 'gemini', model: 'gemini-3.5-flash' },
  { provider: 'groq', model: 'openai/gpt-oss-20b' },
  { provider: 'groq', model: 'openai/gpt-oss-120b' },
  { provider: 'groq', model: 'qwen/qwen3.6-27b' },
]

const DEFAULT_COOLDOWN_MS = 60_000

// Sticky pointer into CHAIN, persisted across requests (module-level, not
// per-call) so a request doesn't immediately re-trigger the 429 a previous
// request just backed off from. Only promoted back to 0 once CHAIN[0]'s own
// cooldown has passed (see the recovery check in createChatCompletion).
let currentIndex = 0

// model id -> epoch ms until which that model is skipped.
const cooldownUntil = new Map<string, number>()

const clientCache = new Map<Provider, OpenAI>()

// Test-only: cascade state is a module-level singleton by design (see
// currentIndex above), so tests need a way to reset it between cases.
export function __resetCascadeStateForTests(): void {
  currentIndex = 0
  cooldownUntil.clear()
  clientCache.clear()
}

function isProviderConfigured(provider: Provider): boolean {
  return provider === 'gemini' ? !!env.GEMINI_API_KEY : !!env.GROQ_API_KEY
}

function getClientForProvider(provider: Provider): OpenAI {
  const cached = clientCache.get(provider)
  if (cached) return cached

  const apiKey = provider === 'gemini' ? env.GEMINI_API_KEY : env.GROQ_API_KEY
  const baseURL = provider === 'gemini' ? env.GEMINI_BASE_URL : env.GROQ_BASE_URL
  const client = new OpenAI({
    apiKey,
    baseURL: baseURL.replace(/\/+$/, ''),
    // Our own cascade is the retry strategy — the SDK's built-in retry on
    // 429/5xx would otherwise silently retry inside a single tier before
    // ever throwing to us, adding latency and undermining fast failover.
    maxRetries: 0,
    timeout: 30_000,
  })
  clientCache.set(provider, client)
  return client
}

function parseRetryAfterMs(err: RateLimitError): number {
  const raw = err.headers?.get('retry-after')
  if (!raw) return DEFAULT_COOLDOWN_MS

  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000

  const dateMs = Date.parse(raw)
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now())

  return DEFAULT_COOLDOWN_MS
}

type ChatParams = Omit<
  OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  'model'
>

// Walks CHAIN starting from currentIndex, skipping any model still in its
// cooldown window or whose provider isn't configured. On a 429, the model is
// put on cooldown and the walk continues to the next entry for this same
// request. Any other error (including a content-filter block, which surfaces
// as a normal 200 with finish_reason rather than an exception) is not a
// capacity problem, so it is not cascaded — it rethrows immediately.
export async function createChatCompletion(
  params: ChatParams,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  if (!isProviderConfigured('gemini') && !isProviderConfigured('groq')) {
    throw new AiNotConfiguredError('No AI provider is configured')
  }

  const now = Date.now()
  if (currentIndex > 0 && now >= (cooldownUntil.get(CHAIN[0].model) ?? 0)) {
    currentIndex = 0
  }

  let i = currentIndex
  for (let attempts = 0; attempts < CHAIN.length; attempts++) {
    const entry = CHAIN[i]
    const skip =
      !isProviderConfigured(entry.provider) ||
      Date.now() < (cooldownUntil.get(entry.model) ?? 0)

    if (!skip) {
      try {
        const client = getClientForProvider(entry.provider)
        const result = await client.chat.completions.create({
          ...params,
          model: entry.model,
        })
        currentIndex = i
        console.debug(`[ai] served by ${entry.provider}/${entry.model}`)
        return result
      } catch (err) {
        if (!(err instanceof RateLimitError)) throw err
        const cooldownMs = parseRetryAfterMs(err)
        cooldownUntil.set(entry.model, Date.now() + cooldownMs)
        console.debug(
          `[ai] ${entry.provider}/${entry.model} rate-limited, cooling down ${cooldownMs}ms`,
        )
      }
    }

    i = (i + 1) % CHAIN.length
  }

  throw new AllTiersExhaustedError('All AI provider tiers are rate-limited')
}
