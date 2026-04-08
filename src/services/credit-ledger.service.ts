import { and, eq, sql } from 'drizzle-orm'

import { BaseService } from './base.service'
import { creditWallet, creditLot, creditHold, creditTransaction } from '@/database/schema'

export type CreditType = 'base' | 'bonus' | 'promotional'

const nowPlusMinutes = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000)

export interface WalletBalance {
  base: number
  bonus: number
  promotional: number
  held: number
  available: number
  totalPurchased: number
  totalConsumed: number
  totalRefunded: number
  totalExpired: number
  totalBonusReceived: number
  activeHoldsCount: number
}

export interface ConsumableLot {
  lotId: string
  consumeAmount: number
}

export class CreditLedgerService extends BaseService {
  constructor() {
    super({ prefix: 'credit-ledger', db: true })
  }

  async getOrCreateWallet(userId: string) {
    const existing = await this.db.query.creditWallet.findFirst({
      where: eq(creditWallet.userId, userId),
    })
    if (existing) return existing

    const [created] = await this.db
      .insert(creditWallet)
      .values({ id: `wallet_${userId}`, userId })
      .returning()

    this.assert(!!created, 'wallet_creation_failed', 'Failed to create wallet', { userId })
    return created
  }

  async getBalance(userId: string): Promise<WalletBalance> {
    const zeroBalance: WalletBalance = {
      base: 0,
      bonus: 0,
      promotional: 0,
      held: 0,
      available: 0,
      totalPurchased: 0,
      totalConsumed: 0,
      totalRefunded: 0,
      totalExpired: 0,
      totalBonusReceived: 0,
      activeHoldsCount: 0,
    }

    try {
      const [row] = await this.db.execute<{
        base_balance: number
        bonus_balance: number
        promo_balance: number
        held_balance: number
        available_balance: number
        total_purchased: number
        total_consumed: number
        total_refunded: number
        total_expired: number
        total_bonus_received: number
        active_holds_count: number
      }>(
        sql`SELECT base_balance, bonus_balance, promo_balance, held_balance,
                   available_balance, total_purchased, total_consumed,
                   total_refunded, total_expired, total_bonus_received,
                   active_holds_count
            FROM user_wallet_summary
            WHERE user_id = ${userId}`
      )

      if (row) {
        return {
          base: row.base_balance,
          bonus: row.bonus_balance,
          promotional: row.promo_balance,
          held: row.held_balance,
          available: row.available_balance,
          totalPurchased: row.total_purchased,
          totalConsumed: row.total_consumed,
          totalRefunded: row.total_refunded,
          totalExpired: row.total_expired,
          totalBonusReceived: row.total_bonus_received,
          activeHoldsCount: row.active_holds_count,
        }
      }
    } catch {
      this.log.warn('wallet_view_fallback', { msg: 'View failed, trying direct table query' })
    }

    try {
      const wallet = await this.db.query.creditWallet.findFirst({
        where: eq(creditWallet.userId, userId),
      })

      if (wallet) {
        return {
          base: wallet.baseBalance,
          bonus: wallet.bonusBalance,
          promotional: wallet.promoBalance,
          held: wallet.heldBalance,
          available:
            wallet.baseBalance + wallet.bonusBalance + wallet.promoBalance - wallet.heldBalance,
          totalPurchased: wallet.totalPurchased,
          totalConsumed: wallet.totalConsumed,
          totalRefunded: wallet.totalRefunded,
          totalExpired: wallet.totalExpired,
          totalBonusReceived: wallet.totalBonusReceived,
          activeHoldsCount: 0,
        }
      }
    } catch {
      this.log.warn('wallet_table_fallback', { msg: 'Direct table query failed' })
    }

    this.log.warn('wallet_balance_final_fallback', { userId })
    try {
      await this.getOrCreateWallet(userId)
    } catch {}
    return zeroBalance
  }

  async holdCredits(params: {
    userId: string
    amount: number
    holdTimeMinutes: number
    activationId?: string
    idempotencyKey: string
  }) {
    const wallet = await this.getOrCreateWallet(params.userId)

    // Idempotency: if activationId is provided and holds already exist, skip
    if (params.activationId) {
      const existingHolds = await this.db.query.creditHold.findMany({
        where: eq(creditHold.activationId, params.activationId),
      })
      if (existingHolds.length > 0) return existingHolds[0]
    }

    await this.transaction(async (tx) => {
      const lotsResult = await tx.execute<{
        lot_id: string
        consume_amount: number
      }>(sql`SELECT * FROM get_consumable_lots(${wallet.id}, ${params.amount})`)

      const lots: ConsumableLot[] = lotsResult.map((r) => ({
        lotId: r.lot_id,
        consumeAmount: r.consume_amount,
      }))

      this.assert(lots.length > 0, 'insufficient_credits', 'No consumable lots available', {
        walletId: wallet.id,
        requestedAmount: params.amount,
      })

      // FIX: Conditionally include activationId. If undefined, Drizzle omits the column entirely
      // and Postgres applies DEFAULT NULL cleanly — no empty strings, no type casting.
      for (const lot of lots) {
        const realLot = await tx.query.creditLot.findFirst({
          where: eq(creditLot.id, lot.lotId),
          columns: { id: true, creditType: true, remainingAmount: true },
        })

        if (!realLot) {
          this.log.warn('skipping_ghost_lot', {
            slug: 'credit-consistency-check',
            lotId: lot.lotId,
            msg: 'Lot ID returned by procedure does not exist in DB. Skipping.',
          })
          continue
        }

        // SENIOR FIX: Using raw SQL (tx.execute) with explicit parameters.
        // This bypasses Drizzle's serialization issues on Vercel and guarantees
        // that Postgres uses its native DEFAULT values for NULL columns.
        const holdId = this.generateId('hold')
        await tx.execute(sql`
          INSERT INTO "credit_hold" (
            "id", "user_id", "wallet_id", "amount", "credit_type", "lot_id", "state", "expires_at", "idempotency_key", "activation_id"
          ) VALUES (
            ${holdId}, 
            ${params.userId}, 
            ${wallet.id}, 
            ${lot.consumeAmount}, 
            ${realLot.creditType}, 
            ${lot.lotId}, 
            'held', 
            ${nowPlusMinutes(params.holdTimeMinutes)}, 
            ${params.idempotencyKey + '_' + lot.lotId},
            ${params.activationId || null}
          )
        `)
      }

      await tx
        .update(creditWallet)
        .set({
          heldBalance: sql`${creditWallet.heldBalance} + ${params.amount}`,
        })
        .where(eq(creditWallet.id, wallet.id))
    }, 'hold_credits')

    this.log.info('credits_held', {
      userId: params.userId,
      holdId: this.generateId('log'),
      amount: params.amount,
    })

    // Return the first hold linked to this activation (multi-lot safe)
    if (params.activationId) {
      return this.db.query.creditHold.findFirst({
        where: eq(creditHold.activationId, params.activationId),
      })
    }
    // Fallback: find by key prefix pattern
    return this.db.query.creditHold.findFirst({
      where: sql`${creditHold.idempotencyKey} LIKE ${params.idempotencyKey + '_%'}`,
    })
  }

  async confirmHoldDebit(holdId: string) {
    const hold = await this.db.query.creditHold.findFirst({
      where: eq(creditHold.id, holdId),
    })
    this.assert(hold?.state === 'held', 'hold_not_debitable', 'Hold not debitable', { holdId })

    await this.db
      .update(creditHold)
      .set({ state: 'debited', debitedAt: new Date() })
      .where(eq(creditHold.id, holdId))

    return this.db.query.creditHold.findFirst({
      where: eq(creditHold.id, holdId),
    })
  }

  async releaseHoldByActivationId(activationId: string) {
    const holds = await this.db.query.creditHold.findMany({
      where: eq(creditHold.activationId, activationId),
    })

    if (holds.length === 0) return

    // Sum up only the 'held' amounts to update wallet balance
    const totalHeldAmount = holds
      .filter((h) => h.state === 'held')
      .reduce((sum, h) => sum + h.amount, 0)

    if (totalHeldAmount === 0) return

    // Get wallet ID from first hold (safe: holds.length > 0 checked above)
    const walletId = holds[0]!.walletId

    await this.transaction(async (tx) => {
      for (const hold of holds) {
        if (hold.state !== 'held') continue

        // Restore lot balance
        await tx
          .update(creditLot)
          .set({
            remainingAmount: sql`${creditLot.remainingAmount} + ${hold.amount}`,
          })
          .where(eq(creditLot.id, hold.lotId))

        // Mark hold as released
        await tx
          .update(creditHold)
          .set({ state: 'released', releasedAt: new Date() })
          .where(eq(creditHold.id, hold.id))
      }

      // Update wallet heldBalance (critical: was missing!)
      await tx
        .update(creditWallet)
        .set({
          heldBalance: sql`${creditWallet.heldBalance} - ${totalHeldAmount}`,
        })
        .where(eq(creditWallet.id, walletId))
    }, 'release_holds_by_activation')

    this.log.info('holds_released_by_activation', {
      activationId,
      holdsCount: holds.filter((h) => h.state === 'held').length,
      totalAmount: totalHeldAmount,
    })
  }
  async releaseHoldsByIdempotencyKey(idempotencyKey: string) {
    const holds = await this.db.query.creditHold.findMany({
      where: sql`${creditHold.idempotencyKey} LIKE ${`${idempotencyKey}_%`}`,
    })
    if (holds.length === 0) return

    // Filter only 'held' state
    const heldHolds = holds.filter((h) => h.state === 'held')
    const totalHeldAmount = heldHolds.reduce((sum, h) => sum + h.amount, 0)
    if (totalHeldAmount === 0) return

    // Get wallet ID from first hold
    const walletId = heldHolds[0]!.walletId

    await this.transaction(async (tx) => {
      for (const hold of heldHolds) {
        // Restore lot balance
        await tx
          .update(creditLot)
          .set({
            remainingAmount: sql`${creditLot.remainingAmount} + ${hold.amount}`,
          })
          .where(eq(creditLot.id, hold.lotId))

        // Mark hold as released
        await tx
          .update(creditHold)
          .set({ state: 'released', releasedAt: new Date() })
          .where(eq(creditHold.id, hold.id))
      }

      // Update wallet heldBalance
      await tx
        .update(creditWallet)
        .set({
          heldBalance: sql`${creditWallet.heldBalance} - ${totalHeldAmount}`,
        })
        .where(eq(creditWallet.id, walletId))
    }, 'release_holds_by_idempotency_key')

    this.log.info('holds_released_by_idempotency_key', {
      idempotencyKey,
      holdsCount: heldHolds.length,
      totalAmount: totalHeldAmount,
    })
  }

  /**
   * Link orphaned holds (activation_id IS NULL) to an activation
   * after the smsActivation row has been inserted (FK now valid).
   * Returns the number of holds linked.
   */
  async linkHoldsToActivation(idempotencyKey: string, activationId: string) {
    const holds = await this.db.query.creditHold.findMany({
      where: sql`${creditHold.idempotencyKey} LIKE ${`${idempotencyKey}_%`}`,
    })

    // Only link holds that are 'held' AND not yet linked to an activation
    const unlinked = holds.filter((h) => h.state === 'held' && !h.activationId)
    if (unlinked.length === 0) {
      this.log.warn('link_holds_no_unlinked', { idempotencyKey, activationId })
      return 0
    }

    await this.transaction(async (tx) => {
      for (const hold of unlinked) {
        await tx.update(creditHold).set({ activationId }).where(eq(creditHold.id, hold.id))
      }
    }, 'link_holds_to_activation')

    this.log.info('holds_linked_to_activation', {
      idempotencyKey,
      activationId,
      linkedCount: unlinked.length,
    })

    return unlinked.length
  }

  async releaseHold(holdId: string) {
    const hold = await this.db.query.creditHold.findFirst({
      where: eq(creditHold.id, holdId),
    })
    if (!hold || hold.state !== 'held') return

    await this.transaction(async (tx) => {
      await tx
        .update(creditLot)
        .set({
          remainingAmount: sql`${creditLot.remainingAmount} + ${hold.amount}`,
        })
        .where(eq(creditLot.id, hold.lotId))

      await tx
        .update(creditWallet)
        .set({
          heldBalance: sql`${creditWallet.heldBalance} - ${hold.amount}`,
        })
        .where(eq(creditWallet.id, hold.walletId))

      await tx
        .update(creditHold)
        .set({ state: 'released', releasedAt: new Date() })
        .where(eq(creditHold.id, hold.id))
    }, 'release_hold')
  }

  async creditWallet(params: {
    userId: string
    creditsBase: number
    creditsBonus: number
    purchaseId: string
    sourceTxnId?: string
  }) {
    const wallet = await this.getOrCreateWallet(params.userId)

    const existingTxn = await this.db.query.creditTransaction.findFirst({
      where: and(
        eq(creditTransaction.purchaseId, params.purchaseId),
        eq(creditTransaction.type, 'purchase')
      ),
    })
    if (existingTxn) {
      this.log.info('wallet_already_credited', {
        purchaseId: params.purchaseId,
        existingTxnId: existingTxn.id,
      })
      return { alreadyCredited: true }
    }

    await this.transaction(async (tx) => {
      if (params.creditsBase > 0) {
        const baseLotId = this.generateId('lot')
        await tx.insert(creditLot).values({
          id: baseLotId,
          walletId: wallet.id,
          creditType: 'base',
          initialAmount: params.creditsBase,
          remainingAmount: params.creditsBase,
          sourceTxnId: params.sourceTxnId,
        })

        await tx
          .update(creditWallet)
          .set({
            baseBalance: sql`${creditWallet.baseBalance} + ${params.creditsBase}`,
            totalPurchased: sql`${creditWallet.totalPurchased} + ${params.creditsBase}`,
          })
          .where(eq(creditWallet.id, wallet.id))

        await tx.insert(creditTransaction).values({
          id: this.generateId('txn'),
          userId: params.userId,
          walletId: wallet.id,
          type: 'purchase',
          creditType: 'base',
          amount: params.creditsBase,
          balanceAfter: wallet.baseBalance + params.creditsBase,
          purchaseId: params.purchaseId,
          lotId: baseLotId,
          description: `Purchase credit: ${params.creditsBase} base credits`,
        })
      }

      if (params.creditsBonus > 0) {
        const bonusLotId = this.generateId('lot')
        await tx.insert(creditLot).values({
          id: bonusLotId,
          walletId: wallet.id,
          creditType: 'bonus',
          initialAmount: params.creditsBonus,
          remainingAmount: params.creditsBonus,
          sourceTxnId: params.sourceTxnId,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        })

        await tx
          .update(creditWallet)
          .set({
            bonusBalance: sql`${creditWallet.bonusBalance} + ${params.creditsBonus}`,
            totalBonusReceived: sql`${creditWallet.totalBonusReceived} + ${params.creditsBonus}`,
          })
          .where(eq(creditWallet.id, wallet.id))

        await tx.insert(creditTransaction).values({
          id: this.generateId('txn'),
          userId: params.userId,
          walletId: wallet.id,
          type: 'bonus_first_purchase',
          creditType: 'bonus',
          amount: params.creditsBonus,
          balanceAfter: wallet.bonusBalance + params.creditsBonus,
          purchaseId: params.purchaseId,
          lotId: bonusLotId,
          description: `Purchase bonus: ${params.creditsBonus} bonus credits`,
        })
      }
    }, 'credit_wallet')

    this.log.info('wallet_credited', {
      userId: params.userId,
      purchaseId: params.purchaseId,
      creditsBase: params.creditsBase,
      creditsBonus: params.creditsBonus,
    })

    return { alreadyCredited: false }
  }

  async getTransactionHistory(userId: string, limit = 50) {
    const wallet = await this.getOrCreateWallet(userId)

    const transactions = await this.db.query.creditTransaction.findMany({
      where: eq(creditTransaction.walletId, wallet.id),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit,
      columns: {
        id: true,
        type: true,
        creditType: true,
        amount: true,
        balanceAfter: true,
        description: true,
        createdAt: true,
      },
    })

    return transactions
  }
}
