import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/database'
import { provider, providerServiceCost } from '@/database/schema'
import { createLogger } from '@/lib/logger'

const log = createLogger({ prefix: 'provider-routing' })

export interface ProviderCandidate {
  providerId: string
  providerCode: string
  serviceCode: string
  countryCode: string
  costUsd: number
  availability: number
  successRate30d: number
  score: number
}

export class ProviderRoutingService {
  static async listCandidates(serviceCode: string, countryCode: string): Promise<ProviderCandidate[]> {
    const rows = await db
      .select({
        providerId: providerServiceCost.providerId,
        providerCode: provider.code,
        serviceCode: providerServiceCost.serviceCode,
        countryCode: providerServiceCost.countryCode,
        costUsd: providerServiceCost.costUsd,
        availability: providerServiceCost.availability,
        successRate30d: providerServiceCost.successRate30d,
        reliabilityPenaltyMultiplier: provider.reliabilityPenaltyMultiplier,
      })
      .from(providerServiceCost)
      .innerJoin(provider, eq(provider.id, providerServiceCost.providerId))
      .where(
        and(
          eq(providerServiceCost.serviceCode, serviceCode),
          eq(providerServiceCost.countryCode, countryCode),
          eq(provider.isActive, true)
        )
      )
      .orderBy(asc(provider.priority))

    const parsed = rows.map((row) => {
      const costUsd = Number(row.costUsd)
      const successRate30d = Number(row.successRate30d)
      const multiplier = Number(row.reliabilityPenaltyMultiplier)
      const score = costUsd + (1 - successRate30d) * costUsd * multiplier

      return {
        providerId: row.providerId,
        providerCode: row.providerCode,
        serviceCode: row.serviceCode,
        countryCode: row.countryCode,
        costUsd,
        availability: row.availability,
        successRate30d,
        score,
      }
    })

    return parsed.sort((a, b) => a.score - b.score)
  }

  static async selectBestProvider(serviceCode: string, countryCode: string): Promise<ProviderCandidate> {
    const candidates = await this.listCandidates(serviceCode, countryCode)
    if (candidates.length === 0) {
      throw new Error('no_provider_candidate')
    }

    const winner = candidates[0]
    log.info('provider_selected', {
      serviceCode,
      countryCode,
      providerCode: winner.providerCode,
      score: winner.score,
      availability: winner.availability,
    })
    return winner
  }
}
