import { NextResponse } from 'next/server'
import { desc, eq, count, sql, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { requireAdminSession } from '@/common/auth/require-admin.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { priceRule } from '@/database/schema'
import { getServiceBySlug, getAllServices } from '@/common/catalog'

const log = createLogger({ prefix: 'api-admin-services' })

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
})

export async function GET(req: Request) {
  const ctx = extractRequestContext(req)

  try {
    const session = await requireAdminSession()
    const authed = withUser(ctx, session.user.id)

    const url = new URL(req.url)
    const { page, limit, search, category } = QuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
    })

    const offset = (page - 1) * limit

    // Aggregate price rule stats per service slug
    const stats = await db
      .select({
        serviceSlug: priceRule.serviceSlug,
        activeRules: count(),
        avgPriceCredits: sql<number>`ROUND(AVG(${priceRule.priceCredits}))`,
        minPriceCredits: sql<number>`MIN(${priceRule.priceCredits})`,
        maxPriceCredits: sql<number>`MAX(${priceRule.priceCredits})`,
        totalAvailability: sql<number>`SUM(${priceRule.cachedAvailability})`,
      })
      .from(priceRule)
      .where(eq(priceRule.isActive, true))
      .groupBy(priceRule.serviceSlug)

    const statsMap = new Map(stats.map((s) => [s.serviceSlug, s]))

    // Get all services from catalog, enrich with DB stats
    let allServices = getAllServices()

    // Apply search filter
    if (search && search.length > 0) {
      const q = search.toLowerCase()
      allServices = allServices.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.externalId.toLowerCase().includes(q)
      )
    }

    // Apply category filter
    if (category && category.length > 0) {
      allServices = allServices.filter((s) => s.category === category)
    }

    const total = allServices.length
    const paginated = allServices.slice(offset, offset + limit)

    const enriched = paginated.map((svc) => {
      const s = statsMap.get(svc.slug)
      return {
        slug: svc.slug,
        externalId: svc.externalId,
        name: svc.name,
        nameFr: svc.nameFr,
        category: svc.category,
        icon: svc.icon,
        activeRules: s?.activeRules ?? 0,
        avgPriceCredits: s ? Number(s.avgPriceCredits) : null,
        minPriceCredits: s ? Number(s.minPriceCredits) : null,
        maxPriceCredits: s ? Number(s.maxPriceCredits) : null,
        totalAvailability: s ? Number(s.totalAvailability) : 0,
        hasRules: (s?.activeRules ?? 0) > 0,
      }
    })

    log.info('admin_services_listed', {
      ...toAuditEntry(authed, 'list', 'services', 'success'),
      page,
      total,
    })

    return NextResponse.json(
      {
        data: enriched,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { headers: { 'Cache-Control': 'private, max-age=30' } }
    )
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
