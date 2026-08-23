import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_BASE_URL: z
    .string()
    .url()
    .default('https://generativelanguage.googleapis.com/v1beta/openai/'),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_BASE_URL: z.string().url().default('https://api.groq.com/openai/v1'),
  // Research model for the Distiller -> Compound -> Formatter caption
  // pipeline (see lib/compound.ts). Unlike the pinned cascade CHAIN in
  // lib/openai.ts, this is env-overridable: Compound isn't cooldown-tracked
  // per-id the way cascade tiers are, so an alias/version bump here carries
  // none of that tracking risk.
  GROQ_COMPOUND_MODEL: z.string().min(1).default('groq/compound'),
  COMPOUND_CACHE_DEFAULT_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(21_600),
  COMPOUND_CACHE_WEATHER_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(3_600),
  // Outer safety bound for the recommendation-ai cache (lib/recommendation-cache.ts).
  // The cache key is a fingerprint of the caller's campaign data, so it already
  // invalidates on any real change — this TTL just bounds staleness/memory.
  RECOMMENDATION_CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(21_600),
  AUTH_JWT_SECRET: z.string().min(32),
  AI_MEMORY_ENCRYPTION_KEY: z.string().min(32),
  MAX_FOLLOWUP_QUESTIONS: z.coerce.number().int().positive().default(5),
  // Live-AI-call test budget guard (lib/ai-live-test-guard.ts) — bounds how
  // many real provider calls an opt-in live test run may make, so a bug that
  // turns one intended call into a retry storm can't eat a whole day's quota.
  MAX_LIVE_CALLS_PER_RUN: z.coerce.number().int().positive().default(5),
  MAX_LIVE_COMPOUND_CALLS_PER_RUN: z.coerce
    .number()
    .int()
    .positive()
    .default(2),
})

export const env = EnvSchema.parse(process.env)
export type Env = z.infer<typeof EnvSchema>
