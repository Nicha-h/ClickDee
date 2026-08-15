import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'
import { env } from '../config/env.js'

export class EncryptionNotConfiguredError extends Error {}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getKey(): Buffer {
  const key = Buffer.from(env.AI_MEMORY_ENCRYPTION_KEY, 'base64')
  if (key.length !== 32) {
    throw new EncryptionNotConfiguredError(
      'AI_MEMORY_ENCRYPTION_KEY must decode to exactly 32 bytes',
    )
  }
  return key
}

export function encryptField(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return [iv, authTag, ciphertext].map((b) => b.toString('base64')).join(':')
}

export function decryptField(blob: string): string {
  const [ivB64, authTagB64, ciphertextB64] = blob.split(':')
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Malformed encrypted field')
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}
