import { query } from './_generated/server'
import { v } from 'convex/values'
import { requireAuth } from './lib/auth_helpers'

export const getUserOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx)
    const paymentIntents = await ctx.db
      .query('payment_intents')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(50)
    return paymentIntents
  },
})

export const getOrderById = query({
  args: { id: v.id('payment_intents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getPaymentIntentByGateway = query({
  args: { gatewayTransactionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payment_intents')
      .withIndex('by_gatewayTransactionId', (q) => q.eq('gatewayTransactionId', args.gatewayTransactionId))
      .first()
  },
})

export const getOrderByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payment_intents')
      .withIndex('by_idempotencyKey', (q) => q.eq('idempotencyKey', args.externalId))
      .first()
  },
})
