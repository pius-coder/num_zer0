import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

const XAF_TO_USD = 600

export function xafToUsd(xaf: number): number {
  return Math.round((xaf / XAF_TO_USD) * 100) / 100
}

export const getUserBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { balanceUsd: 0, userId: null }

    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', identity.subject)
      )
      .unique()

    const compte = await ctx.db
      .query('comptes')
      .withIndex('by_code', (q) => q.eq('code', `411-${identity.subject}`))
      .unique()

    return { balanceUsd: compte?.solde ?? 0, userId: user?._id ?? null }
  },
})

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
    hasMadeDeposit: v.optional(v.boolean()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', args.betterAuthUserId)
      )
      .unique()

    const usersCount = (await ctx.db.query('users').collect()).length
    const isAdmin = args.email?.endsWith('@numzero.com') || args.email === 'admin@gmail.com' || usersCount === 0 || false

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email,
        name: args.name ?? existing.name,
        isAnonymous: args.isAnonymous,
        accessExpiresAt: args.accessExpiresAt ?? existing.accessExpiresAt,
        hasMadeDeposit: args.hasMadeDeposit ?? existing.hasMadeDeposit,
        country: args.country ?? existing.country,
        isAdmin: existing.isAdmin ?? isAdmin,
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
      hasMadeDeposit: args.hasMadeDeposit ?? false,
      balanceUsd: 0,
      country: args.country,
      isAdmin: isAdmin,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const completeDeposit = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', identity.subject)
      )
      .unique()

    if (!user) throw new Error('User not found')

    const now = Date.now()
    const fortyEightHoursMs = 48 * 60 * 60 * 1000

    await ctx.db.patch(user._id, {
      hasMadeDeposit: true,
      accessExpiresAt: now + fortyEightHoursMs,
      updatedAt: now,
    })

    return { success: true }
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

export const checkUserExists = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const emailMatch = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.identifier))
      .unique()
    
    if (emailMatch) {
      return { exists: true }
    }

    const allUsers = await ctx.db.query('users').collect()
    const match = allUsers.find(
      (u) => 
        u.email?.toLowerCase() === args.identifier.toLowerCase() ||
        u.name?.toLowerCase() === args.identifier.toLowerCase()
    )

    return { exists: !!match }
  },
})

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Non authentifié')
    }

    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', identity.subject)
      )
      .unique()

    if (!currentUser || !currentUser.isAdmin) {
      throw new Error('Non autorisé — Administrateur uniquement')
    }

    return await ctx.db.query('users').order('desc').collect()
  },
})

export const updateUserCountry = mutation({
  args: { country: v.string() },
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

    await ctx.db.patch(user._id, {
      country: args.country,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

export const deleteUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const admin = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', identity.subject)
      )
      .unique()

    if (!admin || !admin.isAdmin) {
      throw new Error('Non autorisé — Administrateur uniquement')
    }

    await ctx.db.delete(args.userId)
    return { success: true }
  },
})
