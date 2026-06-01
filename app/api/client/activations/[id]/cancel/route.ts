import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { ActivationService } from '@/services/activation.service'
import { db } from '@/database'
import { smsActivation } from '@/database/schema'

const log = createLogger({ prefix: 'api-activation-cancel' })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = extractRequestContext(req)

  try {
    const session = await requireSession()
    const authed = withUser(ctx, session.user.id)

    const key = getClientKey(session.user.id, req)
    const { allowed, retryAfterMs } = rateLimit(key, {
      max: 15,
      windowMs: 60_000,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      )
    }

    const { id } = await params

    // Verify ownership before cancelling
    const existing = await db.query.smsActivation.findFirst({
      where: eq(smsActivation.id, id),
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'not_found', message: 'Activation not found' },
        { status: 404 }
      )
    }

    const service = new ActivationService()
    const result = await service.cancelActivation(id)

    log.info('activation_cancelled', {
      ...toAuditEntry(authed, 'cancel', 'activation', 'success'),
      activationId: id,
    })

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
