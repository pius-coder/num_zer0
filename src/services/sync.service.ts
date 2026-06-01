import { and, eq } from 'drizzle-orm'

import { BaseService } from './base.service'
import { getGrizzlyClient, type GrizzlyClient } from './grizzly'
import {
  provider,
  externalServiceMapping,
  externalCountryMapping,
  providerBalanceLog,
} from '@/database/schema'

export interface SyncMappingsResult {
  servicesSynced: number
  countriesSynced: number
}

export interface SyncBalanceResult {
  balance: number
}

export class SyncService extends BaseService {
  private readonly grizzly: GrizzlyClient

  constructor() {
    super({ prefix: 'sync-service', db: true })
    this.grizzly = getGrizzlyClient()
  }

  async syncExternalMappings(providerId: string): Promise<SyncMappingsResult> {
    const [services, countries] = await Promise.all([
      this.grizzly.getServicesList(),
      this.grizzly.getCountries(),
    ])

    const serviceValues = services.map((svc) => ({
      id: this.generateId('esm'),
      localSlug: svc.code,
      providerId,
      externalApiCode: svc.code,
    }))

    for (let i = 0; i < serviceValues.length; i += 500) {
      await this.db
        .insert(externalServiceMapping)
        .values(serviceValues.slice(i, i + 500))
        .onConflictDoNothing()
    }

    const countryValues = countries.map((c) => ({
      id: this.generateId('ecm'),
      isoCode: String(c.id),
      providerId,
      externalCountryId: String(c.id),
    }))

    for (let i = 0; i < countryValues.length; i += 500) {
      await this.db
        .insert(externalCountryMapping)
        .values(countryValues.slice(i, i + 500))
        .onConflictDoNothing()
    }

    this.log.info('sync_mappings_complete', {
      providerId,
      servicesSynced: services.length,
      countriesSynced: countries.length,
    })

    return {
      servicesSynced: services.length,
      countriesSynced: countries.length,
    }
  }

  async syncProviderBalance(providerId: string): Promise<SyncBalanceResult> {
    const balance = await this.grizzly.getBalance()

    await this.transaction(async (tx) => {
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
    }, 'sync_provider_balance')

    this.log.info('provider_balance_synced', { providerId, balance })

    return { balance }
  }
}
