import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { smsActivation } from '@/database/schema'
import { ActivationService } from '@/services/activation.service'

const log = createLogger({ prefix: 'api-activation-detail' })
const activationService = new ActivationService()

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params

    // 1. Trigger live sync with Grizzly if still waiting for code
    try {
      await activationService.checkSmsStatus(id)
    } catch (syncErr) {
      log.warn('activation_sync_failed', { id, error: String(syncErr) })
    }

    // 2. Read latest data from DB
    const activation = await db.query.smsActivation.findFirst({
      where: eq(smsActivation.id, id),
      columns: {
        id: true,
        userId: true,
        serviceSlug: true,
        countryCode: true,
        phoneNumber: true,
        smsCode: true,
        state: true,
        creditsCharged: true,
        createdAt: true,
        completedAt: true,
        cancelledAt: true,
        expiredAt: true,
        numberAssignedAt: true,
        smsReceivedAt: true,
        failureReason: true,
        retryCount: true,
        providerId: false,
        providerActivationId: false,
        wholesaleCostUsd: false,
        maxPriceSentUsd: false,
        marginRatio: false,
        providerResponseRaw: false,
        timerExpiresAt: true,
        refundedAt: false,
        updatedAt: false,
        requestedCountryIso: false,
        fullSmsText: false,
        canGetAnotherSms: false,
      },
    })

    if (!activation || activation.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'not_found', message: 'Activation not found' },
        { status: 404 }
      )
    }

    log.info('activation_read', {
      ...toAuditEntry(authed, 'read', 'activation', 'success'),
      activationId: id,
    })

    return NextResponse.json(activation, {
      headers: { 'Cache-Control': 'private, max-age=5' },
    })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
