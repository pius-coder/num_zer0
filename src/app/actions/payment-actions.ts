'use server'

import { PaymentPurchaseService } from '@/lib/economics/payment-purchase-service'
import { createLogger } from '@/lib/logger'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const log = createLogger({ prefix: 'payment-actions' })

/**
 * Verified a purchase from a redirect (e.g. Fapshi return URL)
 * This is "Active Checkout" pattern to supplement webhooks.
 */
export async function verifyFapshiPurchase(transId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error('unauthorized')
    }

    log.info('verifying_fapshi_purchase_from_redirect', { transId, userId: session.user.id })

    try {
        // We use the robust verifyAndSyncPurchase which handles both internal ID and Fapshi reference
        const purchase = await PaymentPurchaseService.verifyAndSyncPurchase(transId)

        return {
            success: true,
            purchaseId: purchase?.id,
            status: purchase?.status
        }
    } catch (error) {
        log.error('fapshi_redirect_verification_failed', {
            transId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        })
        return {
            success: false,
            error: error instanceof Error ? error.message : 'verification_failed'
        }
    }
}
