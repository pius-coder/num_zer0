import { NextResponse } from 'next/server'
import { z } from 'zod'

import { PaymentPurchaseService } from '@/lib/economics/payment-purchase-service'
import { verifyInternalWebhookSecret } from '@/lib/economics/webhook-security'

const webhookSchema = z.object({
  paymentRef: z.string().min(1),
  gatewayId: z.string().optional(),
  status: z.enum(['success', 'failed']),
  reason: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-internal-webhook-secret')
    if (!verifyInternalWebhookSecret(secret)) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
    }

    const payload = webhookSchema.parse(await request.json())

    if (payload.status === 'success') {
      const purchase = await PaymentPurchaseService.confirmPurchaseFromWebhook(
        payload.paymentRef,
        payload.gatewayId
      )
      return NextResponse.json({ ok: true, purchase })
    }

    return NextResponse.json({ ok: false, reason: payload.reason ?? 'payment_failed' }, { status: 202 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'orange_webhook_failed' },
      { status: 400 }
    )
  }
}
