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
    return await ctx.db.query('packages').order('desc').collect()
  },
})

export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    priceXaf: v.number(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ra(ctx)
    return await ctx.db.insert('packages', {
      slug: args.slug,
      name: args.name,
      priceXaf: args.priceXaf,
      description: args.description,
      isActive: args.isActive,
    })
  },
})

export const update = mutation({
  args: {
    packageId: v.id('packages'),
    slug: v.optional(v.string()),
    name: v.optional(v.string()),
    priceXaf: v.optional(v.number()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ra(ctx)
    const { packageId, ...patch } = args
    const updates: Record<string, unknown> = {}
    if (patch.slug !== undefined) updates.slug = patch.slug
    if (patch.name !== undefined) updates.name = patch.name
    if (patch.priceXaf !== undefined) updates.priceXaf = patch.priceXaf
    if (patch.description !== undefined) updates.description = patch.description
    if (patch.isActive !== undefined) updates.isActive = patch.isActive
    await ctx.db.patch(packageId, updates)
    return { success: true }
  },
})

export const delete_ = mutation({
  args: { packageId: v.id('packages') },
  handler: async (ctx, args) => {
    await ra(ctx)
    await ctx.db.delete(args.packageId)
    return { success: true }
  },
})
