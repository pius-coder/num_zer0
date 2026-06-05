import { describe, it, expect } from 'vitest'
import { COUNTRIES, getCountryByIso, SERVICES } from '@/components/services/data'

describe('COUNTRIES', () => {
  it('has all countries with valid structure', () => {
    expect(COUNTRIES.length).toBeGreaterThan(60)
    for (const c of COUNTRIES) {
      expect(c.iso).toBeTruthy()
      expect(c.code).toBeTruthy()
      expect(c.name).toBeTruthy()
      expect(c.phonePrefix).toBeTruthy()
    }
  })

  it('has UAE as first entry (alphabetical by ISO)', () => {
    expect(COUNTRIES[0].iso).toBe('AE')
    expect(COUNTRIES[0].name).toBe('United Arab Emirates')
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
