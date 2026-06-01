import { NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext } from '@/middleware/request-context'
import { createLogger } from '@/common/logger'
import { PaymentPurchaseService } from '@/services/payment-purchase.service'

const log = createLogger({ prefix: 'webhook-fapshi' })

const FapshiWebhookSchema = z.object({
  event: z.string(),
  transId: z.string(),
  externalId: z.string().optional(),
  amount: z.number().optional(),
  status: z.enum(['SUCCESSFUL', 'FAILED', 'EXPIRED']).optional(),
})

export async function POST(req: Request) {
  const ctx = extractRequestContext(req)

  try {
    const secret = req.headers.get('x-fapshi-key') ?? req.headers.get('x-internal-webhook-secret')
    const { env } = await import('@/config/env')
    // SECURITY: Only accept INTERNAL_API_SECRET for webhook authentication
    // FAPSHI_API_KEY should never be used as webhook secret (exposed to client)
    if (secret !== env.INTERNAL_API_SECRET) {
      log.warn('fapshi_webhook_unauthorized', { requestId: ctx.requestId })
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const input = FapshiWebhookSchema.parse(body)

    const purchaseService = new PaymentPurchaseService()

    if (input.event === 'successful' || input.status === 'SUCCESSFUL') {
      await purchaseService.confirmPurchaseFromWebhook(input.transId, input.transId)
      log.info('fapshi_payment_confirmed', {
        transId: input.transId,
        externalId: input.externalId,
        requestId: ctx.requestId,
      })
    }

    if (
      input.event === 'failed' ||
      input.event === 'expired' ||
      input.status === 'FAILED' ||
      input.status === 'EXPIRED'
    ) {
      if (input.externalId) {
        await purchaseService.markPurchaseFailed(
          input.externalId,
          `fapshi_${input.event ?? input.status ?? 'failed'}`
        )
      }
      log.warn('fapshi_payment_failed', {
        transId: input.transId,
        event: input.event,
        requestId: ctx.requestId,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
