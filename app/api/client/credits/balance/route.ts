import { NextResponse } from 'next/server'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { CreditLedgerService } from '@/services/credit-ledger.service'

const log = createLogger({ prefix: 'api-credits-balance' })

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

    const service = new CreditLedgerService()
    const balance = await service.getBalance(session.user.id)

    log.info('balance_read', {
      ...toAuditEntry(authed, 'read', 'balance', 'success'),
    })

    return NextResponse.json(balance, {
      headers: { 'Cache-Control': 'private, max-age=10' },
    })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
