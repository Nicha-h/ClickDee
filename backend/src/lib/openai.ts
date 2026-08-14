import OpenAI from 'openai'
import { env } from '../config/env.js'

export class AiNotConfiguredError extends Error {}
export class AiRateLimitError extends Error {}
export class AiContentFilterError extends Error {}

let cachedClient: OpenAI | undefined

export function getOpenAiClient(): OpenAI {
  if (
    !env.AZURE_OPENAI_ENDPOINT ||
    !env.AZURE_OPENAI_KEY ||
    !env.AZURE_OPENAI_DEPLOYMENT
  ) {
    throw new AiNotConfiguredError('Azure OpenAI is not configured')
  }
  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: env.AZURE_OPENAI_KEY,
      baseURL: env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ''),
      maxRetries: 2,
      timeout: 30_000,
    })
  }
  return cachedClient
}
