import { query, mutation, action, internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id, Doc } from './_generated/dataModel'

const FAPSHI_API_BASE =
  process.env.FAPSHI_ENV === 'live' ? 'https://live.fapshi.com' : 'https://sandbox.fapshi.com'

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

export const validatePromoCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    if (!args.code.trim()) return null
    const promo = await ctx.db
      .query('promoCodes')
      .withIndex('by_code', (q) => q.eq('code', args.code.toUpperCase()))
      .first()
    if (!promo || !promo.isActive) return null
    if (promo.maxUses && promo.usedCount >= promo.maxUses) return null
    if (promo.expiresAt && promo.expiresAt < Date.now()) return null
    return {
      code: promo.code,
      discountPercent: promo.discountPercent,
      discountFlat: promo.discountFlat,
    }
  },
})

export const handlePaymentSuccess = mutation({
  args: { transId: v.string(), externalId: v.string() },
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query('purchases')
      .withIndex('by_paymentGatewayId', (q) => q.eq('paymentGatewayId', args.transId))
      .unique()
    if (!purchase) return

    if (purchase.status === 'confirmed') return
    await ctx.db.patch(purchase._id, { status: 'confirmed' })

    const creditUsd = Math.round((purchase.priceXaf / 600) * 100) / 100

    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) => q.eq('betterAuthUserId', purchase.userId))
      .unique()

    const now = Date.now()
    if (!user) {
      await ctx.db.insert('users', {
        betterAuthUserId: purchase.userId,
        isAnonymous: true,
        hasMadeDeposit: true,
        accessExpiresAt: now + 48 * 60 * 60 * 1000,
        balanceUsd: creditUsd,
        createdAt: now,
        updatedAt: now,
      })
    } else {
      await ctx.db.patch(user._id, {
        hasMadeDeposit: true,
        accessExpiresAt: now + 48 * 60 * 60 * 1000,
        updatedAt: now,
      })
    }

    await ctx.runMutation(internal.comptabilite.ensureCompte, {
      code: `411-${purchase.userId}`,
      libelle: `Client ${purchase.userId.slice(0, 8)}`,
    })
    await ctx.runMutation(internal.comptabilite.ensureCompte, {
      code: '701-recharge',
      libelle: 'Produit recharges',
    })

    await ctx.runMutation(internal.comptabilite.createPiece, {
      libelle: `Recharge ${purchase.priceXaf.toLocaleString('fr-FR')} FCFA`,
      statut: 'validee',
      reference: purchase._id,
      lignes: [
        { compteCode: `411-${purchase.userId}`, sens: 'debit', montant: creditUsd },
        { compteCode: '701-recharge', sens: 'credit', montant: creditUsd },
      ],
    })
  },
})

export const handlePaymentFailure = mutation({
  args: { transId: v.string(), externalId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query('purchases')
      .withIndex('by_paymentGatewayId', (q) => q.eq('paymentGatewayId', args.transId))
      .unique()
    if (!purchase) return

    await ctx.db.patch(purchase._id, {
      status: 'failed',
      failureReason: args.reason,
      failedAt: Date.now(),
    })
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

export const internalCreatePurchase = internalMutation({
  args: {
    userId: v.string(),
    priceXaf: v.number(),
    promoCode: v.optional(v.string()),
    promoDiscount: v.optional(v.number()),
    paymentMethod: v.string(),
    idempotencyKey: v.string(),
  },
  returns: v.id('purchases'),
  handler: async (ctx, args) => {
    return await ctx.db.insert('purchases', {
      userId: args.userId,
      packageId: 'recharge',
      priceXaf: args.priceXaf,
      promoCode: args.promoCode,
      promoDiscount: args.promoDiscount,
      paymentMethod: args.paymentMethod,
      status: 'payment_pending',
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
    })
  },
})

export const internalPatchPurchase = internalMutation({
  args: {
    purchaseId: v.id('purchases'),
    patch: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.purchaseId, args.patch)
  },
})

export const internalGetPurchaseByGatewayId = internalQuery({
  args: { transId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('purchases')
      .withIndex('by_paymentGatewayId', (q) => q.eq('paymentGatewayId', args.transId))
      .unique()
  },
})

export const internalGetPurchaseById = internalQuery({
  args: { purchaseId: v.id('purchases') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.purchaseId)
  },
})

export const internalGetPromoCode = internalQuery({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('promoCodes')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .first()
  },
})

export const internalIncrementPromo = internalMutation({
  args: { promoId: v.id('promoCodes') },
  handler: async (ctx, args) => {
    const promo = await ctx.db.get(args.promoId)
    if (!promo) return
    await ctx.db.patch(args.promoId, { usedCount: promo.usedCount + 1 })
  },
})

export const internalGetUserByBetterAuthId = internalQuery({
  args: { betterAuthUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) => q.eq('betterAuthUserId', args.betterAuthUserId))
      .unique()
  },
})

export const internalCreateUser = internalMutation({
  args: {
    betterAuthUserId: v.string(),
    accessExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    await ctx.db.insert('users', {
      betterAuthUserId: args.betterAuthUserId,
      isAnonymous: true,
      hasMadeDeposit: true,
      accessExpiresAt: args.accessExpiresAt,
      balanceUsd: 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const internalUpdateUserDeposit = internalMutation({
  args: { userId: v.id('users'), creditUsd: v.number() },
  handler: async (ctx, args) => {
    const now = Date.now()
    const user = await ctx.db.get(args.userId)
    if (!user) return
    await ctx.db.patch(user._id, {
      hasMadeDeposit: true,
      accessExpiresAt: now + 48 * 60 * 60 * 1000,
      updatedAt: now,
    })
  },
})

export const initiateDirectPay = action({
  args: {
    amount: v.number(),
    phone: v.string(),
    medium: v.optional(v.string()),
    promoCode: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; transId: string; link: string; purchaseId: Id<'purchases'> }> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const userId = identity.subject

    if (args.amount < 1500) throw new Error('Minimum 1500 FCFA')

    let finalAmount = args.amount
    let promoDiscount: number | undefined

    if (args.promoCode) {
      const promo = await ctx.runQuery(internal.purchases.internalGetPromoCode, {
        code: args.promoCode.toUpperCase(),
      })
      if (promo && promo.isActive) {
        if (!promo.maxUses || promo.usedCount < promo.maxUses) {
          if (!promo.expiresAt || promo.expiresAt >= Date.now()) {
            if (promo.discountFlat) {
              promoDiscount = Math.min(promo.discountFlat, args.amount)
              finalAmount = args.amount - promoDiscount
            } else if (promo.discountPercent) {
              promoDiscount = Math.floor((args.amount * promo.discountPercent) / 100)
              finalAmount = args.amount - promoDiscount
            }
            await ctx.runMutation(internal.purchases.internalIncrementPromo, {
              promoId: promo._id,
            })
          }
        }
      }
    }

    const idempotencyKey = `direct_${userId}_${Date.now()}`
    const purchaseId: Id<'purchases'> = await ctx.runMutation(
      internal.purchases.internalCreatePurchase,
      {
        userId,
        priceXaf: finalAmount,
        promoCode: args.promoCode,
        promoDiscount,
        paymentMethod: args.medium || 'mobile money',
        idempotencyKey,
      },
    )

    try {
      const result = await fapshiPost('/initiate-pay', {
        amount: finalAmount,
        email: 'zer0num237@gmail.com',
        userId,
        externalId: idempotencyKey,
        message: 'Recharge num_zer0',
        redirectUrl: `${process.env.VITE_SITE_URL || 'http://localhost:3000'}/payment/result`,
      })

      await ctx.runMutation(internal.purchases.internalPatchPurchase, {
        purchaseId,
        patch: { paymentGatewayId: result.transId },
      })

      return { success: true, transId: result.transId, link: result.link, purchaseId }
    } catch (err) {
      await ctx.runMutation(internal.purchases.internalPatchPurchase, {
        purchaseId,
        patch: {
          status: 'failed',
          failureReason: err instanceof Error ? err.message : 'Fapshi error',
          failedAt: Date.now(),
        },
      })
      throw err
    }
  },
})

export const verifyPurchase = action({
  args: { transId: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; purchaseId?: Id<'purchases'>; status?: string }> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const userId = identity.subject

    const purchase: Doc<'purchases'> | null = await ctx.runQuery(
      internal.purchases.internalGetPurchaseByGatewayId,
      {
        transId: args.transId,
      },
    )
    if (!purchase) throw new Error('Purchase not found')
    if (purchase.userId !== userId) throw new Error('Forbidden')

    const fapshiTx = await fapshiGet(`/payment-status/${args.transId}`)
    const fapshiStatus: string = fapshiTx.status

    if (fapshiStatus !== 'SUCCESSFUL') {
      if (fapshiStatus === 'FAILED') {
        await ctx.runMutation(internal.purchases.internalPatchPurchase, {
          purchaseId: purchase._id,
          patch: {
            status: 'failed',
            failedAt: Date.now(),
            failureReason: 'Payment failed on Fapshi',
          },
        })
      }
      return { success: false, status: fapshiStatus }
    }

    if (purchase.status !== 'confirmed') {
      await ctx.runMutation(internal.purchases.internalPatchPurchase, {
        purchaseId: purchase._id,
        patch: { status: 'confirmed' },
      })

      await ctx.runMutation(internal.comptabilite.ensureCompte, {
        code: `411-${userId}`,
        libelle: `Client ${userId.slice(0, 8)}`,
      })
      await ctx.runMutation(internal.comptabilite.ensureCompte, {
        code: '701-recharge',
        libelle: 'Produit recharges',
      })
      await ctx.runMutation(internal.comptabilite.createPiece, {
        libelle: `Recharge ${purchase.priceXaf.toLocaleString('fr-FR')} FCFA`,
        statut: 'validee',
        reference: purchase._id,
        lignes: [
          {
            compteCode: `411-${userId}`,
            sens: 'debit',
            montant: Math.round((purchase.priceXaf / 600) * 100) / 100,
          },
          {
            compteCode: '701-recharge',
            sens: 'credit',
            montant: Math.round((purchase.priceXaf / 600) * 100) / 100,
          },
        ],
      })
    }

    const creditUsd = Math.round((purchase.priceXaf / 600) * 100) / 100
    const user = await ctx.runQuery(internal.purchases.internalGetUserByBetterAuthId, {
      betterAuthUserId: userId,
    })
    if (user) {
      await ctx.runMutation(internal.purchases.internalUpdateUserDeposit, {
        userId: user._id,
        creditUsd,
      })
    }

    return { success: true, purchaseId: purchase._id }
  },
})

export const backfillComptes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const purchases = await ctx.db.query('purchases').collect()
    const confirmed = purchases.filter((p) => p.status === 'confirmed')
    let piecesCreated = 0

    for (const purchase of confirmed) {
      const existingPiece = await ctx.db
        .query('pieces')
        .filter((q) => q.eq(q.field('reference'), purchase._id))
        .first()
      if (existingPiece) continue

      const creditUsd = Math.round((purchase.priceXaf / 600) * 100) / 100

      await ctx.runMutation(internal.comptabilite.ensureCompte, {
        code: `411-${purchase.userId}`,
        libelle: `Client ${purchase.userId.slice(0, 8)}`,
      })
      await ctx.runMutation(internal.comptabilite.ensureCompte, {
        code: '701-recharge',
        libelle: 'Produit recharges',
      })

      await ctx.runMutation(internal.comptabilite.createPiece, {
        libelle: `Recharge ${purchase.priceXaf.toLocaleString('fr-FR')} FCFA`,
        statut: 'validee',
        reference: purchase._id,
        lignes: [
          { compteCode: `411-${purchase.userId}`, sens: 'debit', montant: creditUsd },
          { compteCode: '701-recharge', sens: 'credit', montant: creditUsd },
        ],
      })
      piecesCreated++
    }

    return { confirmed: confirmed.length, piecesCreated }
  },
})
