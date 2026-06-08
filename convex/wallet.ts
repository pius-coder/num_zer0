import { query, internalMutation, type MutationCtx } from './_generated/server'
import { v } from 'convex/values'
import { requireAuth } from './lib/auth_helpers'

async function ensureWalletExists(ctx: MutationCtx, userId: string) {
  const existing = await ctx.db
    .query('wallets')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first()
  if (existing) return existing._id
  const now = Date.now()
  return await ctx.db.insert('wallets', {
    userId,
    balanceCents: 0,
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
  })
}

export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx)
    const wallet = await ctx.db
      .query('wallets')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .first()
    if (!wallet) return { balanceCents: 0, balanceUsd: 0, userId: identity.subject }
    return {
      balanceCents: wallet.balanceCents,
      balanceUsd: wallet.balanceCents / 100,
      userId: identity.subject,
    }
  },
})

export const getLedger = query({
  args: { numItems: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const wallet = await ctx.db
      .query('wallets')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .first()
    if (!wallet) return []
    return await ctx.db
      .query('wallet_ledger_entries')
      .withIndex('by_walletId_createdAt', (q) => q.eq('walletId', wallet._id))
      .order('desc')
      .take(args.numItems ?? 50)
  },
})

export const internalCreditWallet = internalMutation({
  args: {
    userId: v.string(),
    amountCents: v.number(),
    referenceType: v.union(v.literal('payment_intent'), v.literal('escrow'), v.literal('order'), v.literal('admin')),
    referenceId: v.string(),
    description: v.string(),
    metadata: v.optional(v.object({ xafRate: v.optional(v.number()) })),
  },
  handler: async (ctx, args) => {
    const walletId = await ensureWalletExists(ctx, args.userId)
    const wallet = await ctx.db.get(walletId)
    const b = wallet as any
    const newBalance = b.balanceCents + args.amountCents

    await ctx.db.patch(walletId, { balanceCents: newBalance, updatedAt: Date.now() })
    await ctx.db.insert('wallet_ledger_entries', {
      walletId,
      type: 'credit',
      amountCents: args.amountCents,
      balanceAfterCents: newBalance,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      description: args.description,
      metadata: args.metadata,
      createdAt: Date.now(),
    })

    return { walletId, balanceCents: newBalance }
  },
})

export const internalDebitWallet = internalMutation({
  args: {
    userId: v.string(),
    amountCents: v.number(),
    referenceType: v.union(v.literal('payment_intent'), v.literal('escrow'), v.literal('order'), v.literal('admin')),
    referenceId: v.string(),
    description: v.string(),
    metadata: v.optional(v.object({ xafRate: v.optional(v.number()) })),
  },
  handler: async (ctx, args) => {
    const walletId = await ensureWalletExists(ctx, args.userId)
    const wallet = await ctx.db.get(walletId)
    const b = wallet as any
    if (b.balanceCents < args.amountCents) throw new Error('Insufficient balance')

    const newBalance = b.balanceCents - args.amountCents

    await ctx.db.patch(walletId, { balanceCents: newBalance, updatedAt: Date.now() })
    await ctx.db.insert('wallet_ledger_entries', {
      walletId,
      type: 'debit',
      amountCents: -args.amountCents,
      balanceAfterCents: newBalance,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      description: args.description,
      metadata: args.metadata,
      createdAt: Date.now(),
    })

    return { walletId, balanceCents: newBalance }
  },
})

export const getWalletByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    if (identity.subject !== args.userId) throw new Error('Unauthorized')
    return await ctx.db
      .query('wallets')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .first()
  },
})

export const getAllWallets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx)
    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) => q.eq('betterAuthUserId', identity.subject))
      .first()
    if (!user?.isAdmin) throw new Error('Unauthorized: admin access required')
    return await ctx.db.query('wallets').order('desc').take(100)
  },
})
