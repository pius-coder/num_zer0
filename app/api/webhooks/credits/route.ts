import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { PaymentPurchaseService } from '@/services/payment-purchase.service'
import { CreditLedgerService } from '@/services/credit-ledger.service'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { createLogger } from '@/common/logger'

const log = createLogger({ prefix: 'webhook-credits' })
const purchaseService = new PaymentPurchaseService()
const ledgerService = new CreditLedgerService()

function verifyWebhookSecret(providedSecret: string | null): boolean {
  const expected = process.env.INTERNAL_API_SECRET ?? ''
  if (!providedSecret || !expected) return false
  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedSecret, 'utf8'),
      Buffer.from(expected, 'utf8')
    )
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const ctx = extractRequestContext(req)

  try {
    const key = getClientKey(undefined, req)
    const { allowed, retryAfterMs } = rateLimit(key, { max: 30, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
          },
        }
      )
    }

    const secret = req.headers.get('x-internal-webhook-secret')
    if (!verifyWebhookSecret(secret)) {
      log.warn('webhook_unauthorized', { hasSecret: !!secret })
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { transId, status, amount } = body

    if (!transId || !status) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (status === 'SUCCESSFUL') {
      const verifyResult = await purchaseService.verifyAndSyncPurchase(transId)

      if (verifyResult.success && verifyResult.purchase) {
        const purchase = verifyResult.purchase

        const creditResult = await ledgerService.creditWallet({
          userId: purchase.userId,
          creditsBase: purchase.creditsBase,
          creditsBonus: purchase.creditsBonus,
          purchaseId: purchase.id,
        })

        if (!creditResult.alreadyCredited) {
          await purchaseService.confirmPurchaseAndCredit(transId)
        }

        const audit = toAuditEntry(ctx, 'webhook', 'fapshi_payment', 'success')
        log.info('fapshi_webhook_processed', { ...audit, transId, amount })
      }
    } else if (status === 'FAILED' || status === 'EXPIRED') {
      await purchaseService.verifyAndSyncPurchase(transId)
      log.info('fapshi_webhook_non_successful', { transId, status, amount })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
