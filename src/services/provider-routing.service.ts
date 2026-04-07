import { eq } from 'drizzle-orm'

import { BaseService, isServiceError } from './base.service'
import { provider, providerBalanceLog } from '@/database/schema'
import { getGrizzlyClient } from './grizzly'

export interface ProviderCandidate {
  providerId: string
  providerCode: string
  serviceCode: string
  countryCode: string
  costUsd: number
  availability: number
  currentBalanceUsd: number | null
  balanceLastCheckedAt: Date | null
  score: number
}

export class ProviderRoutingService extends BaseService {
  constructor() {
    super({ prefix: 'provider-routing', db: true })
  }

  async selectBestProvider(serviceCode: string, countryCode: string): Promise<ProviderCandidate> {
    // With shadow pricing, we use Grizzly directly for cost/availability
    const grizzly = getGrizzlyClient()
    const price = await grizzly.getPricesV3(countryCode, serviceCode)

    this.assert(price !== null, 'no_provider_candidate', 'No provider available', {
      serviceCode,
      countryCode,
    })

    // Fetch the single active provider (Grizzly)
    const [activeProvider] = await this.db
      .select({
        id: provider.id,
        code: provider.code,
        currentBalanceUsd: provider.currentBalanceUsd,
        balanceLastCheckedAt: provider.balanceLastCheckedAt,
      })
      .from(provider)
      .where(eq(provider.isActive, true))
      .limit(1)

    this.assert(!!activeProvider, 'no_active_provider', 'No active provider found')

    // Fetch live balance
    const liveBalance = await this.fetchLiveBalance(activeProvider.id)
    await this.updateProviderBalanceInDb(activeProvider.id, liveBalance)

    const costUsd = price!.price

    if (liveBalance !== null && liveBalance < costUsd) {
      this.assert(
        false,
        'provider_insufficient_funds',
        `Provider ${activeProvider.code} has insufficient funds (live: $${liveBalance.toFixed(4)}, required: $${costUsd.toFixed(4)})`,
        {
          providerCode: activeProvider.code,
          providerId: activeProvider.id,
          liveBalanceUsd: liveBalance,
          requiredUsd: costUsd,
        }
      )
    }

    const candidate: ProviderCandidate = {
      providerId: activeProvider.id,
      providerCode: activeProvider.code,
      serviceCode,
      countryCode,
      costUsd,
      availability: price!.count,
      currentBalanceUsd: liveBalance,
      balanceLastCheckedAt: new Date(),
      score: costUsd,
    }

    this.log.info('provider_selected', {
      serviceCode,
      countryCode,
      providerCode: activeProvider.code,
      score: candidate.score,
      liveBalanceUsd: liveBalance,
    })

    return candidate
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
