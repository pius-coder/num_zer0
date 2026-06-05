import type { MutationCtx } from './_generated/server'
import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { requireAdmin as ra } from './lib/auth_helpers'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Non authentifié')
    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) => q.eq('betterAuthUserId', identity.subject))
      .first()
    if (!user?.isAdmin) throw new Error('Non autorisé — Administrateur uniquement')
    return await ctx.db.query('promoCodes').order('desc').collect()
  },
})

export const create = mutation({
  args: {
    code: v.string(),
    discountPercent: v.optional(v.number()),
    discountFlat: v.optional(v.number()),
    isActive: v.boolean(),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ra(ctx)
    return await ctx.db.insert('promoCodes', {
      code: args.code.toUpperCase(),
      discountPercent: args.discountPercent,
      discountFlat: args.discountFlat,
      isActive: args.isActive,
      maxUses: args.maxUses,
      usedCount: 0,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    promoId: v.id('promoCodes'),
    code: v.optional(v.string()),
    discountPercent: v.optional(v.number()),
    discountFlat: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ra(ctx)
    const { promoId, ...patch } = args
    const updates: Record<string, unknown> = {}
    if (patch.code !== undefined) updates.code = patch.code.toUpperCase()
    if (patch.discountPercent !== undefined) updates.discountPercent = patch.discountPercent
    if (patch.discountFlat !== undefined) updates.discountFlat = patch.discountFlat
    if (patch.isActive !== undefined) updates.isActive = patch.isActive
    if (patch.maxUses !== undefined) updates.maxUses = patch.maxUses
    if (patch.expiresAt !== undefined) updates.expiresAt = patch.expiresAt
    await ctx.db.patch(promoId, updates)
    return { success: true }
  },
})

export const delete_ = mutation({
  args: { promoId: v.id('promoCodes') },
  handler: async (ctx, args) => {
    await ra(ctx)
    await ctx.db.delete(args.promoId)
    return { success: true }
  },
})
