/**
 * Best-effort screen over an AI-proposed campaign caption, run right before
 * a PendingAiAction is shown to the user for confirmation. This is NOT a
 * blocker — the human-in-the-loop confirm step (see pending-ai-action.service.ts)
 * is already the real safety boundary against a hijacked/prompt-injected
 * model reply mutating anything, so this only adds visible warnings to that
 * review moment (same "surface, don't silently alter" philosophy as
 * Message.redacted for PII, see pii-filter.ts) for content that's a plausible
 * injection payload even though it's syntactically a valid caption string:
 * an embedded link (ad copy has no working links outside dedicated CTA
 * fields), or phrasing that reads like leaked/injected instructions rather
 * than ad copy. Deliberately does NOT flag phone numbers/addresses — unlike
 * chat input, a caption may legitimately carry real business contact info.
 */

export type CaptionWarningCode = 'LINK' | 'INSTRUCTION_LIKE' | 'MARKUP'

// No `g` flag: these are only ever used with .test(), and a shared
// module-level RegExp with `g` would carry lastIndex state across calls,
// silently alternating match results between successive invocations.
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/i

const INSTRUCTION_PHRASES_RE =
  /\b(ignore (?:all|the|any) (?:previous|prior|above) instructions?|disregard (?:the|all|any) (?:previous|prior|above)|system prompt|you are (?:now |actually )?an? (?:ai|language model|assistant)|new instructions?:|act as (?:if|an?)|do anything now)\b/i

const MARKUP_RE = /<\s*(script|iframe|img|a)\b/i

const WARNING_MESSAGES: Record<CaptionWarningCode, string> = {
  LINK: 'Caption contains a link — ad copy has no working links outside the dedicated CTA/URL fields; review before confirming.',
  INSTRUCTION_LIKE:
    'Caption contains phrasing that reads like an injected instruction rather than ad copy; review before confirming.',
  MARKUP: 'Caption contains HTML-like markup; review before confirming.',
}

export function screenCaptionContent(
  caption: string | null | undefined,
): CaptionWarningCode[] {
  if (!caption) return []

  const codes: CaptionWarningCode[] = []
  if (URL_RE.test(caption)) codes.push('LINK')
  if (INSTRUCTION_PHRASES_RE.test(caption)) codes.push('INSTRUCTION_LIKE')
  if (MARKUP_RE.test(caption)) codes.push('MARKUP')
  return codes
}

export function captionWarningMessages(codes: CaptionWarningCode[]): string[] {
  return codes.map((code) => WARNING_MESSAGES[code])
}
