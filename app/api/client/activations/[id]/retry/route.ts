import { NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { ActivationService } from '@/services/activation.service'
import { db } from '@/database'
import { smsActivation } from '@/database/schema'

const log = createLogger({ prefix: 'api-activation-retry' })

const RetrySchema = z.object({
  holdTimeMinutes: z.number().int().min(1).max(60).default(10),
  idempotencyKey: z.string().min(1).max(128),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = extractRequestContext(req)
  const { id } = await params

  try {
    const session = await requireSession()
    const authed = withUser(ctx, session.user.id)

    const key = getClientKey(session.user.id, req)
    const { allowed, retryAfterMs } = rateLimit(key, {
      max: 5,
      windowMs: 60_000,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many retry requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      )
    }

    const input = RetrySchema.parse(await req.json())

    // Verify ownership and state of the original activation
    const original = await db.query.smsActivation.findFirst({
      where: eq(smsActivation.id, id),
    })

    if (!original || original.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'not_found', message: 'Activation not found' },
        { status: 404 }
      )
    }

    if (original.state === 'completed') {
      return NextResponse.json(
        { error: 'already_completed', message: 'Activation already completed' },
        { status: 409 }
      )
    }

    if (original.state === 'cancelled') {
      return NextResponse.json(
        {
          error: 'already_cancelled',
          message: 'Activation already cancelled',
        },
        { status: 409 }
      )
    }

    const activationService = new ActivationService()

    // Cancel the old activation first
    await activationService.cancelActivation(id)

    // Request a fresh one with the same service + country
    const newActivation = await activationService.request({
      userId: session.user.id,
      serviceCode: original.serviceSlug,
      countryCode: original.countryCode,
      holdTimeMinutes: input.holdTimeMinutes,
      idempotencyKey: input.idempotencyKey,
    })

    log.info('activation_retried', {
      ...toAuditEntry(authed, 'retry', 'activation', 'success'),
      oldActivationId: id,
      newActivationId: newActivation?.id,
      serviceCode: original.serviceSlug,
      countryCode: original.countryCode,
    })

    return NextResponse.json(newActivation, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
