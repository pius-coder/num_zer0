import { query, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

export const internalHoldEscrow = internalMutation({
  args: {
    userId: v.string(),
    activationId: v.id('activations'),
    amountCents: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('escrows')
      .withIndex('by_activationId', (q) => q.eq('activationId', args.activationId))
      .first()
    if (existing) return existing._id

    const walletResult = await ctx.runMutation(internal.wallet.internalDebitWallet, {
      userId: args.userId,
      amountCents: args.amountCents,
      referenceType: 'escrow',
      referenceId: args.activationId,
      description: args.description,
    })

    const now = Date.now()
    return await ctx.db.insert('escrows', {
      userId: args.userId,
      activationId: args.activationId,
      amountCents: args.amountCents,
      status: 'held',
      description: args.description,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const internalReleaseEscrow = internalMutation({
  args: {
    activationId: v.id('activations'),
    providerCostCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const escrow = await ctx.db
      .query('escrows')
      .withIndex('by_activationId', (q) => q.eq('activationId', args.activationId))
      .first()
    if (!escrow) throw new Error('Escrow not found')
    if (escrow.status !== 'held') throw new Error(`Escrow already ${escrow.status}`)

    const wallet = await ctx.db
      .query('wallets')
      .withIndex('by_userId', (q) => q.eq('userId', escrow.userId))
      .first()
    if (!wallet) throw new Error('Wallet not found for escrow user')

    const marginCents = args.providerCostCents
      ? escrow.amountCents - args.providerCostCents
      : 0

    const now = Date.now()
    await ctx.db.patch(escrow._id, {
      status: 'released',
      providerCostCents: args.providerCostCents,
      marginCents,
      updatedAt: now,
    })

    await ctx.db.insert('wallet_ledger_entries', {
      walletId: wallet._id,
      type: 'release',
      amountCents: 0,
      balanceAfterCents: 0,
      referenceType: 'escrow',
      referenceId: escrow._id,
      description: 'Activation completed, funds captured',
      createdAt: now,
    })

    return { id: escrow._id, status: 'released', marginCents }
  },
})

export const internalRefundEscrow = internalMutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const escrow = await ctx.db
      .query('escrows')
      .withIndex('by_activationId', (q) => q.eq('activationId', args.activationId))
      .first()
    if (!escrow) throw new Error('Escrow not found')
    if (escrow.status !== 'held') throw new Error(`Escrow already ${escrow.status}, cannot refund`)

    const walletResult = await ctx.runMutation(internal.wallet.internalCreditWallet, {
      userId: escrow.userId,
      amountCents: escrow.amountCents,
      referenceType: 'escrow',
      referenceId: escrow._id,
      description: 'Activation cancelled, escrow refunded',
    })

    const now = Date.now()
    await ctx.db.patch(escrow._id, {
      status: 'refunded',
      updatedAt: now,
    })

    return { id: escrow._id, status: 'refunded' }
  },
})

export const getEscrowByActivation = query({
  args: { activationId: v.id('activations') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('escrows')
      .withIndex('by_activationId', (q) => q.eq('activationId', args.activationId))
      .first()
  },
})

export const getActiveEscrows = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('escrows')
      .withIndex('by_status', (q) => q.eq('status', 'held'))
      .order('desc')
      .take(100)
  },
})
