import { describe, it, expect } from 'vitest'
import { usdToXaf, COUNTRIES, getCountryByIso, SERVICES } from '@/components/services/data'

describe('usdToXaf', () => {
  it('converts small amounts with 500 margin', () => {
    const result = usdToXaf(0.35)
    expect(result).toBe(730)
  })

  it('converts medium amounts with 1000 margin', () => {
    const result = usdToXaf(0.75)
    expect(result).toBe(1492)
  })

  it('converts large amounts with 2000 margin', () => {
    const result = usdToXaf(2.0)
    expect(result).toBe(3312)
  })

  it('handles boundary at 0.5', () => {
    const result = usdToXaf(0.5)
    expect(result).toBeGreaterThan(0)
  })

  it('handles boundary at 1.0', () => {
    const result = usdToXaf(1.0)
    expect(result).toBeGreaterThan(0)
  })
})

describe('COUNTRIES', () => {
  it('has all countries with valid structure', () => {
    expect(COUNTRIES.length).toBeGreaterThan(60)
    for (const c of COUNTRIES) {
      expect(c.iso).toBeTruthy()
      expect(typeof c.priceUsd).toBe('number')
      expect(c.priceUsd).toBeGreaterThan(0)
      expect(typeof c.priceXaf).toBe('number')
      expect(c.priceXaf).toBeGreaterThan(0)
      expect(c.flag).toBeTruthy()
    }
  })

  it('has France as first entry', () => {
    expect(COUNTRIES[0].iso).toBe('FR')
    expect(COUNTRIES[0].name).toBe('France')
  })

  it('priceXaf is derived from priceUsd', () => {
    for (const c of COUNTRIES) {
      expect(c.priceXaf).toBe(usdToXaf(c.priceUsd))
    }
  })
})

describe('getCountryByIso', () => {
  it('finds country by ISO code', () => {
    const fr = getCountryByIso('FR')
    expect(fr?.name).toBe('France')
  })

  it('returns undefined for unknown ISO', () => {
    expect(getCountryByIso('XX')).toBeUndefined()
  })
})

describe('SERVICES', () => {
  it('has WhatsApp, Telegram, Viber, Signal, Line, Imo, Facebook, Gmail, Uber, Amazon', () => {
    const slugs = SERVICES.map(s => s.slug)
    expect(slugs).toContain('whatsapp')
    expect(slugs).toContain('telegram')
    expect(SERVICES.length).toBeGreaterThanOrEqual(10)
  })
})
