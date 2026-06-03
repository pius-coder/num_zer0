// convex/sms_provider.ts
import { query, mutation, action, internalMutation, internalAction, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { isoToNumeric } from './sms_countries'

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = 'https://sms-online.pro/stubs/handler_api.php'
const MAX_CONCURRENT_ACTIVATIONS = 3
const POLL_INTERVAL_MS = 3000
const ACTIVATION_TIMEOUT_MS = 25 * 60 * 1000 // 25 minutes (provider expire à 20 min)

// ─── Private HTTP Wrappers ────────────────────────────────────────────────────

async function smsProGet(params: Record<string, string>): Promise<string> {
  const apiKey = process.env.SMSONLINEPRO_API_KEY
  if (!apiKey) throw new Error('SMSONLINEPRO_API_KEY not configured')
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', apiKey)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  return res.text()
}

async function smsProGetJson(params: Record<string, string>): Promise<any> {
  const text = await smsProGet(params)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUserId(identity: { subject: string } | null): string {
  if (!identity) throw new Error('Not authenticated')
  return identity.subject
}

// ─── initiateActivation (mutation) ────────────────────────────────────────────

export const initiateActivation = mutation({
  args: {
    service: v.string(),
    country: v.string(),
    maxPrice: v.optional(v.number()),
    operator: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)
    const now = Date.now()

    // 1. Validate country code
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) {
      throw new Error(`Invalid country code: ${args.country}`)
    }

    // 2. Check user account balance (USD)
    const userCompte = await ctx.db
      .query('comptes')
      .withIndex('by_code', (q) => q.eq('code', `411-${userId}`))
      .unique()
    if (!userCompte) throw new Error('Compte utilisateur introuvable. Veuillez recharger.')

    const priceUsd = args.maxPrice ?? 0.50
    if (userCompte.solde < priceUsd) {
      throw new Error('Solde insuffisant')
    }

    // 3. Check concurrent activation limit
    const activeActivations = await ctx.db
      .query('activations')
      .withIndex('by_userId_status', (q) =>
        q.eq('userId', userId).eq('status', 'awaiting_sms'),
      )
      .collect()
    if (activeActivations.length >= MAX_CONCURRENT_ACTIVATIONS) {
      throw new Error('Maximum 3 activations simultanées atteint. Veuillez compléter ou annuler une activation existante.')
    }

    // 4. Ensure comptes exist
    await ctx.runMutation(internal.comptabilite.ensureCompte, {
      code: '471-escrow',
      libelle: 'Séquesterre SMS',
    })
    await ctx.runMutation(internal.comptabilite.ensureCompte, {
      code: '702-sms-marge',
      libelle: 'Marge activation SMS',
    })
    await ctx.runMutation(internal.comptabilite.ensureCompte, {
      code: '471-fournisseur',
      libelle: 'Dette fournisseur SMS',
    })

    // 5. Create activation document
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

    // 6. Escrow accounting
    await ctx.runMutation(internal.comptabilite.createPiece, {
      libelle: `Mise en séquestre activation ${activationId}`,
      statut: 'en_attente',
      reference: activationId,
      lignes: [
        { compteCode: `411-${userId}`, sens: 'credit', montant: priceUsd },
        { compteCode: '471-escrow', sens: 'debit', montant: priceUsd },
      ],
    })

    // 7. Schedule pollActivation immediately
    await ctx.scheduler.runAfter(0, internal.sms_provider.pollActivation, {
      activationId,
    })

    return { activationId }
  },
})

// ─── pollActivation (internalAction) ──────────────────────────────────────────

export const pollActivation = internalAction({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const activation = await ctx.runQuery(internal.sms_provider.internalGetActivation, {
      activationId: args.activationId,
    })
    if (!activation) return

    if (['completed', 'cancelled', 'expired', 'sms_received'].includes(activation.status)) {
      return
    }

    if (Date.now() - activation.createdAt > ACTIVATION_TIMEOUT_MS) {
      await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
        activationId: args.activationId,
        patch: { status: 'expired', updatedAt: Date.now() },
      })
      await ctx.runMutation(internal.sms_provider.refundEscrow, {
        activationId: args.activationId,
      })
      return
    }

    try {
      if (activation.status === 'awaiting_number') {
        const numericCountry = isoToNumeric(activation.country)
        if (!numericCountry) throw new Error(`Invalid country: ${activation.country}`)

        const params: Record<string, string> = {
          action: 'getNumberV2',
          service: activation.service,
          country: String(numericCountry),
        }
        if (activation.maxPrice > 0) params.maxPrice = String(activation.maxPrice)
        if (activation.operator) params.operator = activation.operator

        const response = await smsProGetJson(params)

        if (response.activationId) {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: {
              status: 'awaiting_sms',
              providerId: Number(response.activationId),
              phoneNumber: String(response.phoneNumber),
              providerCost: response.activationCost ? Number(response.activationCost) : undefined,
              canGetAnotherSms: response.canGetAnotherSms === true,
              rentEndTime: response.activationTime
                ? Number(response.activationTime) * 1000 + 20 * 60 * 1000
                : undefined,
              updatedAt: Date.now(),
            },
          })
          await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollActivation, {
            activationId: args.activationId,
          })
        } else if (response === 'NO_NUMBERS') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'no_numbers', errorMessage: 'Aucun numéro disponible', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.sms_provider.refundEscrow, { activationId: args.activationId })
        } else if (typeof response === 'string' && response.startsWith('WRONG_MAX_PRICE:')) {
          const minPrice = Number(response.split(':')[1])
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'max_price_too_low', errorMessage: `Prix minimum: ${minPrice} USD`, updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.sms_provider.refundEscrow, { activationId: args.activationId })
        } else if (response === 'NO_BALANCE') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'expired', errorMessage: 'Service temporairement indisponible (solde fournisseur épuisé)', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.sms_provider.refundEscrow, { activationId: args.activationId })
        } else if (response === 'BAD_KEY') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'expired', errorMessage: 'Erreur de configuration API', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.sms_provider.refundEscrow, { activationId: args.activationId })
        }
      } else if (activation.status === 'awaiting_sms') {
        if (!activation.providerId) return

        // Vérifier expiration du numéro (20 min côté provider)
        if (activation.rentEndTime && Date.now() > activation.rentEndTime) {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'expired', errorMessage: 'Le numéro a expiré', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.sms_provider.refundEscrow, { activationId: args.activationId })
          return
        }

        const response = await smsProGet({
          action: 'getStatus',
          id: String(activation.providerId),
        })

        if (response === 'STATUS_WAIT_CODE') {
          await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollActivation, {
            activationId: args.activationId,
          })
        } else if (typeof response === 'string' && response.startsWith('STATUS_OK:')) {
          const code = response.split(':')[1]
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'sms_received', smsCode: code, updatedAt: Date.now() },
          })
        } else if (typeof response === 'string' && response.startsWith('STATUS_WAIT_RETRY:')) {
          const code = response.split(':')[1]
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'sms_received', smsCode: code, updatedAt: Date.now() },
          })
        } else if (response === 'STATUS_CANCEL') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'cancelled', errorMessage: 'Annulé par le fournisseur', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.sms_provider.refundEscrow, { activationId: args.activationId })
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
        activationId: args.activationId,
        patch: { errorMessage: message, updatedAt: Date.now() },
      })
      await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollActivation, {
        activationId: args.activationId,
      })
    }
  },
})

// ─── internalUpdateActivation (internalMutation) ──────────────────────────────

export const internalUpdateActivation = internalMutation({
  args: {
    activationId: v.id('activations'),
    patch: v.object({
      status: v.optional(
        v.union(
          v.literal('awaiting_number'),
          v.literal('awaiting_sms'),
          v.literal('sms_received'),
          v.literal('completed'),
          v.literal('cancelled'),
          v.literal('expired'),
          v.literal('no_numbers'),
          v.literal('max_price_too_low'),
        ),
      ),
      phoneNumber: v.optional(v.string()),
      providerId: v.optional(v.number()),
      smsCode: v.optional(v.string()),
      providerCost: v.optional(v.number()),
      canGetAnotherSms: v.optional(v.boolean()),
      rentEndTime: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
      updatedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.activationId, args.patch)
  },
})

// ─── internalGetActivation (internalQuery) ────────────────────────────────────

export const internalGetActivation = internalQuery({
  args: { activationId: v.id('activations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.activationId)
  },
})

// ─── refundEscrow (internalMutation) ──────────────────────────────────────────

export const refundEscrow = internalMutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const activation = await ctx.db.get(args.activationId)
    if (!activation) return

    const escrowPiece = await ctx.db
      .query('pieces')
      .filter((q) => q.eq(q.field('reference'), args.activationId))
      .first()

    if (!escrowPiece || escrowPiece.statut !== 'en_attente') return

    await ctx.runMutation(internal.comptabilite.createPiece, {
      libelle: `Annulation activation ${args.activationId}`,
      statut: 'validee',
      reference: args.activationId,
      lignes: [
        { compteCode: '471-escrow', sens: 'credit', montant: activation.priceCharged },
        { compteCode: `411-${activation.userId}`, sens: 'debit', montant: activation.priceCharged },
      ],
    })

    // NOTE: Pas de annulerPiece sur l'original — la pièce inverse ci-dessus
    // suffit à reverser la transaction. annulerPiece inverserait les lignes
    // de l'original (411-user: credit → creditCompte), créditant l'utilisateur
    // une deuxième fois (double refund).
  },
})

// ─── completeActivation (mutation) ────────────────────────────────────────────

export const completeActivation = mutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)

    const activation = await ctx.db.get(args.activationId)
    if (!activation || activation.userId !== userId) throw new Error('Activation introuvable')
    if (activation.status !== 'sms_received') throw new Error("L'activation n'est pas en état SMS reçu")
    if (!activation.providerId) throw new Error('Pas de numéro de provider')

    const response = await smsProGet({
      action: 'setStatus',
      id: String(activation.providerId),
      status: '6',
    })

    if (response === 'BAD_KEY') throw new Error('Erreur de configuration API')

    await ctx.db.patch(args.activationId, {
      status: 'completed',
      updatedAt: Date.now(),
    })

    const marginUsd = Math.round((activation.priceCharged - (activation.providerCost ?? 0)) * 100) / 100

    const escrowPiece = await ctx.db
      .query('pieces')
      .filter((q) => q.eq(q.field('reference'), args.activationId))
      .first()

    if (escrowPiece && escrowPiece.statut === 'en_attente') {
      await ctx.runMutation(internal.comptabilite.createPiece, {
        libelle: `Activation ${args.activationId} réussie`,
        statut: 'validee',
        reference: args.activationId,
        lignes: [
          { compteCode: '471-escrow', sens: 'credit', montant: activation.priceCharged },
          { compteCode: '702-sms-marge', sens: 'debit', montant: Math.max(0, marginUsd) },
          { compteCode: '471-fournisseur', sens: 'debit', montant: activation.providerCost ?? 0 },
        ],
      })
      // NOTE: Pas de annulerPiece sur l'original — la pièce ci-dessus
      // distribue l'escrow. annulerPiece rembourserait l'utilisateur en +
      // du service livré (activation gratuite).
    }

    return { success: true }
  },
})

// ─── cancelActivation (mutation) ──────────────────────────────────────────────

export const cancelActivation = mutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)

    const activation = await ctx.db.get(args.activationId)
    if (!activation || activation.userId !== userId) throw new Error('Activation introuvable')
    if (['completed', 'cancelled', 'expired'].includes(activation.status)) {
      throw new Error("L'activation est déjà terminée")
    }

    if (activation.providerId) {
      try {
        await smsProGet({
          action: 'setStatus',
          id: String(activation.providerId),
          status: '8',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('EARLY_CANCEL')) {
          await ctx.scheduler.runAfter(120_000, internal.sms_provider.pollActivation, {
            activationId: args.activationId,
          })
        }
      }
    }

    await ctx.db.patch(args.activationId, {
      status: 'cancelled',
      errorMessage: 'Annulé par l\'utilisateur',
      updatedAt: Date.now(),
    })

    await ctx.runMutation(internal.sms_provider.refundEscrow, {
      activationId: args.activationId,
    })

    return { success: true }
  },
})

// ─── requestAnotherSms (mutation) ─────────────────────────────────────────────

export const requestAnotherSms = mutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)

    const activation = await ctx.db.get(args.activationId)
    if (!activation || activation.userId !== userId) throw new Error('Activation introuvable')
    if (activation.status !== 'sms_received' && activation.status !== 'awaiting_sms') {
      throw new Error('Impossible de redemander un SMS dans cet état')
    }
    if (!activation.canGetAnotherSms) {
      throw new Error('Ce numéro ne permet pas de redemander un SMS')
    }
    if (!activation.providerId) throw new Error('Pas de numéro de provider')

    const response = await smsProGet({
      action: 'setStatus',
      id: String(activation.providerId),
      status: '3',
    })

    if (response === 'BAD_KEY') throw new Error('Erreur de configuration API')

    await ctx.db.patch(args.activationId, {
      status: 'awaiting_sms',
      smsCode: undefined,
      updatedAt: Date.now(),
    })

    await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollActivation, {
      activationId: args.activationId,
    })

    return { success: true }
  },
})

// ─── getActivation (query) ────────────────────────────────────────────────────

export const getActivation = query({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)

    const activation = await ctx.db.get(args.activationId)
    if (!activation) throw new Error('Activation introuvable')
    if (activation.userId !== userId) throw new Error('Non autorisé')

    return activation
  },
})

// ─── getMyActivations (query) ─────────────────────────────────────────────────

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

// ─── getNumberQuantity (query) ────────────────────────────────────────────────

export const getNumberQuantity = query({
  args: {
    country: v.string(),
  },
  handler: async (_ctx, args) => {
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) return {}

    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return {}

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getNumbersStatus')
      url.searchParams.set('country', String(numericCountry))
      const res = await fetch(url.toString())
      const text = await res.text()
      const data = JSON.parse(text)
      return data
    } catch {
      return {}
    }
  },
})

// ─── getTopCountries (query) ──────────────────────────────────────────────────

export const getTopCountries = query({
  args: {
    service: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return []

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getTopCountriesByService')
      url.searchParams.set('service', args.service)
      const res = await fetch(url.toString())
      const text = await res.text()
      const data = JSON.parse(text)
      return data
    } catch {
      return []
    }
  },
})

// ─── syncPrices (action) ──────────────────────────────────────────────────────

export const syncPrices = action({
  args: {
    country: v.string(),
    service: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)

    const user = await ctx.runQuery(internal.purchases.internalGetUserByBetterAuthId, {
      betterAuthUserId: userId,
    })
    if (!user?.isAdmin) throw new Error('Non autorisé — Administrateur uniquement')

    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) throw new Error(`Invalid country: ${args.country}`)

    const params: Record<string, string> = {
      action: 'getPrices',
      country: String(numericCountry),
    }
    if (args.service) params.service = args.service

    const prices = await smsProGetJson(params)
    return prices
  },
})

// ─── getOperators (query) ──────────────────────────────────────────────────────
// Docs: https://sms-online.pro/docs/api/en/get_operators.html
// Returns: { status: "success", countryOperators: { [countryCode]: string[] } }

export const getOperators = query({
  args: {
    country: v.string(),
  },
  handler: async (_ctx, args) => {
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) return []

    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return []

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getOperators')
      url.searchParams.set('country', String(numericCountry))
      const res = await fetch(url.toString())
      const text = await res.text()
      const data = JSON.parse(text)
      if (data?.status === 'success' && data?.countryOperators?.[String(numericCountry)]) {
        return data.countryOperators[String(numericCountry)] as string[]
      }
      return []
    } catch {
      return []
    }
  },
})

// ─── getPrices (query) ──────────────────────────────────────────────────────────
// Docs: https://sms-online.pro/docs/api/en/get_prices.html
// Returns: { [countryCode]: { [service]: { cost: number, count: number } } }

export const getPrices = query({
  args: {
    country: v.string(),
    service: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) return {}

    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return {}

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getPrices')
      url.searchParams.set('country', String(numericCountry))
      if (args.service) url.searchParams.set('service', args.service)
      const res = await fetch(url.toString())
      const text = await res.text()
      return JSON.parse(text) as Record<string, Record<string, { cost: number; count: number }>>
    } catch {
      return {}
    }
  },
})


