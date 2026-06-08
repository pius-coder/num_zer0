import { action, query, internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { requireAuth } from './lib/auth_helpers'

const FAPSHI_API_BASE =
  process.env.FAPSHI_ENV === 'live' ? 'https://live.fapshi.com' : 'https://sandbox.fapshi.com'

async function fapshiPost(path: string, body: Record<string, unknown>) {
  const apiUser = process.env.FAPSHI_API_USER!
  const apiKey = process.env.FAPSHI_API_KEY!
  const res = await fetch(`${FAPSHI_API_BASE}${path}`, {
    method: 'POST',
    headers: { apiuser: apiUser, apikey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fapshi error ${res.status}: ${text}`)
  }
  return res.json()
}

async function fapshiGet(path: string) {
  const apiUser = process.env.FAPSHI_API_USER!
  const apiKey = process.env.FAPSHI_API_KEY!
  const res = await fetch(`${FAPSHI_API_BASE}${path}`, {
    headers: { apiuser: apiUser, apikey: apiKey },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fapshi error ${res.status}: ${text}`)
  }
  return res.json()
}

export const internalCreatePaymentIntent = internalMutation({
  args: {
    userId: v.string(),
    amountCents: v.number(),
    xafAmount: v.number(),
    xafRate: v.number(),
    idempotencyKey: v.string(),
    metadata: v.optional(v.object({
      phone: v.optional(v.string()),
      paymentMethod: v.optional(v.string()),
      promoCode: v.optional(v.string()),
      promoDiscount: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('payment_intents')
      .withIndex('by_idempotencyKey', (q) => q.eq('idempotencyKey', args.idempotencyKey))
      .first()
    if (existing) return existing._id

    const now = Date.now()
    return await ctx.db.insert('payment_intents', {
      userId: args.userId,
      amountCents: args.amountCents,
      currency: 'USD',
      status: 'pending',
      gateway: 'fapshi',
      gatewayTransactionId: undefined,
      idempotencyKey: args.idempotencyKey,
      xafAmount: args.xafAmount,
      xafRate: args.xafRate,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const internalMarkPaymentProcessing = internalMutation({
  args: {
    paymentIntentId: v.id('payment_intents'),
    gatewayTransactionId: v.string(),
  },
  handler: async (ctx, args) => {
    const pi = await ctx.db.get(args.paymentIntentId)
    if (!pi) throw new Error('Payment intent not found')
    if (pi.status !== 'pending') return

    await ctx.db.patch(args.paymentIntentId, {
      status: 'processing',
      gatewayTransactionId: args.gatewayTransactionId,
      updatedAt: Date.now(),
    })
  },
})

export const internalMarkPaymentFailed = internalMutation({
  args: {
    paymentIntentId: v.id('payment_intents'),
    failureReason: v.string(),
  },
  handler: async (ctx, args) => {
    const pi = await ctx.db.get(args.paymentIntentId)
    if (!pi) throw new Error('Payment intent not found')
    if (pi.status === 'succeeded' || pi.status === 'failed') return

    await ctx.db.patch(args.paymentIntentId, {
      status: 'failed',
      failureReason: args.failureReason,
      updatedAt: Date.now(),
    })
  },
})

export const internalConfirmPaymentIntent = internalMutation({
  args: {
    paymentIntentId: v.id('payment_intents'),
  },
  handler: async (ctx, args): Promise<{ id: string; status: string; alreadyConfirmed: boolean }> => {
    const pi = await ctx.db.get(args.paymentIntentId)
    if (!pi) throw new Error('Payment intent not found')

    if (pi.status === 'succeeded') return { id: pi._id, status: 'succeeded', alreadyConfirmed: true }

    if (pi.status !== 'processing' && pi.status !== 'pending') {
      throw new Error(`Cannot confirm payment in status: ${pi.status}`)
    }

    await ctx.db.patch(args.paymentIntentId, {
      status: 'succeeded',
      updatedAt: Date.now(),
    })

    const walletResult = await ctx.runMutation(internal.wallet.internalCreditWallet, {
      userId: (pi as any).userId,
      amountCents: (pi as any).amountCents,
      referenceType: 'payment_intent',
      referenceId: pi._id,
      description: `Recharge wallet`,
      metadata: { xafRate: (pi as any).xafRate },
    }) as any

    await ctx.db.insert('orders', {
      userId: (pi as any).userId,
      type: 'recharge',
      status: 'completed',
      amountCents: (pi as any).amountCents,
      paymentIntentId: pi._id,
      description: `Recharge wallet`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return { id: pi._id, status: 'succeeded', alreadyConfirmed: false }
  },
})

export const internalExpirePaymentIntent = internalMutation({
  args: { paymentIntentId: v.id('payment_intents') },
  handler: async (ctx, args) => {
    const pi = await ctx.db.get(args.paymentIntentId)
    if (!pi) throw new Error('Payment intent not found')
    if (pi.status === 'pending' || pi.status === 'processing') {
      await ctx.db.patch(args.paymentIntentId, { status: 'expired', updatedAt: Date.now() })
    }
  },
})

export const internalCancelPaymentIntent = internalMutation({
  args: { paymentIntentId: v.id('payment_intents') },
  handler: async (ctx, args) => {
    const pi = await ctx.db.get(args.paymentIntentId)
    if (!pi) throw new Error('Payment intent not found')
    if (pi.status === 'pending') {
      await ctx.db.patch(args.paymentIntentId, { status: 'cancelled', updatedAt: Date.now() })
    }
  },
})

export const internalGetPaymentIntentById = internalQuery({
  args: { id: v.id('payment_intents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const internalGetPaymentIntentByGatewayId = internalQuery({
  args: { gatewayTransactionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payment_intents')
      .withIndex('by_gatewayTransactionId', (q) => q.eq('gatewayTransactionId', args.gatewayTransactionId))
      .first()
  },
})

export const initiatePayment = action({
  args: {
    amountCents: v.number(),
    xafAmount: v.number(),
    idempotencyKey: v.string(),
    metadata: v.optional(v.object({
      phone: v.optional(v.string()),
      paymentMethod: v.optional(v.string()),
      promoCode: v.optional(v.string()),
      promoDiscount: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args): Promise<{ success: boolean; checkoutUrl?: string; transId?: string; paymentIntentId?: string; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const userId = identity.subject

    const xafRate = 600
    const paymentIntentId = await ctx.runMutation(internal.payment_intents.internalCreatePaymentIntent, {
      userId,
      amountCents: args.amountCents,
      xafAmount: args.xafAmount,
      xafRate,
      idempotencyKey: args.idempotencyKey,
      metadata: args.metadata,
    }) as Id<'payment_intents'>

    try {
      const fapshiResult = await fapshiPost('/initiate-pay', {
        amount: args.xafAmount,
        email: 'zer0num237@gmail.com',
        userId,
        externalId: args.idempotencyKey,
        redirectUrl: `${process.env.SITE_URL}/payment/result`,
        message: 'Recharge num_zer0',
      })

      await ctx.runMutation(internal.payment_intents.internalMarkPaymentProcessing, {
        paymentIntentId,
        gatewayTransactionId: fapshiResult.transId,
      })

      await ctx.runMutation(internal.provider_operations.logOperation, {
        provider: 'fapshi',
        operation: 'initiate-pay',
        request: JSON.stringify({ amount: args.xafAmount, userId, externalId: args.idempotencyKey }),
        response: JSON.stringify(fapshiResult),
        status: 'success',
        referenceId: paymentIntentId,
      })

      return {
        success: true,
        checkoutUrl: fapshiResult.link,
        transId: fapshiResult.transId,
        paymentIntentId,
      }
    } catch (err: any) {
      await ctx.runMutation(internal.payment_intents.internalMarkPaymentFailed, {
        paymentIntentId,
        failureReason: err.message || 'Fapshi initiation failed',
      })

      await ctx.runMutation(internal.provider_operations.logOperation, {
        provider: 'fapshi',
        operation: 'initiate-pay',
        request: JSON.stringify({ amount: args.xafAmount, userId, externalId: args.idempotencyKey }),
        response: JSON.stringify({ error: err.message }),
        status: 'error',
        referenceId: paymentIntentId,
      })

      return { success: false, error: err.message, paymentIntentId }
    }
  },
})

export const verifyPaymentIntent = action({
  args: { gatewayTransactionId: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; status: string; alreadyConfirmed?: boolean; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    try {
      const statusResult = await fapshiGet(`/payment-status/${args.gatewayTransactionId}`)

      if (statusResult.status === 'SUCCESSFUL') {
        const pi = await ctx.runQuery(internal.payment_intents.internalGetPaymentIntentByGatewayId, {
          gatewayTransactionId: args.gatewayTransactionId,
        })

        if (pi) {
          const result = await ctx.runMutation(internal.payment_intents.internalConfirmPaymentIntent, {
            paymentIntentId: pi._id,
          }) as any
          return { success: true, status: 'succeeded', alreadyConfirmed: result.alreadyConfirmed }
        }
        return { success: false, status: 'no_payment_found' }
      }

      if (statusResult.status === 'FAILED' || statusResult.status === 'EXPIRED') {
        const pi = await ctx.runQuery(internal.payment_intents.internalGetPaymentIntentByGatewayId, {
          gatewayTransactionId: args.gatewayTransactionId,
        })
        if (pi) {
          await ctx.runMutation(internal.payment_intents.internalMarkPaymentFailed, {
            paymentIntentId: pi._id,
            failureReason: `Fapshi status: ${statusResult.status}`,
          })
        }
        return { success: false, status: statusResult.status.toLowerCase() }
      }

      return { success: false, status: 'pending' }
    } catch (err: any) {
      return { success: false, status: 'error', error: err.message }
    }
  },
})

export const listPaymentIntents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx)
    return await ctx.db
      .query('payment_intents')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(50)
  },
})

export const listAllPaymentIntents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx)
    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) => q.eq('betterAuthUserId', identity.subject))
      .first()
    if (!user?.isAdmin) throw new Error('Unauthorized: admin access required')
    return await ctx.db.query('payment_intents').order('desc').take(100)
  },
})
