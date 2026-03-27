import { and, eq } from 'drizzle-orm'

import { db } from '@/database'
import { creditPackage, creditPurchase } from '@/database/schema'
import { createLogger } from '@/lib/logger'
import { createFapshiClientFromEnv } from '@/lib/fapshi'
import { CreditLedgerService } from './credit-ledger-service'

const log = createLogger({ prefix: 'payment-purchase' })

export interface CreatePurchaseInput {
  userId: string
  packageId: string
  paymentMethod: 'mtn_momo' | 'orange_money' | 'card' | 'bank_transfer' | 'crypto'
  idempotencyKey: string
}

export class PaymentPurchaseService {
  static async createPendingPurchase(input: CreatePurchaseInput) {
    const existing = await db.query.creditPurchase.findFirst({
      where: eq(creditPurchase.idempotencyKey, input.idempotencyKey),
    })
    if (existing) {
      return existing
    }

    const pack = await db.query.creditPackage.findFirst({
      where: and(eq(creditPackage.id, input.packageId), eq(creditPackage.isActive, true)),
    })
    if (!pack) {
      throw new Error('credit_package_not_found')
    }

    const creditsBonus = Math.floor((pack.credits * pack.bonusPct) / 100)
    const totalCredits = pack.credits + creditsBonus
    const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const [created] = await db
      .insert(creditPurchase)
      .values({
        id: purchaseId,
        userId: input.userId,
        packageId: pack.id,
        creditsBase: pack.credits,
        creditsBonus,
        totalCredits,
        priceXaf: pack.priceXaf,
        paymentMethod: input.paymentMethod,
        status: 'payment_pending',
        paymentRef: purchaseId, // Use internal ID as ref by default
        idempotencyKey: input.idempotencyKey,
      })
      .returning()

    return created
  }

  static async initiateFapshiPayment(purchaseId: string) {
    const purchase = await db.query.creditPurchase.findFirst({
      where: eq(creditPurchase.id, purchaseId),
    })

    if (!purchase) {
      throw new Error('purchase_not_found')
    }

    const { env } = await import('@/config/env')
    const { getEconomicsConfigString } = await import('./config-service')
    const fapshi = createFapshiClientFromEnv()
    const confirmationEmail = await getEconomicsConfigString('fapshi_confirmation_email')

    const response = await fapshi.initiatePay({
      amount: purchase.priceXaf,
      email: confirmationEmail || 'myuser@email.com',
      externalId: purchase.id,
      userId: purchase.userId,
      redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/wallet?idempotencyId=${purchase.idempotencyKey}`, // Redirect back with ID
      message: `Recharge de ${purchase.totalCredits} crédits sur NumZero`,
    })

    // Update purchase with Fapshi transaction ID and link
    await db
      .update(creditPurchase)
      .set({
        paymentRef: response.transId,
        checkoutUrl: response.link,
        updatedAt: new Date(),
      })
      .where(eq(creditPurchase.id, purchaseId))

    log.info('fapshi_payment_initiated', { purchaseId, transId: response.transId })

    return {
      link: response.link,
      transId: response.transId,
    }
  }

  static async verifyAndSyncPurchase(identifier: string, gatewayId?: string) {
    const { or } = await import('drizzle-orm')
    const purchase = await db.query.creditPurchase.findFirst({
      where: or(
        eq(creditPurchase.id, identifier),
        eq(creditPurchase.paymentRef, identifier),
        eq(creditPurchase.idempotencyKey, identifier)
      ),
    })

    if (!purchase) {
      log.error('purchase_not_found_for_verification', { identifier })
      throw new Error('purchase_not_found')
    }

    if (purchase.status === 'credited') {
      return purchase
    }

    // Get the actual reference for Fapshi API
    const paymentRef = purchase.paymentRef
    if (!paymentRef) {
      log.error('payment_ref_missing_for_verification', { purchaseId: purchase.id })
      throw new Error('payment_ref_missing')
    }

    // BANKING LEVEL: Verify status with Fapshi API before crediting
    const fapshi = createFapshiClientFromEnv()
    const fapshiStatus = await fapshi.paymentStatus(paymentRef)

    if (fapshiStatus.status !== 'SUCCESSFUL') {
      log.warn('fapshi_verification_failed', {
        purchaseId: purchase.id,
        paymentRef,
        status: fapshiStatus.status,
      })
      throw new Error(`fapshi_payment_not_successful: ${fapshiStatus.status}`)
    }

    await db
      .update(creditPurchase)
      .set({
        status: 'confirmed',
        paymentGatewayId: gatewayId ?? purchase.paymentGatewayId,
        updatedAt: new Date(),
      })
      .where(eq(creditPurchase.id, purchase.id))

    await CreditLedgerService.creditPurchaseLots(purchase.id)

    const credited = await db.query.creditPurchase.findFirst({
      where: eq(creditPurchase.id, purchase.id),
    })

    log.info('purchase_confirmed_and_credited', {
      purchaseId: purchase.id,
      paymentRef,
      gatewayId,
    })

    return credited
  }

  static async confirmPurchaseFromWebhook(paymentRef: string, gatewayId?: string) {
    return this.verifyAndSyncPurchase(paymentRef, gatewayId)
  }

  static async markPurchaseFailed(purchaseId: string, reason: string) {
    await db
      .update(creditPurchase)
      .set({
        status: 'failed',
        failedAt: new Date(),
        failureReason: reason,
      })
      .where(eq(creditPurchase.id, purchaseId))
  }
}
