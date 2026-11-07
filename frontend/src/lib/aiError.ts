// User-facing Thai copy for a failed AI request, keyed by HTTP status. 0 means
// the request never got a usable response: the network failed, or the body
// wasn't JSON (e.g. nginx's 502 page while the backend is down), which makes
// the generated client's JSON.parse throw.
export function aiErrorMessage(status: number): string {
  if (status === 429)
    return 'ตอนนี้ AI มีผู้ใช้งานเยอะ กรุณาลองใหม่อีกครั้งในอีกสักครู่'
  if (status === 422)
    return 'ข้อความนี้ถูกบล็อกโดยระบบตรวจสอบความปลอดภัย กรุณาลองใหม่อีกครั้งค่ะ'
  if (status === 0)
    return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'
  return 'ระบบ AI ขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง'
}

// Onboarding's AI follow-up questions are optional, so a failure skips them
// rather than blocking signup — this tells the user that's what happened.
export const AI_FOLLOWUP_SKIPPED_MESSAGE =
  'AI ไม่พร้อมใช้งาน ข้ามคำถามเพิ่มเติมไปก่อนนะคะ'
