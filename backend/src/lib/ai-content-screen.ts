import type { PendingActionPayload } from '../schemas/pending-ai-action.schema.js'

/**
 * Best-effort screen over AI-proposed content, run right before it's shown
 * to the user — a PendingAiAction on its confirm card, or a suggested
 * creative caption. This is NOT a blocker — the human-in-the-loop confirm
 * step (see pending-ai-action.service.ts) is already the real safety boundary
 * against a hijacked/prompt-injected model reply mutating anything, so this
 * only adds visible warnings to that review moment (same "surface, don't
 * silently alter" philosophy as Message.redacted for PII, see pii-filter.ts).
 *
 * Text fields (name, caption) are checked for content that's a plausible
 * injection payload even though it's syntactically valid: an embedded link
 * (ad copy has no working links outside dedicated CTA fields), markup,
 * phrasing that reads like leaked/injected instructions, or an ad claim
 * Meta's ad policies reject. Deliberately does NOT flag phone numbers/
 * addresses — unlike chat input, ad copy may legitimately carry real
 * business contact info. Structured fields (budget, dates) are sanity-checked
 * against the user's own stated budget and the calendar.
 */

export type TextWarningCode =
  'LINK' | 'INSTRUCTION_LIKE' | 'MARKUP' | 'PROHIBITED_CLAIM'

// No `g` flag: these are only ever used with .test(), and a shared
// module-level RegExp with `g` would carry lastIndex state across calls,
// silently alternating match results between successive invocations.
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/i

const INSTRUCTION_PHRASES_RE =
  /\b(ignore (?:all|the|any) (?:previous|prior|above) instructions?|disregard (?:the|all|any) (?:previous|prior|above)|system prompt|you are (?:now |actually )?an? (?:ai|language model|assistant)|new instructions?:|act as (?:if|an?)|do anything now)\b/i

const MARKUP_RE = /<\s*(script|iframe|img|a)\b/i

// A small, best-effort list of claims Meta's advertising policies reject
// (guaranteed outcomes, medical cures, extreme weight loss, get-rich-quick).
// Kept narrow on purpose: a plain "money-back guarantee" is fine. Thai has
// no word boundaries, so the Thai alternatives are unanchored.
const PROHIBITED_CLAIM_EN_RE =
  /\b(guaranteed? (?:results?|weight loss|income|returns?|profits?)|100% (?:effective|results?|guaranteed)|cures?|miracle cure|get rich quick)\b/i
const PROHIBITED_CLAIM_TH_RE =
  /รับประกันผล|รักษาหายขาด|หายขาด|ได้ผล\s*100\s*%|ลด(?:น้ำหนัก)?\s*\d+\s*(?:กิโล|กก)|รวยเร็ว|รวยทางลัด/

const TEXT_WARNING_MESSAGES: Record<TextWarningCode, string> = {
  LINK: 'contains a link — ad copy has no working links outside the dedicated CTA/URL fields; review before confirming.',
  INSTRUCTION_LIKE:
    'contains phrasing that reads like an injected instruction rather than ad copy; review before confirming.',
  MARKUP: 'contains HTML-like markup; review before confirming.',
  PROHIBITED_CLAIM:
    'contains a claim Meta ad policies typically reject (guaranteed results, cures, extreme weight loss, get-rich-quick); review before confirming.',
}

export function screenAiTextCodes(
  text: string | null | undefined,
): TextWarningCode[] {
  if (!text) return []

  const codes: TextWarningCode[] = []
  if (URL_RE.test(text)) codes.push('LINK')
  if (INSTRUCTION_PHRASES_RE.test(text)) codes.push('INSTRUCTION_LIKE')
  if (MARKUP_RE.test(text)) codes.push('MARKUP')
  if (PROHIBITED_CLAIM_EN_RE.test(text) || PROHIBITED_CLAIM_TH_RE.test(text))
    codes.push('PROHIBITED_CLAIM')
  return codes
}

export function screenAiText(
  text: string | null | undefined,
  field = 'Caption',
): string[] {
  return screenAiTextCodes(text).map(
    (code) => `${field} ${TEXT_WARNING_MESSAGES[code]}`,
  )
}

// Upper bound (THB/month) of each onboarding budget choice — ids from
// frontend/src/data/onboarding.ts. 'over100k' has no upper bound.
const BUDGET_BAND_MAX: Record<string, number> = {
  under5k: 5_000,
  '5k-20k': 20_000,
  '20k-100k': 100_000,
}

// Calendar date (YYYY-MM-DD) in Thailand, where ClickDee's users are.
function bangkokDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(
    d,
  )
}

export function screenProposedAction(
  type: 'CREATE' | 'UPDATE' | 'DELETE',
  payload: Partial<PendingActionPayload>,
  {
    userBudgetBand,
    now = new Date(),
  }: { userBudgetBand?: string | null; now?: Date } = {},
): string[] {
  if (type === 'DELETE') return []

  const warnings = [
    ...screenAiText(payload.name, 'Name'),
    ...screenAiText(payload.caption, 'Caption'),
  ]

  const bandMax = userBudgetBand ? BUDGET_BAND_MAX[userBudgetBand] : undefined
  if (payload.budget !== undefined && bandMax !== undefined) {
    if (payload.budget > bandMax) {
      warnings.push(
        `Budget (${payload.budget.toLocaleString('en-US')} THB) is higher than the monthly ad budget you gave during onboarding (up to ${bandMax.toLocaleString('en-US')} THB); review before confirming.`,
      )
    }
  }

  const start = payload.startDate?.slice(0, 10)
  const end = payload.endDate?.slice(0, 10)
  if (start && start < bangkokDate(now)) {
    warnings.push('Start date is in the past; review before confirming.')
  }
  if (start && end && end < start) {
    warnings.push(
      'End date is before the start date; review before confirming.',
    )
  }

  return warnings
}
