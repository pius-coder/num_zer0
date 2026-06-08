import { query } from '../_generated/server'
import { v } from 'convex/values'

export const verifyEscrowIntegrity = query({
  args: {},
  handler: async (ctx) => {
    const activeStatuses = ['awaiting_number', 'awaiting_sms', 'sms_received']
    const activeActivations = await ctx.db
      .query('activations')
      .filter((q) => q.or(
        q.eq(q.field('status'), 'awaiting_number'),
        q.eq(q.field('status'), 'awaiting_sms'),
        q.eq(q.field('status'), 'sms_received'),
      ))
      .collect()

    const heldEscrows = await ctx.db
      .query('escrows')
      .withIndex('by_status', (q) => q.eq('status', 'held'))
      .collect()

    const activationIdsWithEscrow = new Set(heldEscrows.map((e) => e.activationId))

    const missingEscrows = activeActivations.filter(
      (a) => !activationIdsWithEscrow.has(a._id),
    )

    return {
      activeActivationsCount: activeActivations.length,
      heldEscrowsCount: heldEscrows.length,
      missingEscrowsCount: missingEscrows.length,
      match: activeActivations.length === heldEscrows.length,
    }
  },
})

export const verifyWalletIntegrity = query({
  args: {},
  handler: async (ctx) => {
    const comptes = await ctx.db.query('comptes').collect()
    const wallets = await ctx.db.query('wallets').collect()
    const users = await ctx.db.query('users').collect()

    const totalCompteSolde = comptes
      .filter((c) => c.code.startsWith('411-'))
      .reduce((sum, c) => sum + c.solde, 0)

    const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balanceCents, 0)

    const walletUserIds = new Set(wallets.map((w) => w.userId))
    const userSubjects = new Set(users.map((u) => u.betterAuthUserId ?? u._id))
    const orphanWallets = wallets.filter((w) => !userSubjects.has(w.userId))

    const ledgerEntries = await ctx.db.query('wallet_ledger_entries').collect()
    const ledgerWalletIds = new Set(ledgerEntries.map((l) => l.walletId))
    const orphanLedger = ledgerEntries.filter((l) => !walletUserIds.has(l.walletId as any))

    const purchases = await ctx.db.query('purchases').collect()
    const paymentIntents = await ctx.db.query('payment_intents').collect()
    const successfulPurchases = purchases.filter(
      (p) => ['confirmed', 'SUCCESSFUL', 'successful'].includes(p.status),
    )

    return {
      totalCompteSolde,
      totalWalletBalance,
      sumMatch: Math.round(totalCompteSolde * 100) === totalWalletBalance,
      orphanWallets: orphanWallets.length,
      orphanLedgerEntries: orphanLedger.length,
      successfulPurchases: successfulPurchases.length,
      paymentIntentsCount: paymentIntents.length,
    }
  },
})
