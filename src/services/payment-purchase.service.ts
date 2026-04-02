import { and, eq, or } from 'drizzle-orm'

import { BaseService } from './base.service'
import { creditPackage, creditPurchase } from '@/database/schema'
import { getFapshiClient } from './fapshi'

export interface CreatePurchaseInput {
  userId: string
  packageId: string
  paymentMethod: 'mtn_momo' | 'orange_money' | 'card' | 'bank_transfer' | 'crypto'
  idempotencyKey: string
}

export class PaymentPurchaseService extends BaseService {
  constructor() {
    super({ prefix: 'payment-purchase', db: true })
  }

  async createPendingPurchase(input: CreatePurchaseInput) {
    const existing = await this.db.query.creditPurchase.findFirst({
      where: eq(creditPurchase.idempotencyKey, input.idempotencyKey),
    })
    if (existing) return existing

    const pack = await this.db.query.creditPackage.findFirst({
      where: and(eq(creditPackage.id, input.packageId), eq(creditPackage.isActive, true)),
    })
    this.assert(!!pack, 'purchase_not_found', 'Credit package not found', {
      packageId: input.packageId,
    })

    const creditsBonus = Math.floor((pack!.credits * pack!.bonusPct) / 100)
    const totalCredits = pack!.credits + creditsBonus
    const purchaseId = this.generateId('purchase')

    const [created] = await this.db
      .insert(creditPurchase)
      .values({
        id: purchaseId,
        userId: input.userId,
        packageId: pack!.id,
        creditsBase: pack!.credits,
        creditsBonus,
        totalCredits,
        priceXaf: pack!.priceXaf,
        paymentMethod: input.paymentMethod,
        status: 'payment_pending',
        paymentRef: purchaseId,
        idempotencyKey: input.idempotencyKey,
      })
      .returning()

    return created
  }

  async initiateFapshiPayment(purchaseId: string) {
    const purchase = await this.db.query.creditPurchase.findFirst({
      where: eq(creditPurchase.id, purchaseId),
    })
    this.assert(!!purchase, 'purchase_not_found', 'Purchase not found', { purchaseId })
    this.assert(
      purchase!.status === 'payment_pending',
      'payment_not_initiated',
      'Purchase is not in pending state',
      { purchaseId, status: purchase!.status }
    )

    const fapshi = getFapshiClient()
    const result = await fapshi.generateLink({
      amount: purchase!.priceXaf,
      userId: purchase!.userId ?? undefined,
      externalId: purchase!.idempotencyKey ?? undefined,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?transId=${purchaseId}`,
    })

    await this.db
      .update(creditPurchase)
      .set({
        checkoutUrl: result.link,
        paymentGatewayId: result.transId,
      })
      .where(eq(creditPurchase.id, purchaseId))

    this.log.info('fapshi_payment_initiated', {
      purchaseId,
      transId: result.transId,
    })

    return {
      link: result.link,
      transId: result.transId,
    }
  }

  async verifyAndSyncPurchase(identifier: string, gatewayId?: string) {
    const purchase = await this.db.query.creditPurchase.findFirst({
      where: or(
        eq(creditPurchase.id, identifier),
        eq(creditPurchase.paymentRef, identifier),
        eq(creditPurchase.idempotencyKey, identifier)
      ),
    })

    this.assert(!!purchase, 'purchase_not_found', 'Purchase not found', { identifier })
    this.assert(
      purchase!.status !== 'credited',
      'purchase_already_credited',
      'Purchase already credited',
      { purchaseId: purchase.id }
    )

    const fapshi = getFapshiClient()
    const fapshiTx = await fapshi.getStatus(purchase!.paymentGatewayId ?? identifier)

    if (fapshiTx.status !== 'SUCCESSFUL') {
      await this.db
        .update(creditPurchase)
        .set({
          status: fapshiTx.status === 'FAILED' ? 'failed' : 'payment_pending',
          failedAt: fapshiTx.status === 'FAILED' ? new Date() : undefined,
          failureReason: fapshiTx.status === 'FAILED' ? 'Payment failed on Fapshi' : undefined,
        })
        .where(eq(creditPurchase.id, purchase.id))

      this.log.warn('fapshi_payment_not_successful', {
        purchaseId: purchase.id,
        fapshiStatus: fapshiTx.status,
      })

      return { success: false, status: fapshiTx.status }
    }

    await this.db
      .update(creditPurchase)
      .set({
        status: 'confirmed',
      })
      .where(eq(creditPurchase.id, purchase.id))

    this.log.info('fapshi_payment_verified', { purchaseId: purchase.id })

    return { success: true, purchase }
  }

  async confirmPurchaseAndCredit(purchaseId: string) {
    const purchase = await this.db.query.creditPurchase.findFirst({
      where: eq(creditPurchase.id, purchaseId),
    })

    this.assert(!!purchase, 'purchase_not_found', 'Purchase not found', { purchaseId })
    this.assert(
      purchase!.status === 'confirmed',
      'purchase_not_confirmed',
      'Purchase not yet confirmed by payment gateway',
      { purchaseId, status: purchase!.status }
    )

    const creditedAt = new Date()

    await this.db
      .update(creditPurchase)
      .set({
        status: 'credited',
        creditedAt,
      })
      .where(eq(creditPurchase.id, purchaseId))

    this.log.info('purchase_credited', { purchaseId, totalCredits: purchase!.totalCredits })

    return { success: true, creditedAt }
  }

  async confirmPurchaseFromWebhook(paymentRef: string, gatewayId?: string) {
    this.log.info('webhook_confirm_started', { paymentRef })
    return this.verifyAndSyncPurchase(paymentRef, gatewayId)
  }

  async markPurchaseFailed(purchaseId: string, reason: string) {
    await this.db
      .update(creditPurchase)
      .set({ status: 'failed', failedAt: new Date(), failureReason: reason })
      .where(eq(creditPurchase.id, purchaseId))
    this.log.warn('purchase_marked_failed', { purchaseId, reason })
  }
}
