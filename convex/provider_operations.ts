import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

export const logOperation = internalMutation({
  args: {
    provider: v.string(),
    operation: v.string(),
    request: v.string(),
    response: v.string(),
    status: v.union(v.literal('success'), v.literal('error')),
    referenceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('provider_operations', {
      provider: args.provider,
      operation: args.operation,
      request: args.request,
      response: args.response,
      status: args.status,
      referenceId: args.referenceId,
      createdAt: Date.now(),
    })
  },
})

export const getByReference = query({
  args: { referenceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('provider_operations')
      .withIndex('by_referenceId', (q) => q.eq('referenceId', args.referenceId))
      .order('desc')
      .take(50)
  },
})
