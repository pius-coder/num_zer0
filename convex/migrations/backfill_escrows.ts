import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const backfillEscrows = mutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true
    const results = { created: 0, skipped: 0, errors: 0, total: 0 }

    const activeStatuses = ['awaiting_number', 'awaiting_sms', 'sms_received']

    const activeActivations = await ctx.db
      .query('activations')
      .filter((q) => q.or(
        q.eq(q.field('status'), 'awaiting_number'),
        q.eq(q.field('status'), 'awaiting_sms'),
        q.eq(q.field('status'), 'sms_received'),
      ))
      .collect()

    results.total = activeActivations.length

    for (const activation of activeActivations) {
      try {
        const existingEscrow = await ctx.db
          .query('escrows')
          .withIndex('by_activationId', (q) => q.eq('activationId', activation._id))
          .first()

        if (existingEscrow) {
          results.skipped++
          continue
        }

        const amountCents = Math.round(activation.priceCharged * 100)

        if (!dryRun) {
          const now = Date.now()
          await ctx.db.insert('escrows', {
            userId: activation.userId,
            activationId: activation._id,
            amountCents,
            status: 'held',
            description: 'Migrated from legacy activation',
            createdAt: now,
            updatedAt: now,
          })
        }

        results.created++
      } catch (e: any) {
        results.errors++
        console.error(`Failed to backfill escrow for activation ${activation._id}: ${e.message}`)
      }
    }

    return results
  },
})
