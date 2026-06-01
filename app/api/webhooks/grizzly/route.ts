import { NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext } from '@/middleware/request-context'
import { createLogger } from '@/common/logger'
import { ActivationService } from '@/services/activation.service'
import { CreditLedgerService } from '@/services/credit-ledger.service'
import { db } from '@/database'
import { smsActivation, creditHold } from '@/database/schema'
import { eq, and } from 'drizzle-orm'

const log = createLogger({ prefix: 'webhook-grizzly' })

const GrizzlyWebhookSchema = z.object({
  activationId: z.number(),
  status: z.number(),
  phoneNumber: z.string().optional(),
  smsCode: z.string().optional(),
})

export async function POST(req: Request) {
  const ctx = extractRequestContext(req)

  try {
    const secret =
      req.headers.get('x-grizzly-secret') ?? req.headers.get('x-internal-webhook-secret')
    const { env } = await import('@/config/env')
    if (secret !== env.INTERNAL_API_SECRET) {
      log.warn('grizzly_webhook_unauthorized', { requestId: ctx.requestId })
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const input = GrizzlyWebhookSchema.parse(body)

    const activation = await db.query.smsActivation.findFirst({
      where: eq(smsActivation.providerActivationId, String(input.activationId)),
    })

    if (!activation) {
      log.warn('grizzly_webhook_activation_not_found', {
        providerActivationId: input.activationId,
      })
      return NextResponse.json({ ok: true })
    }

    const activationService = new ActivationService()
    const creditLedger = new CreditLedgerService()

    if ((input.status === 3 || input.status === 6) && input.smsCode) {
      await activationService.markSmsReceived(activation.id, input.smsCode)

      const hold = await db.query.creditHold.findFirst({
        where: and(eq(creditHold.activationId, activation.id), eq(creditHold.state, 'held')),
      })
      if (hold) {
        await creditLedger.confirmHoldDebit(hold.id)
      }

      log.info('grizzly_sms_received', {
        activationId: activation.id,
        requestId: ctx.requestId,
      })
    }

    if (input.status === 8 || input.status === -1) {
      await activationService.cancelActivation(activation.id)

      const hold = await db.query.creditHold.findFirst({
        where: and(eq(creditHold.activationId, activation.id), eq(creditHold.state, 'held')),
      })
      if (hold) {
        await creditLedger.releaseHold(hold.id)
      }

      log.info('grizzly_activation_cancelled', {
        activationId: activation.id,
        requestId: ctx.requestId,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
