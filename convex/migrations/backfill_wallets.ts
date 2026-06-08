import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const backfillWallets = mutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true
    const results = { walletsCreated: 0, walletsSkipped: 0, errors: 0 }

    const comptes = await ctx.db.query('comptes').collect()
    const userComptes = comptes.filter((c) => c.code.startsWith('411-'))

    for (const compte of userComptes) {
      try {
        const userId = compte.code.replace('411-', '')
        const existingWallet = await ctx.db
          .query('wallets')
          .withIndex('by_userId', (q) => q.eq('userId', userId))
          .first()

        if (existingWallet) {
          results.walletsSkipped++
          continue
        }

        const balanceCents = Math.round(compte.solde * 100)

        if (!dryRun) {
          const now = Date.now()
          await ctx.db.insert('wallets', {
            userId,
            balanceCents,
            currency: 'USD',
            createdAt: now,
            updatedAt: now,
          })
        }

        results.walletsCreated++
      } catch (e: any) {
        results.errors++
        console.error(`Failed to backfill wallet for compte ${compte.code}: ${e.message}`)
      }
    }

    const usersWithoutWallet = await ctx.db
      .query('users')
      .filter((q) => q.neq(q.field('balanceUsd'), undefined))
      .collect()

    for (const user of usersWithoutWallet) {
      try {
        const userId = user.betterAuthUserId ?? user._id
        const existingWallet = await ctx.db
          .query('wallets')
          .withIndex('by_userId', (q) => q.eq('userId', userId))
          .first()

        if (existingWallet) continue

        const balanceCents = Math.round((user.balanceUsd ?? 0) * 100)

        if (!dryRun) {
          const now = Date.now()
          await ctx.db.insert('wallets', {
            userId,
            balanceCents,
            currency: 'USD',
            createdAt: now,
            updatedAt: now,
          })
        }

        results.walletsCreated++
      } catch (e: any) {
        results.errors++
        console.error(`Failed to backfill wallet from user ${user._id}: ${e.message}`)
      }
    }

    return results
  },
})

export const backfillLedger = mutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true
    const results = { entriesCreated: 0, entriesSkipped: 0, errors: 0, totalLines: 0 }

    const comptes = await ctx.db.query('comptes').collect()
    const userCompteCodes = comptes.filter((c) => c.code.startsWith('411-')).map((c) => c.code)

    const pieces = await ctx.db.query('pieces').collect()
    const piecesMap = new Map(pieces.map((p) => [p._id, p]))

    for (const compteCode of userCompteCodes) {
      const lines = await ctx.db
        .query('lignes')
        .withIndex('by_compte', (q) => q.eq('compteCode', compteCode))
        .collect()

      results.totalLines += lines.length

      for (const line of lines) {
        try {
          const piece = piecesMap.get(line.pieceId)
          if (!piece) {
            results.errors++
            continue
          }

          const userId = compteCode.replace('411-', '')
          const wallet = await ctx.db
            .query('wallets')
            .withIndex('by_userId', (q) => q.eq('userId', userId))
            .first()

          if (!wallet) {
            results.errors++
            continue
          }

          const existingEntry = await ctx.db
            .query('wallet_ledger_entries')
            .filter((q) => q.eq(q.field('referenceId'), piece._id))
            .first()

          if (existingEntry) {
            results.entriesSkipped++
            continue
          }

          const type = line.sens === 'debit' ? 'credit' : 'debit'
          const amountCents = Math.round(line.montant * 100)

          if (!dryRun) {
            await ctx.db.insert('wallet_ledger_entries', {
              walletId: wallet._id,
              type,
              amountCents,
              balanceAfterCents: Math.round(line.soldeApres * 100),
              referenceType: 'admin',
              referenceId: piece._id,
              description: piece.libelle,
              createdAt: piece.date,
            })
          }

          results.entriesCreated++
        } catch (e: any) {
          results.errors++
          console.error(`Ledger migration error: ${e.message}`)
        }
      }
    }

    return results
  },
})
