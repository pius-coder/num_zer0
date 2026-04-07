import { NextResponse } from 'next/server'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { PricingResolverService } from '@/services/pricing-resolver.service'

const log = createLogger({ prefix: 'api-service-providers' })

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

    const url = new URL(req.url)
    const countryIso = url.searchParams.get('country')

    const resolver = new PricingResolverService()

    if (countryIso) {
      // Single country price lookup
      try {
        const price = await resolver.resolvePrice(slug, countryIso)
        log.info('service_providers_listed', {
          ...toAuditEntry(authed, 'list', 'providers', 'success'),
          serviceSlug: slug,
          countryIso,
          count: 1,
        })
        return NextResponse.json(
          { items: [price], total: 1 },
          { headers: { 'Cache-Control': 'private, max-age=30' } }
        )
      } catch {
        return NextResponse.json(
          { items: [], total: 0 },
          { headers: { 'Cache-Control': 'private, max-age=30' } }
        )
      }
    }

    // All countries for this service
    const prices = await resolver.resolvePricesForService(slug)
    prices.sort((a, b) => a.priceCredits - b.priceCredits)

    log.info('service_providers_listed', {
      ...toAuditEntry(authed, 'list', 'providers', 'success'),
      serviceSlug: slug,
      countryIso: 'all',
      count: prices.length,
    })

    return NextResponse.json(
      { items: prices, total: prices.length },
      { headers: { 'Cache-Control': 'private, max-age=30' } }
    )
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
