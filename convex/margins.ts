import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
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
    return await ctx.db.query('marginOverrides').order('desc').collect()
  },
})

export const create = mutation({
  args: {
    countryIso: v.string(),
    serviceId: v.string(),
    marginXaf: v.number(),
  },
  handler: async (ctx, args) => {
    const { identity } = await ra(ctx)
    return await ctx.db.insert('marginOverrides', {
      countryIso: args.countryIso,
      serviceId: args.serviceId,
      marginXaf: args.marginXaf,
      updatedBy: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    marginId: v.id('marginOverrides'),
    countryIso: v.optional(v.string()),
    serviceId: v.optional(v.string()),
    marginXaf: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity } = await ra(ctx)
    const { marginId, ...patch } = args
    const updates: Record<string, unknown> = { updatedAt: Date.now(), updatedBy: identity.subject }
    if (patch.countryIso !== undefined) updates.countryIso = patch.countryIso
    if (patch.serviceId !== undefined) updates.serviceId = patch.serviceId
    if (patch.marginXaf !== undefined) updates.marginXaf = patch.marginXaf
    await ctx.db.patch(marginId, updates)
    return { success: true }
  },
})

export const delete_ = mutation({
  args: { marginId: v.id('marginOverrides') },
  handler: async (ctx, args) => {
    await ra(ctx)
    await ctx.db.delete(args.marginId)
    return { success: true }
  },
})
