import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { createLogger } from '@/common/logger'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { db } from '@/database'
import { smsActivation } from '@/database/schema'

const log = createLogger({ prefix: 'api-activations-history' })

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

    let activations: any[] = []
    try {
      activations = await db.query.smsActivation.findMany({
        where: (t, { eq }) => eq(t.userId, session.user.id),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit: 50,
        columns: {
          id: true,
          serviceSlug: true,
          countryCode: true,
          phoneNumber: true,
          smsCode: true,
          state: true,
          creditsCharged: true,
          createdAt: true,
          completedAt: true,
          cancelledAt: true,
        },
      })
    } catch {
      log.warn('sms_activation_table_missing', { msg: 'Table not found' })
    }

    log.info('activations_history_listed', {
      ...toAuditEntry(authed, 'list', 'activations', 'success'),
      count: activations.length,
    })

    return NextResponse.json(
      { items: activations, nextCursor: null, total: activations.length },
      { headers: { 'Cache-Control': 'private, max-age=5' } }
    )
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
