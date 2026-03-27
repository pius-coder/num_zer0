import { NextResponse } from 'next/server'
import { PaymentPurchaseService } from '@/lib/economics/payment-purchase-service'
import { createLogger } from '@/lib/logger'

const log = createLogger({ prefix: 'webhook-credits' })

/**
 * Generic agnostic webhook for credit purchases.
 * In a real scenario, you would verify signatures here (Stripe-Signature, X-Pay-Signature, etc.)
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { purchaseId, status, gatewayId, paymentRef } = body

        if (!purchaseId) {
            return NextResponse.json({ error: 'missing_purchase_id' }, { status: 400 })
        }

        log.info('received_credit_webhook', { purchaseId, status, gatewayId })

        if (status === 'success') {
            // For the mock/agnostic flow, we might use purchaseId as paymentRef if not provided
            const ref = paymentRef || purchaseId
            await PaymentPurchaseService.confirmPurchaseFromWebhook(ref, gatewayId)
            return NextResponse.json({ processed: true })
        }

        if (status === 'failed') {
            await PaymentPurchaseService.markPurchaseFailed(purchaseId, body.reason || 'provider_reported_failure')
            return NextResponse.json({ processed: true })
        }

        return NextResponse.json({ error: 'unsupported_status' }, { status: 400 })
    } catch (error) {
        log.error('webhook_error', { error })
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'internal_error' },
            { status: 500 }
        )
    }
}
