import { eq, and } from 'drizzle-orm'

import { BaseService } from './base.service'
import { getGrizzlyClient, type GrizzlyClient } from './grizzly'
import type { PriceV3Entry, FlatPriceV3Row } from './grizzly/types'
import { priceOverride } from '@/database/schema'
import { getServiceBySlug } from '@/common/catalog'

export interface PriceResult {
  priceCredits: number
  source: 'override' | 'computed'
  countryIso: string
  serviceSlug: string
  availability?: number
}

export class PricingResolverService extends BaseService {
  private readonly grizzly: GrizzlyClient
  private readonly inflight = new Map<string, Promise<PriceV3Entry | null>>()

  constructor() {
    super({ prefix: 'pricing-resolver', db: true })
    this.grizzly = getGrizzlyClient()
  }

  async resolvePrice(serviceSlug: string, countryIso: string): Promise<PriceResult> {
    // 1. Check for override
    try {
      const [override] = await this.db
        .select({
          priceCredits: priceOverride.priceCredits,
        })
        .from(priceOverride)
        .where(
          and(
            eq(priceOverride.serviceSlug, serviceSlug),
            eq(priceOverride.countryIso, countryIso)
          )
        )
        .limit(1)

      if (override) {
        return {
          priceCredits: override.priceCredits,
          source: 'override',
          countryIso,
          serviceSlug,
        }
      }
    } catch (err) {
      this.log.warn('price_override_table_missing', { serviceSlug, countryIso })
    }

    // 2. Fetch from Grizzly with promise coalescing
    const entry = await this.fetchWithCoalescing(countryIso, serviceSlug)

    if (!entry) {
      throw this.error(
        'price_unavailable',
        `No price available for ${serviceSlug} in country ${countryIso}`,
        { serviceSlug, countryIso }
      )
    }

    // 3. Compute price: rawPrice (USD) × 2.5 × 650
    const priceCredits = Math.ceil(entry.price * 2.5 * 650)

    return {
      priceCredits,
      source: 'computed',
      countryIso,
      serviceSlug,
      availability: entry.count,
    }
  }

  async resolvePricesForService(serviceSlug: string): Promise<PriceResult[]> {
    // 1. Fetch all overrides for this service
    let overrides: any[] = []
    try {
      overrides = await this.db
        .select({
          countryIso: priceOverride.countryIso,
          priceCredits: priceOverride.priceCredits,
        })
        .from(priceOverride)
        .where(eq(priceOverride.serviceSlug, serviceSlug))
    } catch (err) {
      this.log.warn('price_override_table_missing', { serviceSlug })
    }

    const overrideMap = new Map<string, number>()
    for (const o of overrides) {
      overrideMap.set(o.countryIso, o.priceCredits)
    }

    // Map slug → Grizzly external code (e.g. "whatsapp" → "wa")
    const serviceMeta = getServiceBySlug(serviceSlug)
    const grizzlyServiceCode = serviceMeta?.externalId ?? serviceSlug

    // 2. Fetch Grizzly prices for this service across all countries
    let grizzlyPrices: Array<{ country: string; price: number; count: number }> = []
    try {
      const allPrices = await this.grizzly.getPricesV3All()
      grizzlyPrices = allPrices
        .filter((row: FlatPriceV3Row) => row.service === grizzlyServiceCode)
        .map((row: FlatPriceV3Row) => ({ country: row.country, price: row.price, count: row.count }))
    } catch (err) {
      this.log.error('grizzly_prices_fetch_failed', {
        serviceSlug,
        grizzlyServiceCode,
        error: err instanceof Error ? err.message : String(err),
      })
      // Return only overrides if Grizzly is down
      return overrides.map((o) => ({
        priceCredits: o.priceCredits,
        source: 'override' as const,
        countryIso: o.countryIso,
        serviceSlug,
      }))
    }

    // 3. Merge: overrides take priority
    const results: PriceResult[] = []
    const seen = new Set<string>()

    for (const gp of grizzlyPrices) {
      seen.add(gp.country)
      const overridePrice = overrideMap.get(gp.country)

      if (overridePrice !== undefined) {
        results.push({
          priceCredits: overridePrice,
          source: 'override',
          countryIso: gp.country,
          serviceSlug,
          availability: gp.count,
        })
      } else {
        results.push({
          priceCredits: Math.ceil(gp.price * 2.5 * 650),
          source: 'computed',
          countryIso: gp.country,
          serviceSlug,
          availability: gp.count,
        })
      }
    }

    // Add override-only countries (not in Grizzly response)
    for (const [countryIso, priceCredits] of overrideMap) {
      if (!seen.has(countryIso)) {
        results.push({
          priceCredits,
          source: 'override',
          countryIso,
          serviceSlug,
        })
      }
    }

    return results
  }

  private fetchWithCoalescing(countryIso: string, serviceSlug: string): Promise<PriceV3Entry | null> {
    const key = `${countryIso}:${serviceSlug}`
    const existing = this.inflight.get(key)
    if (existing) return existing

    const promise = this.grizzly
      .getPricesV3(countryIso, serviceSlug)
      .finally(() => {
        this.inflight.delete(key)
      })

    this.inflight.set(key, promise)
    return promise
  }
}
