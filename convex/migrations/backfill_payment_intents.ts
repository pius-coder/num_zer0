import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const backfillPaymentIntents = mutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true
    const results = { paymentIntentsCreated: 0, ordersCreated: 0, skipped: 0, errors: 0, total: 0 }

    const purchases = await ctx.db.query('purchases').collect()
    results.total = purchases.length

    type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'expired'

    function normalizeStatus(status: string): PaymentStatus {
      const s = status.toLowerCase()
      if (['confirmed', 'successful'].includes(s)) return 'succeeded'
      if (['failed', 'expired'].includes(s)) return 'failed'
      if (['cancelled'].includes(s)) return 'cancelled'
      if (['pending', 'payment_pending'].includes(s)) return 'pending'
      return 'failed'
    }

    for (const purchase of purchases) {
      try {
        const idempotencyKey = purchase.idempotencyKey || purchase.paymentGatewayId || `legacy_${purchase._id}`
        const xafRate = 600

        const existing = await ctx.db
          .query('payment_intents')
          .withIndex('by_idempotencyKey', (q) => q.eq('idempotencyKey', idempotencyKey))
          .first()

        if (existing) {
          results.skipped++
          continue
        }

        const normalizedStatus = normalizeStatus(purchase.status)
        const amountCents = Math.round(purchase.priceXaf / xafRate * 100)
        const now = Date.now()

          if (!dryRun) {
            const piId = await ctx.db.insert('payment_intents', {
              userId: purchase.userId,
              amountCents,
              currency: 'USD',
              status: normalizedStatus,
              gateway: 'fapshi',
              idempotencyKey,
              gatewayTransactionId: purchase.paymentGatewayId,
              xafAmount: purchase.priceXaf,
              xafRate,
              metadata: {
                paymentMethod: purchase.paymentMethod,
                promoCode: purchase.promoCode,
                promoDiscount: purchase.promoDiscount,
              },
              createdAt: purchase.createdAt,
              updatedAt: purchase.createdAt,
            })

            const wallet = await ctx.db
              .query('wallets')
              .withIndex('by_userId', (q) => q.eq('userId', purchase.userId))
              .first()

            if (wallet) {
              await ctx.db.insert('wallet_ledger_entries', {
                walletId: wallet._id,
                type: normalizedStatus === 'succeeded' ? 'credit' : 'debit',
                amountCents,
                balanceAfterCents: wallet.balanceCents,
                referenceType: 'payment_intent',
                referenceId: piId,
                description: `Recharge ${normalizedStatus === 'succeeded' ? 'confirmée' : normalizedStatus}`,
                createdAt: purchase.createdAt,
              })
            }

            results.paymentIntentsCreated++
          results.ordersCreated++
        } else {
          results.paymentIntentsCreated++
          results.ordersCreated++
        }
      } catch (e: any) {
        results.errors++
        console.error(`Failed to backfill purchase ${purchase._id}: ${e.message}`)
      }
    }

    return results
  },
})
