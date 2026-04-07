import { NextResponse } from 'next/server'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireAdminSession } from '@/common/auth/require-admin.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { priceOverride } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { getAllCountries } from '@/common/catalog'
import { getGrizzlyClient } from '@/services/grizzly'

const log = createLogger({ prefix: 'api-admin-countries' })

export async function GET(req: Request) {
  const ctx = extractRequestContext(req)

  try {
    const session = await requireAdminSession()
    const authed = withUser(ctx, session.user.id)

    const key = getClientKey(session.user.id, req)
    const { allowed, retryAfterMs } = rateLimit(key)
    if (!allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const url = new URL(req.url)
    const q = url.searchParams.get('q')?.toLowerCase()
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '50')))
    const hasOverrideFilter = url.searchParams.get('hasOverride')

    // Get all overrides from DB
    const overrides = await db
      .select({
        countryIso: priceOverride.countryIso,
        serviceSlug: priceOverride.serviceSlug,
        priceCredits: priceOverride.priceCredits,
      })
      .from(priceOverride)

    const overrideCountries = new Set(overrides.map((o) => o.countryIso))

    // Get all countries from static registry
    const allCountries = getAllCountries()

    // Get Grizzly countries for live data
    let grizzlyCountryIds = new Set<string>()
    try {
      const grizzly = getGrizzlyClient()
      const grizzlyCountries = await grizzly.getCountries()
      grizzlyCountryIds = new Set(grizzlyCountries.map((c) => String(c.id)))
    } catch {
      log.warn('grizzly_countries_fetch_failed', {})
    }

    // Build response list
    let items = allCountries.map((c) => ({
      countryIso: c.externalId,
      name: c.name,
      icon: c.icon ?? null,
      hasOverride: overrideCountries.has(c.externalId),
      overrideCount: overrides.filter((o) => o.countryIso === c.externalId).length,
      inGrizzly: grizzlyCountryIds.has(c.externalId),
    }))

    // Search filter
    if (q) {
      items = items.filter((item) => item.name.toLowerCase().includes(q))
    }

    // Override filter
    if (hasOverrideFilter === 'true') {
      items = items.filter((item) => item.hasOverride)
    } else if (hasOverrideFilter === 'false') {
      items = items.filter((item) => !item.hasOverride)
    }

    const total = items.length
    const start = (page - 1) * pageSize
    const paged = items.slice(start, start + pageSize)

    log.info('admin_countries_listed', {
      ...toAuditEntry(authed, 'list', 'countries', 'success'),
      total,
      page,
    })

    return NextResponse.json(
      { items: paged, total, page, pageSize },
      { headers: { 'Cache-Control': 'private, max-age=10' } }
    )
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
