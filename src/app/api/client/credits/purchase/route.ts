import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/economics/api-auth'
import { PaymentPurchaseService } from '@/lib/economics/payment-purchase-service'

const payloadSchema = z.object({
  packageId: z.string().min(1),
  paymentMethod: z.enum(['mtn_momo', 'orange_money', 'card', 'bank_transfer', 'crypto']),
  idempotencyKey: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const payload = payloadSchema.parse(await request.json())

    const purchase = await PaymentPurchaseService.createPendingPurchase({
      userId: session.user.id,
      packageId: payload.packageId,
      paymentMethod: payload.paymentMethod,
      idempotencyKey: payload.idempotencyKey,
    })

    // Initiate real payment with Fapshi
    const fapshi = await PaymentPurchaseService.initiateFapshiPayment(purchase.id)

    return NextResponse.json({
      purchase,
      checkoutUrl: fapshi.link,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'purchase_create_failed' },
      { status: 400 }
    )
  }
}
