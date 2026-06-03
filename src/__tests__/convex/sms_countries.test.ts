import { describe, it, expect } from 'vitest'
import { SMS_COUNTRY_MAP, ISO_TO_SMS, numericToIso, isoToNumeric } from '../../../convex/sms_countries'

describe('SMS_COUNTRY_MAP', () => {
  it('covers major countries', () => {
    expect(SMS_COUNTRY_MAP[1]).toBe('US')
    expect(SMS_COUNTRY_MAP[33]).toBe('FR')
    expect(SMS_COUNTRY_MAP[44]).toBe('GB')
    expect(SMS_COUNTRY_MAP[49]).toBe('DE')
    expect(SMS_COUNTRY_MAP[237]).toBe('CM')
    expect(SMS_COUNTRY_MAP[86]).toBe('CN')
    expect(SMS_COUNTRY_MAP[81]).toBe('JP')
    expect(SMS_COUNTRY_MAP[91]).toBe('IN')
  })

  it('has over 100 entries', () => {
    expect(Object.keys(SMS_COUNTRY_MAP).length).toBeGreaterThan(100)
  })

  it('all values are uppercase ISO codes', () => {
    for (const iso of Object.values(SMS_COUNTRY_MAP)) {
      expect(iso).toMatch(/^[A-Z]{2}$/)
    }
  })

  it('all keys are positive integers', () => {
    for (const code of Object.keys(SMS_COUNTRY_MAP)) {
      expect(Number(code)).toBeGreaterThan(0)
    }
  })
})

describe('ISO_TO_SMS', () => {
  it('provides reverse mapping', () => {
    expect(ISO_TO_SMS['US']).toBe(1)
    expect(ISO_TO_SMS['FR']).toBe(33)
    expect(ISO_TO_SMS['GB']).toBe(44)
    expect(ISO_TO_SMS['DE']).toBe(49)
    expect(ISO_TO_SMS['CM']).toBe(237)
  })

  it('has same number of entries as SMS_COUNTRY_MAP', () => {
    expect(Object.keys(ISO_TO_SMS).length).toBe(Object.keys(SMS_COUNTRY_MAP).length)
  })

  it('is a bijection (round-trip)', () => {
    for (const [numeric, iso] of Object.entries(SMS_COUNTRY_MAP)) {
      expect(ISO_TO_SMS[iso]).toBe(Number(numeric))
    }
  })
})

describe('numericToIso', () => {
  it('converts numeric to ISO', () => {
    expect(numericToIso(33)).toBe('FR')
    expect(numericToIso(1)).toBe('US')
  })

  it('returns null for unknown codes', () => {
    expect(numericToIso(999)).toBeNull()
  })
})

describe('isoToNumeric', () => {
  it('converts ISO to numeric', () => {
    expect(isoToNumeric('FR')).toBe(33)
    expect(isoToNumeric('US')).toBe(1)
  })

  it('returns null for unknown ISOs', () => {
    expect(isoToNumeric('XX')).toBeNull()
  })
})
