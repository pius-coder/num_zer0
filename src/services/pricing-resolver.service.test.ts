import { describe, it, expect, vi, beforeEach } from 'bun:test'

function makeQueryBuilder(result: unknown) {
  const qb: any = {}
  qb.from = vi.fn().mockReturnValue(qb)
  qb.where = vi.fn().mockReturnValue(qb)
  qb.limit = vi.fn().mockReturnValue(Promise.resolve(result))
  return qb
}

vi.mock('@/database', () => ({
  db: {
    select: vi.fn(),
  }
}))

import { PricingResolverService } from './pricing-resolver.service'
import { mockGrizzlyClient } from './__mocks__/grizzly'

vi.mock('./grizzly', () => ({
  getGrizzlyClient: vi.fn()
}))

import { getGrizzlyClient } from './grizzly'

describe('PricingResolverService - Availability', () => {
  let mockGrizzly: any
  let mockDb: any

  beforeEach(() => {
    vi.resetAllMocks()
    mockGrizzly = mockGrizzlyClient()
    ;(getGrizzlyClient as any).mockReturnValue(mockGrizzly)

    const { db } = require('@/database')
    mockDb = db
  })

  it('should include availability from Grizzly live data', async () => {
    mockDb.select.mockReturnValue(makeQueryBuilder([]))

    vi.spyOn(mockGrizzly, 'getPricesV3').mockResolvedValue({
      price: 0.10,
      count: 42,
      providers: null
    })

    const resolver = new PricingResolverService()
    ;(resolver as any).db = mockDb

    const result = await resolver.resolvePrice('whatsapp', '78')
    expect(result.availability).toBe(42)
  })

  it('should return zero availability when Grizzly has no stock', async () => {
    mockDb.select.mockReturnValue(makeQueryBuilder([]))

    vi.spyOn(mockGrizzly, 'getPricesV3').mockResolvedValue({
      price: 0.10,
      count: 0,
      providers: null
    })

    const resolver = new PricingResolverService()
    ;(resolver as any).db = mockDb

    const result = await resolver.resolvePrice('whatsapp', '78')
    expect(result.availability).toBe(0)
  })
})
