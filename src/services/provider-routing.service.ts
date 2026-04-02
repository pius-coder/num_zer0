import { asc, eq } from 'drizzle-orm'

import { BaseService, isServiceError } from './base.service'
import { provider, providerBalanceLog, providerServiceCost } from '@/database/schema'
import { getGrizzlyClient } from './grizzly'

export interface ProviderCandidate {
  providerId: string
  providerCode: string
  serviceCode: string
  countryCode: string
  costUsd: number
  availability: number
  successRate30d: number
  currentBalanceUsd: number | null
  balanceLastCheckedAt: Date | null
  score: number
}

export class ProviderRoutingService extends BaseService {
  constructor() {
    super({ prefix: 'provider-routing', db: true })
  }

  async listCandidates(serviceCode: string, countryCode: string): Promise<ProviderCandidate[]> {
    const rows = await this.db
      .select({
        providerId: providerServiceCost.providerId,
        providerCode: provider.code,
        serviceCode: providerServiceCost.serviceCode,
        countryCode: providerServiceCost.countryCode,
        costUsd: providerServiceCost.costUsd,
        availability: providerServiceCost.availability,
        successRate30d: providerServiceCost.successRate30d,
        reliabilityPenaltyMultiplier: provider.reliabilityPenaltyMultiplier,
        currentBalanceUsd: provider.currentBalanceUsd,
        balanceLastCheckedAt: provider.balanceLastCheckedAt,
      })
      .from(providerServiceCost)
      .innerJoin(provider, eq(provider.id, providerServiceCost.providerId))
      .where(eq(providerServiceCost.serviceCode, serviceCode))
      .orderBy(asc(provider.priority))

    return rows
      .map((row) => {
        const cost = Number(row.costUsd)
        const rate = Number(row.successRate30d)
        const multiplier = Number(row.reliabilityPenaltyMultiplier)
        const balance = row.currentBalanceUsd ? Number(row.currentBalanceUsd) : null
        return {
          providerId: row.providerId,
          providerCode: row.providerCode,
          serviceCode: row.serviceCode,
          countryCode: row.countryCode,
          costUsd: cost,
          availability: row.availability,
          successRate30d: rate,
          currentBalanceUsd: balance,
          balanceLastCheckedAt: row.balanceLastCheckedAt,
          score: cost + (1 - rate) * cost * multiplier,
        }
      })
      .sort((a, b) => a.score - b.score)
  }

  async selectBestProvider(serviceCode: string, countryCode: string): Promise<ProviderCandidate> {
    const candidates = await this.listCandidates(serviceCode, countryCode)
    this.assert(candidates.length > 0, 'no_provider_candidate', 'No provider available', {
      serviceCode,
      countryCode,
    })

    const winner = candidates[0]

    // Fetch live balance from Grizzly
    const liveBalance = await this.fetchLiveBalance(winner.providerId)

    // Update DB with fresh balance (only if fetch succeeded)
    await this.updateProviderBalanceInDb(winner.providerId, liveBalance)

    // Only check balance if we got a real value (null = fetch failed, let it pass)
    if (liveBalance !== null && liveBalance < winner.costUsd) {
      this.assert(
        false,
        'provider_insufficient_funds',
        `Provider ${winner.providerCode} has insufficient funds (live: $${liveBalance.toFixed(4)}, required: $${winner.costUsd.toFixed(4)})`,
        {
          providerCode: winner.providerCode,
          providerId: winner.providerId,
          liveBalanceUsd: liveBalance,
          requiredUsd: winner.costUsd,
        }
      )
    }

    this.log.info('provider_selected', {
      serviceCode,
      countryCode,
      providerCode: winner.providerCode,
      score: winner.score,
      liveBalanceUsd: liveBalance,
    })
    return winner
  }

  async listCandidatesWithBalance(
    serviceCode: string,
    countryCode: string,
    excludeProviderIds: string[] = []
  ): Promise<ProviderCandidate[]> {
    const all = await this.listCandidates(serviceCode, countryCode)
    const filtered =
      excludeProviderIds.length > 0
        ? all.filter((c) => !excludeProviderIds.includes(c.providerId))
        : all

    // Fetch live balance for each candidate (propagates grizzly_no_balance)
    for (const candidate of filtered) {
      const liveBalance = await this.fetchLiveBalance(candidate.providerId)
      if (liveBalance !== null) {
        candidate.currentBalanceUsd = liveBalance
        candidate.balanceLastCheckedAt = new Date()
        await this.updateProviderBalanceInDb(candidate.providerId, liveBalance)
      }
    }

    return filtered
  }

  private async fetchLiveBalance(providerId: string): Promise<number | null> {
    try {
      const grizzly = getGrizzlyClient()
      const balance = await grizzly.getBalance()
      this.log.info('live_balance_fetched', { providerId, balance })
      return balance
    } catch (err) {
      if (isServiceError(err) && err.code === 'grizzly_no_balance') {
        throw err
      }
      this.log.warn('live_balance_fetch_failed', {
        providerId,
        error: err instanceof Error ? err.message : String(err),
      })
      return null
    }
  }

  private async updateProviderBalanceInDb(
    providerId: string,
    balance: number | null
  ): Promise<void> {
    if (balance === null) return
    try {
      await this.db.transaction(async (tx) => {
        await tx
          .update(provider)
          .set({
            currentBalanceUsd: String(balance),
            balanceLastCheckedAt: new Date(),
          })
          .where(eq(provider.id, providerId))

        await tx.insert(providerBalanceLog).values({
          id: this.generateId('pbl'),
          providerId,
          balanceUsd: String(balance),
        })
      })
    } catch (err) {
      this.log.warn('provider_balance_update_failed', {
        providerId,
        balance,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
}
