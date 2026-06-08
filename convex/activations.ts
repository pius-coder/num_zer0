import { mutation, query, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { requireAuth } from './lib/auth_helpers'
import { isoToNumeric } from './sms_countries'

const MAX_CONCURRENT_ACTIVATIONS = 3

function toCents(usd: number): number {
  return Math.round(usd * 100)
}

function fromCents(cents: number): number {
  return cents / 100
}

function getUsdPrice(args: { maxPrice?: number }): number {
  return args.maxPrice ?? 0.50
}

const ACTIVE_STATUSES = ['awaiting_number', 'awaiting_sms', 'sms_received'] as const

import type { MutationCtx } from './_generated/server'

async function checkConcurrentLimit(ctx: MutationCtx, userId: string): Promise<void> {
  const activeCount = await ctx.db
    .query('activations')
    .withIndex('by_userId_status', (q) =>
      q.eq('userId', userId).eq('status', 'awaiting_sms'),
    )
    .collect()
  if (activeCount.length >= MAX_CONCURRENT_ACTIVATIONS) {
    throw new Error('Maximum 3 activations simultanées atteint')
  }
}

async function checkWalletBalance(ctx: MutationCtx, userId: string, priceUsd: number): Promise<void> {
  const wallet = await ctx.db
    .query('wallets')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first()
  if (!wallet) throw new Error('Portefeuille introuvable. Veuillez recharger.')
  const priceCents = toCents(priceUsd)
  if (wallet.balanceCents < priceCents) throw new Error('Solde insuffisant')
}

export const initiateActivation = mutation({
  args: {
    service: v.string(),
    country: v.string(),
    maxPrice: v.optional(v.number()),
    operator: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const userId = identity.subject
    const now = Date.now()
    const priceUsd = getUsdPrice(args)

    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) throw new Error(`Invalid country code: ${args.country}`)

    await checkWalletBalance(ctx, userId, priceUsd)
    await checkConcurrentLimit(ctx, userId)

    const activationId = await ctx.db.insert('activations', {
      userId,
      service: args.service,
      country: args.country,
      providerId: undefined,
      phoneNumber: undefined,
      status: 'awaiting_number',
      maxPrice: priceUsd,
      operator: args.operator,
      smsCode: undefined,
      canGetAnotherSms: false,
      rentEndTime: undefined,
      providerCost: undefined,
      priceCharged: priceUsd,
      errorMessage: undefined,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.runMutation(internal.escrows.internalHoldEscrow, {
      userId,
      activationId,
      amountCents: toCents(priceUsd),
      description: `Mise en séquestre activation ${activationId}`,
    })

    await ctx.scheduler.runAfter(0, internal.sms_provider.pollActivation, {
      activationId,
    })

    return { activationId }
  },
})

export const initiateRentalActivation = mutation({
  args: {
    service: v.string(),
    country: v.string(),
    rentTimeHours: v.number(),
    maxPrice: v.optional(v.number()),
    operator: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const userId = identity.subject
    const now = Date.now()
    const priceUsd = getUsdPrice(args)

    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) throw new Error(`Invalid country code: ${args.country}`)

    await checkWalletBalance(ctx, userId, priceUsd)
    await checkConcurrentLimit(ctx, userId)

    const activationId = await ctx.db.insert('activations', {
      userId,
      service: args.service,
      country: args.country,
      providerId: undefined,
      phoneNumber: undefined,
      status: 'awaiting_number',
      maxPrice: priceUsd,
      operator: args.operator,
      smsCode: undefined,
      canGetAnotherSms: false,
      rentEndTime: undefined,
      rentTimeHours: args.rentTimeHours,
      rentProviderId: undefined,
      rentEndDate: undefined,
      providerCost: undefined,
      priceCharged: priceUsd,
      errorMessage: undefined,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.runMutation(internal.escrows.internalHoldEscrow, {
      userId,
      activationId,
      amountCents: toCents(priceUsd),
      description: `Mise en séquestre location ${activationId}`,
    })

    await ctx.scheduler.runAfter(0, internal.sms_provider.pollRentalActivation, {
      activationId,
    })

    return { activationId }
  },
})

export const completeActivation = mutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const userId = identity.subject

    const activation = await ctx.db.get(args.activationId)
    if (!activation || activation.userId !== userId) throw new Error('Activation introuvable')
    if (activation.status !== 'sms_received') throw new Error("L'activation n'est pas en état SMS reçu")
    if (!activation.providerId && !activation.rentProviderId) throw new Error('Pas de numéro de provider')

    if (activation.rentTimeHours) {
      await ctx.scheduler.runAfter(0, internal.sms_provider.completeRentalAction, {
        activationId: args.activationId,
      })
    } else {
      await ctx.scheduler.runAfter(0, internal.sms_provider.completeActivationAction, {
        activationId: args.activationId,
      })
    }

    return { success: true }
  },
})

export const cancelActivation = mutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const userId = identity.subject

    const activation = await ctx.db.get(args.activationId)
    if (!activation || activation.userId !== userId) throw new Error('Activation introuvable')
    if (['completed', 'cancelled', 'expired'].includes(activation.status)) {
      throw new Error("L'activation est déjà terminée")
    }

    await ctx.db.patch(args.activationId, {
      status: 'cancelled',
      errorMessage: "Annulé par l'utilisateur",
      updatedAt: Date.now(),
    })

    await ctx.runMutation(internal.escrows.internalRefundEscrow, {
      activationId: args.activationId,
    })

    await ctx.scheduler.runAfter(0, internal.sms_provider.cancelActivationAction, {
      activationId: args.activationId,
    })

    return { success: true }
  },
})

export const requestAnotherSms = mutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const userId = identity.subject

    const activation = await ctx.db.get(args.activationId)
    if (!activation || activation.userId !== userId) throw new Error('Activation introuvable')
    if (activation.status !== 'sms_received' && activation.status !== 'awaiting_sms') {
      throw new Error('Impossible de redemander un SMS dans cet état')
    }
    if (!activation.canGetAnotherSms) {
      throw new Error('Ce numéro ne permet pas de redemander un SMS')
    }
    if (!activation.providerId) throw new Error('Pas de numéro de provider')

    await ctx.db.patch(args.activationId, {
      status: 'awaiting_sms',
      smsCode: undefined,
      updatedAt: Date.now(),
    })

    await ctx.scheduler.runAfter(0, internal.sms_provider.resendSmsAction, {
      activationId: args.activationId,
    })

    return { success: true }
  },
})

export const getActivation = query({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const userId = identity.subject

    const activation = await ctx.db.get(args.activationId)
    if (!activation) throw new Error('Activation introuvable')
    if (activation.userId !== userId) throw new Error('Non autorisé')

    return activation
  },
})

export const getMyActivations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    return await ctx.db
      .query('activations')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(50)
  },
})

export const internalRefundEscrowV2 = internalMutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.escrows.internalRefundEscrow, {
      activationId: args.activationId,
    })
  },
})
