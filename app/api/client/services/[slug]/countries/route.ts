import { NextResponse } from 'next/server'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { PricingResolverService } from '@/services/pricing-resolver.service'
import { getCountryByIso } from '@/common/catalog'

const log = createLogger({ prefix: 'api-service-countries' })

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
    let prices: any[] = []
    try {
      const resolver = new PricingResolverService()
      prices = await resolver.resolvePricesForService(slug)
    } catch (err) {
      log.error('pricing_resolver_failed', { slug, error: err instanceof Error ? err.message : String(err) })
      // Fallback: return empty list if tables don't exist yet
      return NextResponse.json(
        { items: [], total: 0, nextCursor: null },
        { headers: { 'Cache-Control': 'private, max-age=30' } }
      )
    }

    const enriched = prices
      .map((row) => {
        const meta = getCountryByIso(row.countryIso)
        return {
          countryIso: row.countryIso,
          name: meta?.name ?? row.countryIso,
          icon: meta?.icon ?? null,
          priceCredits: row.priceCredits,
          availability: row.availability ?? 0,
          source: row.source,
        }
      })
      .sort((a, b) => a.priceCredits - b.priceCredits)

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
