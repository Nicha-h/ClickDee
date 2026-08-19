import { describe, expect, it } from 'vitest'
import { redactPii } from './pii-filter.js'

describe('redactPii', () => {
  it('redacts an email address', () => {
    const result = redactPii('ติดต่อ test.user@example.com ได้เลยค่ะ')
    expect(result.wasRedacted).toBe(true)
    expect(result.text).toContain('[REDACTED_EMAIL]')
    expect(result.text).not.toContain('test.user@example.com')
  })

  it('redacts a Thai mobile phone number', () => {
    const result = redactPii('โทรหาฉันที่ 081-234-5678 นะ')
    expect(result.wasRedacted).toBe(true)
    expect(result.text).toContain('[REDACTED_PHONE]')
  })

  it('redacts an IPv4 address', () => {
    const result = redactPii('server ip is 192.168.1.100')
    expect(result.wasRedacted).toBe(true)
    expect(result.text).toContain('[REDACTED_IP]')
  })

  it('redacts an IPv6 address', () => {
    const result = redactPii('ip: 2001:0db8:85a3:0000:0000:8a2e:0370:7334')
    expect(result.wasRedacted).toBe(true)
    expect(result.text).toContain('[REDACTED_IP]')
  })

  it('redacts a Luhn-valid credit card number', () => {
    const result = redactPii('card number 4532015112830366 please charge it')
    expect(result.wasRedacted).toBe(true)
    expect(result.text).toContain('[REDACTED_CARD]')
    expect(result.text).not.toContain('4532015112830366')
  })

  it('does NOT redact a Luhn-invalid digit string as a card', () => {
    const result = redactPii('reference number 1234567890123456')
    expect(result.text).not.toContain('[REDACTED_CARD]')
  })

  it('redacts a long bare digit run as a bank account fallback', () => {
    const result = redactPii('เลขบัญชี 1234567890123')
    expect(result.wasRedacted).toBe(true)
    expect(result.text).toMatch(/\[REDACTED_(BANK_ACCOUNT|CARD)\]/)
  })

  it('redacts a Thai address with a street/soi keyword', () => {
    const result = redactPii('บ้านอยู่ที่ ซอยสุขุมวิท71 กรุงเทพ')
    expect(result.wasRedacted).toBe(true)
    expect(result.text).toContain('[REDACTED_ADDRESS]')
  })

  it('redacts an English street address', () => {
    const result = redactPii('ship it to 123 Main Street please')
    expect(result.wasRedacted).toBe(true)
    expect(result.text).toContain('[REDACTED_ADDRESS]')
  })

  it('redacts a "my name is X" pattern', () => {
    const result = redactPii('hi, my name is John Smith')
    expect(result.wasRedacted).toBe(true)
    expect(result.text).toContain('[REDACTED_NAME]')
  })

  it('redacts a Thai "ชื่อ...คือ" name pattern', () => {
    const result = redactPii('ชื่อของฉันคือ สมชาย ใจดี')
    expect(result.wasRedacted).toBe(true)
    expect(result.text).toContain('[REDACTED_NAME]')
  })

  it('leaves ordinary caption-like text untouched', () => {
    const input = 'อยากทำแคมเปญโปรโมทร้านกาแฟช่วงหน้าฝน งบ 3000 บาท'
    const result = redactPii(input)
    expect(result.wasRedacted).toBe(false)
    expect(result.text).toBe(input)
  })
})
