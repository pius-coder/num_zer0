import { describe, expect, test } from 'bun:test'

import { verifyInternalWebhookSecret } from './webhook-security'

describe('webhook-security', () => {
  test('rejects when no secret configured', () => {
    const old = process.env.INTERNAL_API_SECRET
    delete process.env.INTERNAL_API_SECRET
    expect(verifyInternalWebhookSecret('x')).toBe(false)
    process.env.INTERNAL_API_SECRET = old
  })

  test('validates matching token', () => {
    const old = process.env.INTERNAL_API_SECRET
    process.env.INTERNAL_API_SECRET = 'top-secret'
    expect(verifyInternalWebhookSecret('top-secret')).toBe(true)
    expect(verifyInternalWebhookSecret('wrong')).toBe(false)
    process.env.INTERNAL_API_SECRET = old
  })
})
