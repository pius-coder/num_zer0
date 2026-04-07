import { describe, it, expect, vi, beforeEach } from 'bun:test'

// Mock database before anything else
vi.mock('@/database', () => ({
  db: {
    update: vi.fn(),
    set: vi.fn(),
    where: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    transaction: vi.fn(),
  }
}))

import { SyncService } from './sync.service'
import { mockGrizzlyClient } from './__mocks__/grizzly'
import { provider, providerBalanceLog } from '@/database/schema'

// Mock grizzly module
vi.mock('./grizzly', () => ({
  getGrizzlyClient: vi.fn()
}))

import { getGrizzlyClient } from './grizzly'

describe('SyncService - Provider Balance', () => {
  let syncService: SyncService
  let mockGrizzly: any
  let mockDb: any

  beforeEach(() => {
    vi.resetAllMocks()
    mockGrizzly = mockGrizzlyClient()
    ;(getGrizzlyClient as any).mockReturnValue(mockGrizzly)

    // Get the mocked DB from the module
    const { db } = require('@/database')
    mockDb = db
    mockDb.update.mockReturnThis()
    mockDb.set.mockReturnThis()
    mockDb.where.mockReturnThis()
    mockDb.insert.mockReturnThis()
    mockDb.values.mockReturnThis()
    mockDb.transaction.mockImplementation((cb: any) => cb(mockDb))
  })

  it('should update provider balance in database after fetching from Grizzly', async () => {
    const service = new SyncService()
    // Inject mock DB into private this.db in BaseService
    ;(service as any).db = mockDb
    
    const balanceValue = 150.50
    vi.spyOn(mockGrizzly, 'getBalance').mockResolvedValue(balanceValue)

    await service.syncProviderBalance('grizzly')

    // Verify DB update was called for provider table
    expect(mockDb.update).toHaveBeenCalledWith(provider)
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
      currentBalanceUsd: "150.5",
      balanceLastCheckedAt: expect.any(Date)
    }))

    // Verify DB insert was called for providerBalanceLog
    expect(mockDb.insert).toHaveBeenCalledWith(providerBalanceLog)
    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
      providerId: 'grizzly',
      balanceUsd: "150.5"
    }))
  })
})
