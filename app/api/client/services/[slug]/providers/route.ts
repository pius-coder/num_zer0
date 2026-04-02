import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { priceRule, providerServiceCost, provider } from '@/database/schema'

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

    // Get price rules for this service (optionally filtered by country)
    const rulesQuery = db
      .select({
        countryIso: priceRule.countryIso,
        priceCredits: priceRule.priceCredits,
        floorCredits: priceRule.floorCredits,
        availability: priceRule.cachedAvailability,
      })
      .from(priceRule)
      .where(
        and(
          eq(priceRule.serviceSlug, slug),
          eq(priceRule.isActive, true),
          ...(countryIso ? [eq(priceRule.countryIso, countryIso)] : [])
        )
      )
      .orderBy(asc(priceRule.priceCredits))

    const rules = await rulesQuery

    if (rules.length === 0) {
      return NextResponse.json(
        { items: [], total: 0 },
        { headers: { 'Cache-Control': 'private, max-age=30' } }
      )
    }

    // Enrich with provider cost breakdown if a specific country is requested
    let providerBreakdown: Array<{
      providerId: string
      providerName: string
      costUsd: string
      availability: number
    }> = []

    if (countryIso) {
      const costs = await db
        .select({
          providerId: providerServiceCost.providerId,
          providerName: provider.name,
          costUsd: providerServiceCost.costUsd,
          availability: providerServiceCost.availability,
        })
        .from(providerServiceCost)
        .innerJoin(provider, eq(providerServiceCost.providerId, provider.id))
        .where(and(eq(providerServiceCost.countryCode, countryIso), eq(provider.isActive, true)))
        .orderBy(asc(providerServiceCost.costUsd))

      providerBreakdown = costs
    }

    log.info('service_providers_listed', {
      ...toAuditEntry(authed, 'list', 'providers', 'success'),
      serviceSlug: slug,
      countryIso: countryIso ?? 'all',
      count: rules.length,
    })

    return NextResponse.json(
      { items: rules, providers: providerBreakdown, total: rules.length },
      { headers: { 'Cache-Control': 'private, max-age=30' } }
    )
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
