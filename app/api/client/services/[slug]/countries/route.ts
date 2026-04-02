import { NextResponse } from 'next/server'
import { and, asc, eq, sql } from 'drizzle-orm'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { priceRule, subProviderCost } from '@/database/schema'
import { getCountryByIso, getServiceBySlug } from '@/common/catalog'

const log = createLogger({ prefix: 'api-service-countries' })

const MARGIN_MULTIPLIER = 2.5
const CREDITS_PER_USD = 650

function usdToCredits(costUsd: number): number {
  return Math.ceil(costUsd * MARGIN_MULTIPLIER * CREDITS_PER_USD)
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ctx = extractRequestContext(req)

  try {
    const session = await requireSession()
    const authed = withUser(ctx, session.user.id)

    const key = getClientKey(session.user.id, req)
    const { allowed, retryAfterMs } = rateLimit(key)
    if (!allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      )
    }

    const { slug } = await params

    const rows = await db
      .select({
        countryIso: priceRule.countryIso,
        priceCredits: priceRule.priceCredits,
        availability: priceRule.cachedAvailability,
      })
      .from(priceRule)
      .where(and(eq(priceRule.serviceSlug, slug), eq(priceRule.isActive, true)))
      .orderBy(asc(priceRule.priceCredits))

    const serviceMeta = getServiceBySlug(slug)
    const externalId = serviceMeta?.externalId ?? slug

    const subProviderRows =
      rows.length > 0
        ? await db
            .select({
              countryCode: subProviderCost.countryCode,
              subProviderId: subProviderCost.subProviderId,
              minPriceUsd: sql<number>`CAST(${subProviderCost.minPriceUsd} AS FLOAT)`,
              availability: subProviderCost.availability,
            })
            .from(subProviderCost)
            .where(
              and(
                eq(subProviderCost.serviceCode, externalId),
                sql`${subProviderCost.countryCode} IN (${sql.join(
                  rows.map((r) => r.countryIso),
                  sql`, `
                )})`
              )
            )
        : []

    const subProviderMap = new Map<
      string,
      {
        providerCount: number
        details: Array<{ providerCode: string; count: number; priceCredits: number }>
      }
    >()

    for (const sp of subProviderRows) {
      let entry = subProviderMap.get(sp.countryCode)
      if (!entry) {
        entry = { providerCount: 0, details: [] }
        subProviderMap.set(sp.countryCode, entry)
      }
      entry.providerCount++
      entry.details.push({
        providerCode: sp.subProviderId,
        count: sp.availability ?? 0,
        priceCredits: usdToCredits(sp.minPriceUsd),
      })
    }

    for (const entry of subProviderMap.values()) {
      entry.details.sort((a, b) => a.priceCredits - b.priceCredits)
    }

    const enriched = rows.map((row) => {
      const meta = getCountryByIso(row.countryIso)
      const sub = subProviderMap.get(row.countryIso)
      return {
        countryIso: row.countryIso,
        name: meta?.name ?? row.countryIso,
        icon: meta?.icon ?? null,
        priceCredits: row.priceCredits,
        availability: row.availability ?? 0,
        providerCount: sub?.providerCount ?? 0,
        subProviders: sub?.details ?? [],
      }
    })

    log.info('service_countries_listed', {
      ...toAuditEntry(authed, 'list', 'countries', 'success'),
      serviceSlug: slug,
      count: enriched.length,
    })

    return NextResponse.json(
      { items: enriched, total: enriched.length, nextCursor: null },
      { headers: { 'Cache-Control': 'private, max-age=30' } }
    )
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
