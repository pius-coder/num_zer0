import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { creditPackage } from '@/database/schema'

const log = createLogger({ prefix: 'api-credits-packages' })

export async function GET(req: Request) {
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

    let packages: any[] = []
    try {
      packages = await db
        .select({
          id: creditPackage.id,
          slug: creditPackage.slug,
          name: creditPackage.nameFr,
          credits: creditPackage.credits,
          priceXaf: creditPackage.priceXaf,
          bonusPct: creditPackage.bonusPct,
          label: creditPackage.label,
          sortOrder: creditPackage.sortOrder,
        })
        .from(creditPackage)
        .where(eq(creditPackage.isActive, true))
    } catch {
      log.warn('credit_package_table_missing', { msg: 'Table not found or migration not applied' })
    }

    log.info('packages_listed', {
      ...toAuditEntry(authed, 'list', 'packages', 'success'),
      count: packages.length,
    })

    return NextResponse.json(packages, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    })

    return NextResponse.json(packages, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
