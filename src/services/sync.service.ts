import { and, eq } from 'drizzle-orm'

import { BaseService } from './base.service'
import { getGrizzlyClient, GrizzlyClient } from './grizzly'
import {
  provider,
  externalServiceMapping,
  externalCountryMapping,
  providerServiceCost,
  subProviderCost,
  priceRule,
  providerBalanceLog,
} from '@/database/schema'
import { getAllServices } from '@/common/catalog'

export interface SyncMappingsResult {
  servicesSynced: number
  countriesSynced: number
}

export interface SyncPricesResult {
  totalUpserted: number
  subProvidersSynced: number
  servicesProcessed: number
}

export interface SyncBalanceResult {
  balance: number
}

export interface RecalcPriceRulesResult {
  rulesCreated: number
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

  async syncPricesFromProvider(
    providerId: string,
    serviceCode?: string
  ): Promise<SyncPricesResult> {
    let codes: string[]

    if (serviceCode) {
      codes = [serviceCode]
    } else {
      const mappings = await this.db
        .select({ externalApiCode: externalServiceMapping.externalApiCode })
        .from(externalServiceMapping)
        .where(eq(externalServiceMapping.providerId, providerId))
        .limit(50)
      codes = mappings.map((m) => m.externalApiCode)
    }

    let totalUpserted = 0
    const costValues: (typeof providerServiceCost.$inferInsert)[] = []
    const subProviderValues: (typeof subProviderCost.$inferInsert)[] = []

    for (const code of codes) {
      try {
        const raw = await this.grizzly.getRawPricesV3(code)

        for (const [country, serviceData] of Object.entries(raw)) {
          for (const [svc, entry] of Object.entries(serviceData)) {
            costValues.push({
              id: this.generateId('psc'),
              providerId,
              serviceCode: svc,
              countryCode: country,
              costUsd: String(entry.price),
              availability: entry.count,
            })

            if (entry.providers) {
              for (const [subId, sub] of Object.entries(entry.providers)) {
                const prices = sub.price ?? []
                if (prices.length === 0) continue
                subProviderValues.push({
                  id: this.generateId('spc'),
                  providerId,
                  serviceCode: svc,
                  countryCode: country,
                  subProviderId: sub.provider_id || subId,
                  minPriceUsd: String(Math.min(...prices)),
                  maxPriceUsd: String(Math.max(...prices)),
                  priceCount: prices.length,
                  availability: sub.count,
                })
              }
            }
          }
        }
      } catch (err) {
        this.log.error('price_sync_failed_for_code', {
          serviceCode: code,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Delete stale rows for the processed codes before inserting fresh data
    for (const code of codes) {
      await this.db
        .delete(providerServiceCost)
        .where(
          and(
            eq(providerServiceCost.providerId, providerId),
            eq(providerServiceCost.serviceCode, code)
          )
        )
      await this.db
        .delete(subProviderCost)
        .where(
          and(eq(subProviderCost.providerId, providerId), eq(subProviderCost.serviceCode, code))
        )
    }

    for (let i = 0; i < costValues.length; i += 500) {
      await this.db
        .insert(providerServiceCost)
        .values(costValues.slice(i, i + 500))
        .onConflictDoNothing()
      totalUpserted += Math.min(500, costValues.length - i)
      this.log.info('price_batch_inserted', {
        current: Math.min(i + 500, costValues.length),
        total: costValues.length,
      })
    }

    for (let i = 0; i < subProviderValues.length; i += 500) {
      await this.db
        .insert(subProviderCost)
        .values(subProviderValues.slice(i, i + 500))
        .onConflictDoNothing()
    }

    this.log.info('sync_prices_complete', {
      providerId,
      totalUpserted,
      servicesProcessed: codes.length,
      subProvidersSynced: subProviderValues.length,
    })

    return {
      totalUpserted,
      subProvidersSynced: subProviderValues.length,
      servicesProcessed: codes.length,
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

  async recalculatePriceRules(): Promise<RecalcPriceRulesResult> {
    const costs = await this.db
      .select({
        serviceCode: providerServiceCost.serviceCode,
        countryCode: providerServiceCost.countryCode,
        costUsd: providerServiceCost.costUsd,
        availability: providerServiceCost.availability,
      })
      .from(providerServiceCost)

    if (costs.length === 0) {
      this.log.warn('recalc_price_rules_no_costs', {})
      return { rulesCreated: 0 }
    }

    // Map GrizzlySMS external IDs to catalog slugs
    const allServices = getAllServices()
    const externalIdToSlug = new Map<string, string>()
    for (const svc of allServices) {
      externalIdToSlug.set(svc.externalId, svc.slug)
    }

    const values: (typeof priceRule.$inferInsert)[] = costs.map((cost) => ({
      id: this.generateId('pr'),
      serviceSlug: externalIdToSlug.get(cost.serviceCode) ?? cost.serviceCode,
      countryIso: cost.countryCode,
      priceCredits: Math.ceil(Number.parseFloat(cost.costUsd) * 2.5 * 650),
      floorCredits: Math.ceil(Number.parseFloat(cost.costUsd) * 1.6 * 650),
      baselineWholesaleUsd: cost.costUsd,
      cachedAvailability: cost.availability,
      availabilityLastCheckedAt: new Date(),
      isActive: true,
    }))

    for (let i = 0; i < values.length; i += 500) {
      await this.db
        .insert(priceRule)
        .values(values.slice(i, i + 500))
        .onConflictDoNothing()
    }

    this.log.info('price_rules_recalculated', { rulesCreated: values.length })

    return { rulesCreated: values.length }
  }
}
