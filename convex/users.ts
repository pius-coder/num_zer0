import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const getAccessStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { isExpired: true, remainingMs: 0, user: null }
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', identity.subject)
      )
      .unique()

    if (!user) {
      return { isExpired: true, remainingMs: 0, user: null }
    }

    if (!user.isAnonymous || !user.accessExpiresAt) {
      return { isExpired: false, remainingMs: Infinity, user }
    }

    const now = Date.now()
    const remainingMs = user.accessExpiresAt - now

    return {
      isExpired: remainingMs <= 0,
      remainingMs: Math.max(0, remainingMs),
      user,
    }
  },
})

export const syncUser = mutation({
  args: {
    betterAuthUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    isAnonymous: v.boolean(),
    accessExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', args.betterAuthUserId)
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email,
        name: args.name ?? existing.name,
        isAnonymous: args.isAnonymous,
        accessExpiresAt: args.accessExpiresAt ?? existing.accessExpiresAt,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert('users', {
      betterAuthUserId: args.betterAuthUserId,
      email: args.email,
      name: args.name,
      isAnonymous: args.isAnonymous,
      accessExpiresAt: args.accessExpiresAt,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const convertToPermanent = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', identity.subject)
      )
      .unique()

    if (!user) throw new Error('User not found')
    if (!user.isAnonymous) throw new Error('Account is already permanent')
    if (user.convertedAt) throw new Error('Account already converted')

    const now = Date.now()
    await ctx.db.patch(user._id, {
      email: args.email,
      name: args.name,
      isAnonymous: false,
      convertedAt: now,
      accessExpiresAt: undefined,
      updatedAt: now,
    })

    return { success: true, userId: user._id }
  },
})

export const hasAccess = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return false

    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', identity.subject)
      )
      .unique()

    if (!user) return false

    if (!user.isAnonymous) return true

    if (!user.accessExpiresAt) return true

    return Date.now() < user.accessExpiresAt
  },
})
