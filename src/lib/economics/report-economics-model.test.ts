import { describe, expect, test } from 'bun:test'

import {
  CREDIT_PACKAGES,
  CREDIT_TYPES,
  applyCreditPurchase,
  calculateMarginRatio,
  calculateVerificationCapacity,
  evaluateFraudSignals,
  getCreditExpiry,
  selectBestProvider,
  type CreditBalance,
  type ProviderCost,
} from './report-economics-model'

describe('economic model checks', () => {
  test('popular package capacity and breakage', () => {
    const popular = CREDIT_PACKAGES.find((p) => p.id === 'popular')
    if (!popular) throw new Error('popular_package_not_found')

    const start: CreditBalance = { base: 0, bonus: 0, promotional: 0 }
    const purchased = applyCreditPurchase(start, {
      id: popular.id,
      credits: popular.credits,
      price_xaf: popular.price_xaf,
      bonus_pct: popular.bonus_pct,
      label: popular.label,
    })

    const total = purchased.balance.base + purchased.balance.bonus + purchased.balance.promotional
    const result = calculateVerificationCapacity(total, 120)

    expect(total).toBe(2750)
    expect(result.verifications).toBe(22)
    expect(result.remainingCredits).toBe(110)
  })

  test('whatsapp CM margin ratio is positive and above floor', () => {
    const ratio = calculateMarginRatio(120, 0.12, 2.6)
    expect(ratio).toBeGreaterThan(1.6)
    expect(ratio).toBeLessThan(3.5)
  })

  test('bonus expires after 90 days and base never expires', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const bonusExpiry = getCreditExpiry(CREDIT_TYPES.BONUS, now)
    const baseExpiry = getCreditExpiry(CREDIT_TYPES.BASE, now)

    expect(baseExpiry).toBeNull()
    expect(bonusExpiry).not.toBeNull()

    const diffMs = bonusExpiry!.getTime() - now.getTime()
    expect(diffMs).toBe(90 * 24 * 3600 * 1000)
  })

  test('routing picks cheapest adjusted by reliability', () => {
    const providers: ProviderCost[] = [
      {
        provider: 'grizzlysms',
        service: 'whatsapp',
        countryCode: 'CM',
        costUsd: 0.12,
        availability: 200,
        successRate30d: 0.99,
      },
      {
        provider: 'sms_activate',
        service: 'whatsapp',
        countryCode: 'CM',
        costUsd: 0.11,
        availability: 200,
        successRate30d: 0.7,
      },
    ]

    const best = selectBestProvider(providers)
    expect(best).toBe('grizzlysms')
  })

  test('fraud detection flags and rate limits above 50 per hour', () => {
    const decision = evaluateFraudSignals({
      verificationsLastHour: 51,
      consecutiveRefundsByService: 0,
      cancelRatePct: 0,
      cancelAttempts: 0,
      consecutiveFailures: 0,
      countriesLast24h: 1,
    })

    expect(decision.flagged).toBe(true)
    expect(decision.rateLimited).toBe(true)
    expect(decision.reasons).toContain('rapid_consumption')
  })
})
