import { timingSafeEqual } from 'node:crypto'

const asBuffer = (value: string) => Buffer.from(value, 'utf8')

export const verifyInternalWebhookSecret = (providedSecret: string | null): boolean => {
  if (!providedSecret) {
    return false
  }

  const expected = process.env.INTERNAL_API_SECRET || ''
  if (!expected) {
    return false
  }

  const expectedBuffer = asBuffer(expected)
  const providedBuffer = asBuffer(providedSecret)
  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, providedBuffer)
}
