import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { creditTransaction } from '@/database/schema'

const log = createLogger({ prefix: 'api-credits-history' })

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

    const transactions = await db
      .select({
        id: creditTransaction.id,
        type: creditTransaction.type,
        creditType: creditTransaction.creditType,
        amount: creditTransaction.amount,
        balanceAfter: creditTransaction.balanceAfter,
        description: creditTransaction.description,
        createdAt: creditTransaction.createdAt,
      })
      .from(creditTransaction)
      .where(eq(creditTransaction.userId, session.user.id))
      .orderBy(desc(creditTransaction.createdAt))
      .limit(50)

    log.info('transactions_listed', {
      ...toAuditEntry(authed, 'list', 'transactions', 'success'),
      count: transactions.length,
    })

    return NextResponse.json(
      { items: transactions, nextCursor: null, total: transactions.length },
      { headers: { 'Cache-Control': 'private, max-age=10' } }
    )
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
