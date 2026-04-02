'use server'

import { and, eq } from 'drizzle-orm'
import { PaymentPurchaseService } from '@/services/payment-purchase.service'
import { CreditLedgerService } from '@/services/credit-ledger.service'
import { auth } from '@/common/auth'
import { headers } from 'next/headers'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { creditPurchase } from '@/database/schema'

const log = createLogger({ prefix: 'payment-action' })
const purchaseService = new PaymentPurchaseService()
const ledgerService = new CreditLedgerService()

export interface VerifyPurchaseResult {
  success: boolean
  purchaseId?: string
  status?: string
  error?: string
}

export async function verifyFapshiPurchaseAction(transId: string): Promise<VerifyPurchaseResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    log.warn('verify_fapshi_unauthorized', { transId })
    return { success: false, error: 'unauthorized' }
  }

  log.info('verify_fapshi_purchase_started', {
    transId,
    userId: session.user.id,
  })

  try {
    const verifyResult = await purchaseService.verifyAndSyncPurchase(transId)

    if (!verifyResult.success) {
      log.warn('verify_fapshi_not_successful', {
        transId,
        status: verifyResult.status,
      })
      return {
        success: false,
        ...(verifyResult.status && { status: verifyResult.status }),
      }
    }

    const purchase = verifyResult.purchase
    if (!purchase) {
      return { success: false, error: 'purchase_not_found' }
    }

    // SECURITY: Verify ownership - only the purchase owner can trigger credit
    if (purchase.userId !== session.user.id) {
      log.warn('verify_fapshi_forbidden', {
        transId,
        purchaseUserId: purchase.userId,
        sessionUserId: session.user.id,
      })
      return { success: false, error: 'forbidden' }
    }

    await ledgerService.creditWallet({
      userId: purchase.userId,
      creditsBase: purchase.creditsBase,
      creditsBonus: purchase.creditsBonus,
      purchaseId: purchase.id,
    })

    await purchaseService.confirmPurchaseAndCredit(transId)

    log.info('verify_fapshi_purchase_complete', {
      transId,
      purchaseId: purchase.id,
      userId: session.user.id,
    })

    return {
      success: true,
      purchaseId: purchase.id,
      status: 'credited',
    }
  } catch (error) {
    log.error('verify_fapshi_purchase_failed', {
      transId,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'verification_failed',
    }
  }
}

export interface CancelPurchaseResult {
  success: boolean
  error?: string
}

export async function cancelPendingPurchaseAction(
  purchaseId: string
): Promise<CancelPurchaseResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    log.warn('cancel_purchase_unauthorized', { purchaseId })
    return { success: false, error: 'unauthorized' }
  }

  log.info('cancel_purchase_started', { purchaseId, userId: session.user.id })

  try {
    const purchase = await db.query.creditPurchase.findFirst({
      where: and(eq(creditPurchase.id, purchaseId), eq(creditPurchase.userId, session.user.id)),
    })

    if (!purchase) {
      return { success: false, error: 'purchase_not_found' }
    }

    if (purchase.status === 'credited') {
      return { success: false, error: 'purchase_already_credited' }
    }

    await db
      .update(creditPurchase)
      .set({
        status: 'failed',
        failedAt: new Date(),
        failureReason: 'Cancelled by user',
      })
      .where(eq(creditPurchase.id, purchaseId))

    log.info('cancel_purchase_complete', {
      purchaseId,
      userId: session.user.id,
    })

    return { success: true }
  } catch (error) {
    log.error('cancel_purchase_failed', {
      purchaseId,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'cancel_failed',
    }
  }
}
