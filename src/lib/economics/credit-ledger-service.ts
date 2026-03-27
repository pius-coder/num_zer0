import { and, asc, eq, gt, isNull, or, sql } from 'drizzle-orm'

import { db } from '@/database'
import {
  creditWallet,
  creditLot,
  creditPurchase,
  creditTransaction,
  creditHold,
} from '@/database/schema'
import { createLogger } from '@/lib/logger'
import { getEconomicsRuntime } from './report-economics-model'

const log = createLogger({ prefix: 'credit-ledger' })

export type CreditType = 'base' | 'bonus' | 'promotional'
export const CREDIT_SPEND_ORDER: CreditType[] = ['promotional', 'bonus', 'base']

const nowPlusMinutes = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000)
const nowPlusDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)

export class CreditLedgerService {
  static async getOrCreateWallet(userId: string) {
    const existing = await db.query.creditWallet.findFirst({
      where: eq(creditWallet.userId, userId),
    })
    if (existing) {
      return existing
    }

    const [created] = await db
      .insert(creditWallet)
      .values({
        id: `wallet_${userId}`,
        userId,
      })
      .returning()

    return created
  }

  static async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId)
    return {
      base: wallet.baseBalance,
      bonus: wallet.bonusBalance,
      promotional: wallet.promoBalance,
      total: wallet.baseBalance + wallet.bonusBalance + wallet.promoBalance,
    }
  }

  static async creditPurchaseLots(purchaseId: string) {
    const purchase = await db.query.creditPurchase.findFirst({
      where: eq(creditPurchase.id, purchaseId),
    })
    if (!purchase) {
      throw new Error('purchase_not_found')
    }
    if (purchase.status === 'credited') {
      return
    }
    if (purchase.status !== 'confirmed') {
      throw new Error('purchase_not_confirmed')
    }

    const runtime = await getEconomicsRuntime()
    const wallet = await this.getOrCreateWallet(purchase.userId)

    await db.transaction(async (tx) => {
      const existingTxns = await tx
        .select({ id: creditTransaction.id })
        .from(creditTransaction)
        .where(eq(creditTransaction.purchaseId, purchase.id))
      if (existingTxns.length > 0) {
        return
      }

      const baseLotId = `lot_base_${purchase.id}`
      await tx.insert(creditLot).values({
        id: baseLotId,
        walletId: wallet.id,
        creditType: 'base',
        initialAmount: purchase.creditsBase,
        remainingAmount: purchase.creditsBase,
      })

      if (purchase.creditsBonus > 0) {
        const bonusLotId = `lot_bonus_${purchase.id}`
        await tx.insert(creditLot).values({
          id: bonusLotId,
          walletId: wallet.id,
          creditType: 'bonus',
          initialAmount: purchase.creditsBonus,
          remainingAmount: purchase.creditsBonus,
          expiresAt: nowPlusDays(runtime.bonusExpiryDays),
        })
      }

      await tx
        .update(creditWallet)
        .set({
          baseBalance: sql`${creditWallet.baseBalance} + ${purchase.creditsBase}`,
          bonusBalance: sql`${creditWallet.bonusBalance} + ${purchase.creditsBonus}`,
          totalPurchased: sql`${creditWallet.totalPurchased} + ${purchase.totalCredits}`,
        })
        .where(eq(creditWallet.id, wallet.id))

      await tx.insert(creditTransaction).values({
        id: `txn_purchase_${purchase.id}`,
        userId: purchase.userId,
        walletId: wallet.id,
        type: 'purchase',
        creditType: 'base',
        amount: purchase.creditsBase,
        balanceAfter: wallet.baseBalance + wallet.bonusBalance + wallet.promoBalance + purchase.totalCredits,
        purchaseId: purchase.id,
        description: 'Credit purchase credited',
      })

      await tx
        .update(creditPurchase)
        .set({
          status: 'credited',
          creditedAt: new Date(),
        })
        .where(eq(creditPurchase.id, purchase.id))
    })
  }

  static async holdCredits(params: {
    userId: string
    amount: number
    holdTimeMinutes: number
    activationId?: string
    idempotencyKey: string
  }) {
    const wallet = await this.getOrCreateWallet(params.userId)

    const existingHold = await db.query.creditHold.findFirst({
      where: eq(creditHold.idempotencyKey, params.idempotencyKey),
    })
    if (existingHold) {
      return existingHold
    }

    const lots = await db
      .select()
      .from(creditLot)
      .where(
        and(
          eq(creditLot.walletId, wallet.id),
          gt(creditLot.remainingAmount, 0),
          eq(creditLot.isExpired, false),
          or(isNull(creditLot.expiresAt), gt(creditLot.expiresAt, new Date()))
        )
      )
      .orderBy(
        sql`CASE ${creditLot.creditType}
          WHEN 'promotional' THEN 1
          WHEN 'bonus' THEN 2
          WHEN 'base' THEN 3
        END`,
        asc(creditLot.expiresAt)
      )

    const selected = lots.find((lot) => lot.remainingAmount >= params.amount)
    if (!selected) {
      throw new Error('insufficient_credits')
    }

    const holdId = `hold_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await db.transaction(async (tx) => {
      await tx
        .update(creditLot)
        .set({
          remainingAmount: sql`${creditLot.remainingAmount} - ${params.amount}`,
        })
        .where(eq(creditLot.id, selected.id))

      await tx
        .update(creditWallet)
        .set({
          ...(selected.creditType === 'base'
            ? { baseBalance: sql`${creditWallet.baseBalance} - ${params.amount}` }
            : selected.creditType === 'bonus'
              ? { bonusBalance: sql`${creditWallet.bonusBalance} - ${params.amount}` }
              : { promoBalance: sql`${creditWallet.promoBalance} - ${params.amount}` }),
        })
        .where(eq(creditWallet.id, wallet.id))

      await tx.insert(creditHold).values({
        id: holdId,
        userId: params.userId,
        walletId: wallet.id,
        activationId: params.activationId,
        amount: params.amount,
        creditType: selected.creditType,
        lotId: selected.id,
        state: 'held',
        expiresAt: nowPlusMinutes(params.holdTimeMinutes),
        idempotencyKey: params.idempotencyKey,
      })
    })

    log.info('credits_held', {
      userId: params.userId,
      holdId,
      amount: params.amount,
      creditType: selected.creditType,
    })

    return db.query.creditHold.findFirst({ where: eq(creditHold.id, holdId) })
  }

  static async confirmHoldDebit(holdId: string) {
    const hold = await db.query.creditHold.findFirst({
      where: eq(creditHold.id, holdId),
    })
    if (!hold || hold.state !== 'held') {
      throw new Error('hold_not_debitable')
    }

    await db
      .update(creditHold)
      .set({
        state: 'debited',
        debitedAt: new Date(),
      })
      .where(eq(creditHold.id, holdId))

    return db.query.creditHold.findFirst({ where: eq(creditHold.id, holdId) })
  }

  static async releaseHold(holdId: string) {
    const hold = await db.query.creditHold.findFirst({
      where: eq(creditHold.id, holdId),
    })
    if (!hold || hold.state !== 'held') {
      return
    }

    await db.transaction(async (tx) => {
      await tx
        .update(creditLot)
        .set({
          remainingAmount: sql`${creditLot.remainingAmount} + ${hold.amount}`,
        })
        .where(eq(creditLot.id, hold.lotId))

      await tx
        .update(creditWallet)
        .set({
          ...(hold.creditType === 'base'
            ? { baseBalance: sql`${creditWallet.baseBalance} + ${hold.amount}` }
            : hold.creditType === 'bonus'
              ? { bonusBalance: sql`${creditWallet.bonusBalance} + ${hold.amount}` }
              : { promoBalance: sql`${creditWallet.promoBalance} + ${hold.amount}` }),
        })
        .where(eq(creditWallet.id, hold.walletId))

      await tx
        .update(creditHold)
        .set({
          state: 'released',
          releasedAt: new Date(),
        })
        .where(eq(creditHold.id, hold.id))
    })
  }
}
