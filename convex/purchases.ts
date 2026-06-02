import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

const FAPSHI_API_BASE = process.env.FAPSHI_ENV === 'live'
  ? 'https://live.fapshi.com'
  : 'https://sandbox.fapshi.com'

async function fapshiPost(path: string, body: Record<string, unknown>) {
  const apiUser = process.env.FAPSHI_API_USER!
  const apiKey = process.env.FAPSHI_API_KEY!
  const res = await fetch(`${FAPSHI_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      apiuser: apiUser,
      apikey: apiKey,
      'Content-Type': 'application/json',
    },
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

function getUserId(identity: { subject: string } | null): string {
  if (!identity) throw new Error('Not authenticated')
  return identity.subject
}

export const getPackages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('packages')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect()
  },
})

export const getPurchases = query({
  args: {},
  handler: async (ctx) => {
    const userId = getUserId(await ctx.auth.getUserIdentity())
    return await ctx.db
      .query('purchases')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .order('desc')
      .take(50)
  },
})

export const createPurchase = mutation({
  args: {
    packageId: v.string(),
    paymentMethod: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = getUserId(await ctx.auth.getUserIdentity())

    const existing = await ctx.db
      .query('purchases')
      .withIndex('by_idempotencyKey', (q) => q.eq('idempotencyKey', args.idempotencyKey))
      .unique()
    if (existing) {
      return { purchase: existing, payment: null }
    }

    const pack = await ctx.db
      .query('packages')
      .filter((q) =>
        q.and(
          q.eq(q.field('slug'), args.packageId),
          q.eq(q.field('isActive'), true),
        ),
      )
      .first()
    if (!pack) throw new Error('Package not found')

    const purchaseId = await ctx.db.insert('purchases', {
      userId,
      packageId: pack._id,
      priceXaf: pack.priceXaf,
      paymentMethod: args.paymentMethod,
      status: 'payment_pending',
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
    })

    const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').trim()
    const email = (process.env.FAPSHI_DEFAULT_EMAIL || 'numzero@gmail.com').trim()
    const amount = Math.floor(pack.priceXaf)

    if (amount <= 0) throw new Error('Invalid purchase amount')

    try {
      const result = await fapshiPost('/initiate-pay', {
        amount,
        email,
        userId,
        externalId: args.idempotencyKey,
        redirectUrl: `${siteUrl}/wallet?transId=${purchaseId}`,
      })

      await ctx.db.patch(purchaseId, {
        checkoutUrl: result.link,
        paymentGatewayId: result.transId,
      })

      const purchase = await ctx.db.get(purchaseId)
      return {
        purchase,
        payment: { link: result.link, transId: result.transId },
      }
    } catch (err) {
      await ctx.db.patch(purchaseId, {
        status: 'failed',
        failureReason: err instanceof Error ? err.message : 'Fapshi error',
        failedAt: Date.now(),
      })
      throw err
    }
  },
})

export const verifyPurchase = mutation({
  args: { transId: v.string() },
  handler: async (ctx, args) => {
    const userId = getUserId(await ctx.auth.getUserIdentity())

    const purchase = await ctx.db
      .query('purchases')
      .withIndex('by_paymentGatewayId', (q) => q.eq('paymentGatewayId', args.transId))
      .unique()
    if (!purchase) throw new Error('Purchase not found')
    if (purchase.userId !== userId) throw new Error('Forbidden')

    const fapshiTx = await fapshiGet(`/payment-status/${args.transId}`)
    const fapshiStatus: string = (fapshiTx as any).status

    if (fapshiStatus !== 'SUCCESSFUL') {
      if (fapshiStatus === 'FAILED') {
        await ctx.db.patch(purchase._id, {
          status: 'failed',
          failedAt: Date.now(),
          failureReason: 'Payment failed on Fapshi',
        })
      }
      return { success: false, status: fapshiStatus }
    }

    await ctx.db.patch(purchase._id, {
      status: 'confirmed',
    })

    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) => q.eq('betterAuthUserId', userId))
      .unique()
    if (user && !user.hasMadeDeposit) {
      await ctx.db.patch(user._id, {
        hasMadeDeposit: true,
        updatedAt: Date.now(),
      })
    }

    return { success: true, purchaseId: purchase._id }
  },
})

export const cancelPurchase = mutation({
  args: { purchaseId: v.id('purchases') },
  handler: async (ctx, args) => {
    const userId = getUserId(await ctx.auth.getUserIdentity())
    const purchase = await ctx.db.get(args.purchaseId)
    if (!purchase || purchase.userId !== userId) throw new Error('Purchase not found')
    if (purchase.status === 'confirmed') throw new Error('Purchase already confirmed')

    await ctx.db.patch(args.purchaseId, {
      status: 'failed',
      failedAt: Date.now(),
      failureReason: 'Cancelled by user',
    })

    return { success: true }
  },
})
