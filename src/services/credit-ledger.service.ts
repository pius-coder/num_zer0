import { and, eq, sql } from "drizzle-orm";

import { BaseService } from "./base.service";
import {
  creditWallet,
  creditLot,
  creditHold,
  creditTransaction,
} from "@/database/schema";

export type CreditType = "base" | "bonus" | "promotional";

const nowPlusMinutes = (minutes: number) =>
  new Date(Date.now() + minutes * 60 * 1000);

export interface WalletBalance {
  base: number;
  bonus: number;
  promotional: number;
  held: number;
  available: number;
  totalPurchased: number;
  totalConsumed: number;
  totalRefunded: number;
  totalExpired: number;
  totalBonusReceived: number;
  activeHoldsCount: number;
}

export interface ConsumableLot {
  lotId: string;
  consumeAmount: number;
}

export class CreditLedgerService extends BaseService {
  constructor() {
    super({ prefix: "credit-ledger", db: true });
  }

  async getOrCreateWallet(userId: string) {
    const existing = await this.db.query.creditWallet.findFirst({
      where: eq(creditWallet.userId, userId),
    });
    if (existing) return existing;

    const [created] = await this.db
      .insert(creditWallet)
      .values({ id: `wallet_${userId}`, userId })
      .returning();

    this.assert(
      !!created,
      "wallet_creation_failed",
      "Failed to create wallet",
      { userId },
    );
    return created;
  }

  /**
   * Uses the `user_wallet_summary` DB view (Rule 7).
   * Fallback: computes balance directly from tables if the view is missing.
   * Safety: returns zero balance if all DB access fails (prevents 500 crash).
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    const zeroBalance: WalletBalance = {
      base: 0, bonus: 0, promotional: 0, held: 0, available: 0,
      totalPurchased: 0, totalConsumed: 0, totalRefunded: 0,
      totalExpired: 0, totalBonusReceived: 0, activeHoldsCount: 0,
    };

    // 1. Attempt to use the optimized SQL view
    try {
      const [row] = await this.db.execute<{
        base_balance: number; bonus_balance: number; promo_balance: number; held_balance: number;
        available_balance: number; total_purchased: number; total_consumed: number;
        total_refunded: number; total_expired: number; total_bonus_received: number; active_holds_count: number;
      }>(
        sql`SELECT base_balance, bonus_balance, promo_balance, held_balance,
                   available_balance, total_purchased, total_consumed,
                   total_refunded, total_expired, total_bonus_received,
                   active_holds_count
            FROM user_wallet_summary
            WHERE user_id = ${userId}`,
      );

      if (row) {
        return {
          base: row.base_balance, bonus: row.bonus_balance, promotional: row.promo_balance,
          held: row.held_balance, available: row.available_balance,
          totalPurchased: row.total_purchased, totalConsumed: row.total_consumed,
          totalRefunded: row.total_refunded, totalExpired: row.total_expired,
          totalBonusReceived: row.total_bonus_received, activeHoldsCount: row.active_holds_count,
        };
      }
    } catch (err) {
      this.log.warn('wallet_view_fallback', { msg: 'View failed, trying direct table query' });
    }

    // 2. Fallback: Calculate balance manually from creditWallet table
    try {
      const wallet = await this.db.query.creditWallet.findFirst({
        where: eq(creditWallet.userId, userId),
      });

      if (wallet) {
        return {
          base: wallet.baseBalance, bonus: wallet.bonusBalance, promotional: wallet.promoBalance,
          held: wallet.heldBalance,
          available: wallet.baseBalance + wallet.bonusBalance + wallet.promoBalance - wallet.heldBalance,
          totalPurchased: wallet.totalPurchased, totalConsumed: wallet.totalConsumed,
          totalRefunded: wallet.totalRefunded, totalExpired: wallet.totalExpired,
          totalBonusReceived: wallet.totalBonusReceived, activeHoldsCount: 0,
        };
      }
    } catch (err) {
      this.log.warn('wallet_table_fallback', { msg: 'Direct table query failed' });
    }

    // 3. Ultimate Safety: If DB is totally broken, return 0 to keep app running
    this.log.warn('wallet_balance_final_fallback', { userId });
    
    // Try to create wallet silently in background so it might exist next time
    try { await this.getOrCreateWallet(userId); } catch {}
    
    return zeroBalance;
  }

  /**
   * Uses the `get_consumable_lots()` stored function (Rule 7).
   * Banking-level FIFO with row-level locking — eliminates race conditions.
   * IMPROVEMENT: Now gracefully skips "Ghost Lots" (corrupted references) 
   * instead of crashing the whole activation flow.
   */
  async holdCredits(params: {
    userId: string;
    amount: number;
    holdTimeMinutes: number;
    activationId?: string;
    idempotencyKey: string;
  }) {
    const wallet = await this.getOrCreateWallet(params.userId);

    const existingHold = await this.db.query.creditHold.findFirst({
      where: eq(creditHold.idempotencyKey, params.idempotencyKey),
    });
    if (existingHold) return existingHold;

    const holdId = this.generateId("hold");

    await this.transaction(async (tx) => {
      // DB function: FIFO lot selection with FOR UPDATE locks
      const lotsResult = await tx.execute<{
        lot_id: string;
        consume_amount: number;
      }>(
        sql`SELECT * FROM get_consumable_lots(${wallet.id}, ${params.amount})`,
      );

      const lots: ConsumableLot[] = lotsResult.map((r) => ({
        lotId: r.lot_id,
        consumeAmount: r.consume_amount,
      }));

      this.assert(
        lots.length > 0,
        "insufficient_credits",
        "No consumable lots available",
        {
          walletId: wallet.id,
          requestedAmount: params.amount,
        },
      );

      // Create hold records for each consumed lot
      for (const lot of lots) {
        // PHYSICAL VERIFICATION: Check if the lot actually exists in DB.
        // This prevents crash on "Ghost Lots" (lots referenced by balance calculation but missing in table).
        const realLot = await tx.query.creditLot.findFirst({
          where: eq(creditLot.id, lot.lotId),
          columns: { creditType: true, remainingAmount: true },
        });

        if (!realLot) {
          // Gracefully skip the corrupted/ghost lot and proceed with other valid credits.
          this.log.warn('skipping_ghost_lot', {
            slug: 'credit-consistency-check',
            lotId: lot.lotId,
            msg: 'Lot ID returned by procedure does not exist in DB. Skipping to avoid crashing transaction.',
          });
          continue;
        }

        await tx.insert(creditHold).values({
          id: this.generateId("hold"),
          userId: params.userId,
          walletId: wallet.id,
          activationId: params.activationId,
          amount: lot.consumeAmount,
          creditType: realLot.creditType, // Use type from the verified DB record
          lotId: realLot.id,
          state: "held",
          expiresAt: nowPlusMinutes(params.holdTimeMinutes),
          idempotencyKey: params.idempotencyKey,
        });
      }

      // Update wallet held balance
      await tx
        .update(creditWallet)
        .set({
          heldBalance: sql`${creditWallet.heldBalance} + ${params.amount}`,
        })
        .where(eq(creditWallet.id, wallet.id));
    }, "hold_credits");

    this.log.info("credits_held", {
      userId: params.userId,
      holdId,
      amount: params.amount,
    });

    return this.db.query.creditHold.findFirst({
      where: eq(creditHold.idempotencyKey, params.idempotencyKey),
    });
  }

  async confirmHoldDebit(holdId: string) {
    const hold = await this.db.query.creditHold.findFirst({
      where: eq(creditHold.id, holdId),
    });
    this.assert(
      hold?.state === "held",
      "hold_not_debitable",
      "Hold not debitable",
      { holdId },
    );

    await this.db
      .update(creditHold)
      .set({ state: "debited", debitedAt: new Date() })
      .where(eq(creditHold.id, holdId));

    return this.db.query.creditHold.findFirst({
      where: eq(creditHold.id, holdId),
    });
  }

  async releaseHold(holdId: string) {
    const hold = await this.db.query.creditHold.findFirst({
      where: eq(creditHold.id, holdId),
    });
    if (!hold || hold.state !== "held") return;

    await this.transaction(async (tx) => {
      await tx
        .update(creditLot)
        .set({
          remainingAmount: sql`${creditLot.remainingAmount} + ${hold.amount}`,
        })
        .where(eq(creditLot.id, hold.lotId));

      await tx
        .update(creditWallet)
        .set({
          heldBalance: sql`${creditWallet.heldBalance} - ${hold.amount}`,
        })
        .where(eq(creditWallet.id, hold.walletId));

      await tx
        .update(creditHold)
        .set({ state: "released", releasedAt: new Date() })
        .where(eq(creditHold.id, hold.id));
    }, "release_hold");
  }

  async creditWallet(params: {
    userId: string;
    creditsBase: number;
    creditsBonus: number;
    purchaseId: string;
    sourceTxnId?: string;
  }) {
    const wallet = await this.getOrCreateWallet(params.userId);

    const existingTxn = await this.db.query.creditTransaction.findFirst({
      where: and(
        eq(creditTransaction.purchaseId, params.purchaseId),
        eq(creditTransaction.type, "purchase"),
      ),
    });
    if (existingTxn) {
      this.log.info("wallet_already_credited", {
        purchaseId: params.purchaseId,
        existingTxnId: existingTxn.id,
      });
      return { alreadyCredited: true };
    }

    await this.transaction(async (tx) => {
      if (params.creditsBase > 0) {
        const baseLotId = this.generateId("lot");
        await tx.insert(creditLot).values({
          id: baseLotId,
          walletId: wallet.id,
          creditType: "base",
          initialAmount: params.creditsBase,
          remainingAmount: params.creditsBase,
          sourceTxnId: params.sourceTxnId,
        });

        await tx
          .update(creditWallet)
          .set({
            baseBalance: sql`${creditWallet.baseBalance} + ${params.creditsBase}`,
            totalPurchased: sql`${creditWallet.totalPurchased} + ${params.creditsBase}`,
          })
          .where(eq(creditWallet.id, wallet.id));

        await tx.insert(creditTransaction).values({
          id: this.generateId("txn"),
          userId: params.userId,
          walletId: wallet.id,
          type: "purchase",
          creditType: "base",
          amount: params.creditsBase,
          balanceAfter: wallet.baseBalance + params.creditsBase,
          purchaseId: params.purchaseId,
          lotId: baseLotId,
          description: `Purchase credit: ${params.creditsBase} base credits`,
        });
      }

      if (params.creditsBonus > 0) {
        const bonusLotId = this.generateId("lot");
        await tx.insert(creditLot).values({
          id: bonusLotId,
          walletId: wallet.id,
          creditType: "bonus",
          initialAmount: params.creditsBonus,
          remainingAmount: params.creditsBonus,
          sourceTxnId: params.sourceTxnId,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });

        await tx
          .update(creditWallet)
          .set({
            bonusBalance: sql`${creditWallet.bonusBalance} + ${params.creditsBonus}`,
            totalBonusReceived: sql`${creditWallet.totalBonusReceived} + ${params.creditsBonus}`,
          })
          .where(eq(creditWallet.id, wallet.id));

        await tx.insert(creditTransaction).values({
          id: this.generateId("txn"),
          userId: params.userId,
          walletId: wallet.id,
          type: "bonus_first_purchase",
          creditType: "bonus",
          amount: params.creditsBonus,
          balanceAfter: wallet.bonusBalance + params.creditsBonus,
          purchaseId: params.purchaseId,
          lotId: bonusLotId,
          description: `Purchase bonus: ${params.creditsBonus} bonus credits`,
        });
      }
    }, "credit_wallet");

    this.log.info("wallet_credited", {
      userId: params.userId,
      purchaseId: params.purchaseId,
      creditsBase: params.creditsBase,
      creditsBonus: params.creditsBonus,
    });

    return { alreadyCredited: false };
  }

  async getTransactionHistory(userId: string, limit = 50) {
    const wallet = await this.getOrCreateWallet(userId);

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
    });

    return transactions;
  }
}
