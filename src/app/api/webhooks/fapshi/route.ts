import { NextResponse } from 'next/server'
import { PaymentPurchaseService } from '@/lib/economics/payment-purchase-service'
import { createLogger } from '@/lib/logger'

const log = createLogger({ prefix: 'webhook-fapshi' })

/**
 * Fapshi Webhook Handler
 * 
 * BANKING LEVEL: 
 * 1. We receive the transId from Fapshi.
 * 2. We do NOT trust the body's success/fail message.
 * 3. We use the transId to call Fapshi's Status API in PaymentPurchaseService.
 * 4. Only if the Status API returns SUCCESSFUL do we credit the user.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { transId, userId, amount, email, externalId } = body

        if (!transId) {
            log.error('webhook_missing_transId', { body })
            return NextResponse.json({ error: 'missing_transId' }, { status: 400 })
        }

        log.info('received_fapshi_webhook', { transId, externalId, amount })

        // Call service to confirm and verify status with Fapshi API
        // PaymentPurchaseService.confirmPurchaseFromWebhook internally handles 
        // the API verification (Fetch-to-Verify)
        await PaymentPurchaseService.confirmPurchaseFromWebhook(transId)

        return NextResponse.json({ processed: true })
    } catch (error) {
        log.error('webhook_error', { error: error instanceof Error ? error.message : error })
        // We return 200 even on error to stop Fapshi from retrying indefinitely 
        // if the error is internal, but we log it for audit.
        // However, if we want retries, we should return 500.
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'internal_error' },
            { status: 500 }
        )
    }
}
