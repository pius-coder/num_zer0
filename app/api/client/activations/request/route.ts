import { NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { ActivationService } from '@/services/activation.service'

const log = createLogger({ prefix: 'api-activation-request' })

const requestSchema = z.object({
  serviceCode: z.string().min(1),
  countryCode: z.string().min(1),
  holdTimeMinutes: z.number().int().min(1).max(60),
  idempotencyKey: z.string().min(1),
})

export async function POST(req: Request) {
  const ctx = extractRequestContext(req)

  try {
    const session = await requireSession()
    const authed = withUser(ctx, session.user.id)

    const key = getClientKey(session.user.id, req)
    const { allowed, retryAfterMs } = rateLimit(key, {
      max: 10,
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

    const body = requestSchema.parse(await req.json())

    const service = new ActivationService()
    const activation = await service.request({
      userId: session.user.id,
      ...body,
    })

    log.info('activation_requested', {
      ...toAuditEntry(authed, 'create', 'activation', 'success'),
      activationId: activation?.id,
      serviceCode: body.serviceCode,
      countryCode: body.countryCode,
    })

    return NextResponse.json(activation, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
