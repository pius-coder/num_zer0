import { describe, it, expect, vi, beforeEach, afterAll } from 'bun:test'

// ── Mock credit-ledger service (before module load) ─────────────
const mockHoldCredits = vi.fn().mockResolvedValue({ id: 'hold_123', expiresAt: new Date() })
const mockReleaseHold = vi.fn()

vi.mock('./credit-ledger.service', () => ({
  CreditLedgerService: vi.fn().mockImplementation(() => ({
    holdCredits: mockHoldCredits,
    releaseHold: mockReleaseHold,
  })),
}))

// ── Mock provider-routing service ───────────────────────────────
const mockSelectBestProvider = vi.fn().mockResolvedValue({
  providerId: 'grizzly',
  costUsd: 0.05,
})

vi.mock('./provider-routing.service', () => ({
  ProviderRoutingService: vi.fn().mockImplementation(() => ({
    selectBestProvider: mockSelectBestProvider,
  })),
}))

// ── Mock catalog ─────────────────────────────────────────────────
const mockGetServiceBySlug = vi.fn().mockReturnValue({
  externalId: 'wa',
  slug: 'whatsapp',
  name: 'WhatsApp',
})

vi.mock('@/common/catalog', () => ({
  getServiceBySlug: mockGetServiceBySlug,
}))

// ── Mock grizzly ─────────────────────────────────────────────────
vi.mock('./grizzly', () => ({
  getGrizzlyClient: vi.fn(),
}))

import { getGrizzlyClient } from './grizzly'

// Re-mock PricingResolverService with a controllable mock
const mockResolvePrice = vi.fn()

vi.mock('./pricing-resolver.service', () => ({
  PricingResolverService: vi.fn().mockImplementation(() => ({
    resolvePrice: mockResolvePrice,
  })),
}))

// ── ACTUAL IMPORTS (after all mocks) ────────────────────────────
import { ActivationService } from './activation.service'

describe('ActivationService - Provider Balance Guard', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.clearAllMocks()

    mockSelectBestProvider.mockResolvedValue({
      providerId: 'grizzly',
      costUsd: 0.05,
    })
    mockGetServiceBySlug.mockReturnValue({
      externalId: 'wa',
      slug: 'whatsapp',
      name: 'WhatsApp',
    })
    mockHoldCredits.mockResolvedValue({ id: 'hold_123', expiresAt: new Date() })
    mockReleaseHold.mockResolvedValue(undefined)

    const grizzlyMock = {
      getNumberV2: vi.fn().mockResolvedValue({
        activationId: 999,
        phoneNumber: '+79001234567',
        activationCost: 0.05,
        currency: 643,
        countryCode: '7',
        canGetAnotherSms: false,
        activationTime: 'now',
      }),
      getBalance: vi.fn().mockResolvedValue(50),
      getPricesV3: vi.fn(),
    }
    ;(getGrizzlyClient as any).mockReturnValue(grizzlyMock)
  })

  afterAll(() => {
    vi.clearAllMocks()
  })

  it('should allow purchase when availability > 0', async () => {
    mockResolvePrice.mockResolvedValue({
      priceCredits: 100,
      source: 'computed',
      countryIso: '78',
      serviceSlug: 'whatsapp',
      availability: 42,
    })

    const grizzlyMock = {
      getNumberV2: vi.fn().mockResolvedValue({
        activationId: 999,
        phoneNumber: '+79001234567',
        activationCost: 0.05,
        currency: 643,
        countryCode: '7',
        canGetAnotherSms: false,
        activationTime: 'now',
      }),
      getBalance: vi.fn().mockResolvedValue(50),
      getPricesV3: vi.fn().mockResolvedValue({ price: 0.05, count: 42 }),
    }
    ;(getGrizzlyClient as any).mockReturnValue(grizzlyMock)

    const service = new ActivationService()
    const returningFn = vi.fn().mockResolvedValue([{
      id: 'act_123',
      userId: 'user1',
      serviceSlug: 'whatsapp',
      countryCode: '78',
      providerId: 'grizzly',
      state: 'waiting',
      creditsCharged: 100,
      providerActivationId: '999',
      timerExpiresAt: new Date(),
      phoneNumber: '+79001234567',
    }])
    ;(service as any).db = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({ returning: returningFn }),
      }),
      query: {
        creditHold: { findFirst: vi.fn().mockResolvedValue(null) },
      },
    }

    const result = await service.request({
      userId: 'user1',
      serviceCode: 'whatsapp',
      countryCode: '78',
      holdTimeMinutes: 15,
      idempotencyKey: 'idem_abc',
    })

    expect(result.state).toBe('waiting')
    expect(mockHoldCredits).toHaveBeenCalled()
    expect(mockSelectBestProvider).toHaveBeenCalled()
  })

  it('should reject with out_of_stock when availability is 0', async () => {
    mockResolvePrice.mockResolvedValue({
      priceCredits: 100,
      source: 'computed',
      countryIso: '78',
      serviceSlug: 'whatsapp',
      availability: 0,
    })

    const service = new ActivationService()

    await expect(
      service.request({
        userId: 'user1',
        serviceCode: 'whatsapp',
        countryCode: '78',
        holdTimeMinutes: 15,
        idempotencyKey: 'idem_def',
      })
    ).rejects.toThrow(/rupture de stock/)

    // Credits should NOT be held when out of stock (pre-flight fails first)
    expect(mockHoldCredits).not.toHaveBeenCalled()
    expect(mockSelectBestProvider).not.toHaveBeenCalled()
  })

  it('should hold credits only after pre-flight checks pass', async () => {
    mockResolvePrice.mockResolvedValue({
      priceCredits: 200,
      source: 'computed',
      countryIso: '33',
      serviceSlug: 'telegram',
      availability: 10,
    })

    const service = new ActivationService()
    const returningFn = vi.fn().mockResolvedValue([{
      id: 'act_456',
      userId: 'user2',
      serviceSlug: 'telegram',
      countryCode: '33',
      providerId: 'grizzly',
      state: 'waiting',
      creditsCharged: 200,
      providerActivationId: '888',
      timerExpiresAt: new Date(),
      phoneNumber: '+33123456789',
    }])
    ;(service as any).db = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({ returning: returningFn }),
      }),
    }

    await service.request({
      userId: 'user2',
      serviceCode: 'telegram',
      countryCode: '33',
      holdTimeMinutes: 20,
      idempotencyKey: 'idem_ghi',
    })

    expect(mockHoldCredits).toHaveBeenCalledWith({
      userId: 'user2',
      amount: 200,
      holdTimeMinutes: 20,
      idempotencyKey: 'idem_ghi',
    })
  })

  it('should throw grizzly_no_balance when balance is insufficient', async () => {
    mockResolvePrice.mockResolvedValue({
      priceCredits: 100,
      source: 'computed',
      countryIso: '78',
      serviceSlug: 'whatsapp',
      availability: 5,
    })

    const service = new ActivationService()
    ;(service as any).db = { insert: vi.fn() }

    // Override getGrizzlyClient to return low balance
    const lowBalanceMock = {
      getBalance: vi.fn().mockResolvedValue(0.01),
      getPricesV3: vi.fn().mockResolvedValue({ price: 0.05, count: 5 }),
      getNumberV2: vi.fn(),
    }
    ;(getGrizzlyClient as any).mockReturnValue(lowBalanceMock)

    await expect(
      service.request({ userId: 'user1', serviceCode: 'whatsapp', countryCode: '78', holdTimeMinutes: 15, idempotencyKey: 'idem_jkl' })
    ).rejects.toThrow()

    expect(mockHoldCredits).not.toHaveBeenCalled()
  })

  // ─────────────────────────────────────────────────────────────────────
  // Cancel + Refund Logic Tests (Task 12)
  // ─────────────────────────────────────────────────────────────────────

  it('should cancel with refund when Grizzly returns ACCESS_CANCEL', async () => {
    mockResolvePrice.mockResolvedValue({
      priceCredits: 100,
      source: 'computed',
      countryIso: '78',
      serviceSlug: 'whatsapp',
      availability: 5,
    })

    const grizzlyMock = {
      setStatus: vi.fn().mockResolvedValue({ raw: 'ACCESS_CANCEL', status: 'ACCESS_CANCEL' }),
    }
    ;(getGrizzlyClient as any).mockReturnValue(grizzlyMock)

    const service = new ActivationService()
    ;(service as any).db = {
      query: {
        smsActivation: { findFirst: vi.fn().mockResolvedValue({
          id: 'act_789',
          state: 'waiting',
          providerActivationId: '999',
        })},
        creditHold: { findFirst: vi.fn().mockResolvedValue({ id: 'hold_r1', state: 'held' }) },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'act_789', state: 'cancelled' }]),
          }),
        }),
      }),
      insert: vi.fn(),
    }

    const result = await service.cancelActivation('act_789')

    expect(grizzlyMock.setStatus).toHaveBeenCalledWith(999, -8)
    expect(mockReleaseHold).toHaveBeenCalledWith('hold_r1')
    expect(result.state).toBe('cancelled')
  })

  it('should cancel without refund when Grizzly status is not ACCESS_CANCEL', async () => {
    const grizzlyMock = {
      setStatus: vi.fn().mockResolvedValue({ raw: 'ACCESS_READY', status: 'ACCESS_READY' }),
    }
    ;(getGrizzlyClient as any).mockReturnValue(grizzlyMock)

    const service = new ActivationService()
    ;(service as any).db = {
      query: {
        smsActivation: { findFirst: vi.fn().mockResolvedValue({
          id: 'act_999',
          state: 'waiting',
          providerActivationId: '123',
        })},
        creditHold: { findFirst: vi.fn().mockResolvedValue(null) },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'act_999', state: 'cancelled_no_refund' }]),
          }),
        }),
      }),
      insert: vi.fn(),
    }

    const result = await service.cancelActivation('act_999')

    expect(grizzlyMock.setStatus).toHaveBeenCalledWith(123, -8)
    expect(mockReleaseHold).not.toHaveBeenCalled()
    expect(result.state).toBe('cancelled_no_refund')
  })

  it('should return existing state if already cancelled', async () => {
    const service = new ActivationService()
    ;(service as any).db = {
      query: {
        smsActivation: { findFirst: vi.fn().mockResolvedValue({
          id: 'act_done',
          state: 'cancelled',
          providerActivationId: '999',
        })},
      },
    }

    const result = await service.cancelActivation('act_done')
    expect(result.state).toBe('cancelled')
    // Grizzly should NOT be called
    expect((getGrizzlyClient as any).mock.results?.length).toBe(0)
  })
})
