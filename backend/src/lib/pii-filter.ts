/**
 * Best-effort regex-based redaction of sensitive personal data from free-text
 * chat input, applied before persistence and before the text is sent to the
 * (third-party) AI model. This is NOT NER-grade PII detection —
 * known weak spots are bare real names not preceded by a phrase like "my name
 * is"/"ชื่อ...คือ", and address formats outside the patterns below. Scope is
 * strictly the user's free-text chat prompt; this is never applied to an
 * AI-proposed campaign caption, which may legitimately include a real
 * business phone number or address for advertising purposes.
 */

const PLACEHOLDER = {
  EMAIL: '[REDACTED_EMAIL]',
  PHONE: '[REDACTED_PHONE]',
  IP: '[REDACTED_IP]',
  CARD: '[REDACTED_CARD]',
  BANK_ACCOUNT: '[REDACTED_BANK_ACCOUNT]',
  ADDRESS: '[REDACTED_ADDRESS]',
  NAME: '[REDACTED_NAME]',
} as const

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
const IPV6_RE = /\b(?:[a-fA-F0-9]{1,4}:){2,7}[a-fA-F0-9]{1,4}\b/g
// Thai mobile numbers (0[689]X-XXX-XXXX, 3-3-4 digit groups) with optional
// separators.
const PHONE_RE = /\b0[689]\d[-\s]?\d{3}[-\s]?\d{4}\b/g
const CARD_CANDIDATE_RE = /\b(?:\d[ -]?){13,19}\b/g
const BANK_ACCOUNT_RE = /\b\d{10,15}\b/g
const THAI_ADDRESS_RE =
  /(?:ถนน|ซอย|หมู่บ้าน|ตำบล|อำเภอ|แขวง|เขต|จังหวัด)\s?[\wก-๙.\-/]+/g
const STREET_ADDRESS_RE =
  /\b\d{1,5}\s+\w+(?:\s\w+){0,3}\s(?:Street|St\.|Avenue|Ave\.|Road|Rd\.|Lane|Ln\.)\b/gi
const NAME_PATTERN_RE =
  /(?:my name is|ชื่อ(?:ของฉัน|ผม|ดิฉัน)?คือ?)\s+[^\s,.!?]+(?:\s+[^\s,.!?]+)?/gi

function luhnCheck(digits: string): boolean {
  let sum = 0
  let shouldDouble = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i])
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

export interface RedactPiiResult {
  text: string
  wasRedacted: boolean
}

export function redactPii(input: string): RedactPiiResult {
  let out = input

  out = out.replace(EMAIL_RE, PLACEHOLDER.EMAIL)
  out = out.replace(IPV4_RE, PLACEHOLDER.IP)
  out = out.replace(IPV6_RE, PLACEHOLDER.IP)
  out = out.replace(CARD_CANDIDATE_RE, (m) =>
    luhnCheck(m.replace(/[ -]/g, '')) ? PLACEHOLDER.CARD : m,
  )
  out = out.replace(PHONE_RE, PLACEHOLDER.PHONE)
  out = out.replace(BANK_ACCOUNT_RE, PLACEHOLDER.BANK_ACCOUNT)
  out = out.replace(THAI_ADDRESS_RE, PLACEHOLDER.ADDRESS)
  out = out.replace(STREET_ADDRESS_RE, PLACEHOLDER.ADDRESS)
  out = out.replace(NAME_PATTERN_RE, PLACEHOLDER.NAME)

  return { text: out, wasRedacted: out !== input }
}
