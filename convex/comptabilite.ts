import { query, internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

export const ensureCompte = internalMutation({
  args: { code: v.string(), libelle: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('comptes')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
    if (existing) return existing._id
    return await ctx.db.insert('comptes', {
      code: args.code,
      libelle: args.libelle,
      solde: 0,
    })
  },
})

export const getCompte = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('comptes')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
  },
})

export const internalGetCompte = internalQuery({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('comptes')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
  },
})

export const creditCompte = internalMutation({
  args: { compteCode: v.string(), montant: v.number() },
  handler: async (ctx, args) => {
    const compte = await ctx.db
      .query('comptes')
      .withIndex('by_code', (q) => q.eq('code', args.compteCode))
      .unique()
    if (!compte) throw new Error(`Compte ${args.compteCode} not found`)
    const nouveauSolde = Math.round((compte.solde + args.montant) * 100) / 100
    await ctx.db.patch(compte._id, { solde: nouveauSolde })
    return nouveauSolde
  },
})

export const debitCompte = internalMutation({
  args: { compteCode: v.string(), montant: v.number() },
  handler: async (ctx, args) => {
    const compte = await ctx.db
      .query('comptes')
      .withIndex('by_code', (q) => q.eq('code', args.compteCode))
      .unique()
    if (!compte) throw new Error(`Compte ${args.compteCode} not found`)
    const nouveauSolde = Math.round((compte.solde - args.montant) * 100) / 100
    await ctx.db.patch(compte._id, { solde: nouveauSolde })
    return nouveauSolde
  },
})

export const createPiece = internalMutation({
  args: {
    libelle: v.string(),
    statut: v.string(),
    reference: v.optional(v.string()),
    lignes: v.array(v.object({
      compteCode: v.string(),
      sens: v.string(),
      montant: v.number(),
    })),
  },
  returns: v.id('pieces'),
  handler: async (ctx, args) => {
    const pieceId = await ctx.db.insert('pieces', {
      date: Date.now(),
      libelle: args.libelle,
      statut: args.statut,
      reference: args.reference,
    })

    for (const ligne of args.lignes) {
      let soldeApres: number
      if (ligne.sens === 'debit') {
        soldeApres = await ctx.runMutation(internal.comptabilite.creditCompte, {
          compteCode: ligne.compteCode,
          montant: ligne.montant,
        })
      } else {
        soldeApres = await ctx.runMutation(internal.comptabilite.debitCompte, {
          compteCode: ligne.compteCode,
          montant: ligne.montant,
        })
      }

      await ctx.db.insert('lignes', {
        pieceId,
        compteCode: ligne.compteCode,
        sens: ligne.sens,
        montant: ligne.montant,
        soldeApres,
      })
    }

    return pieceId
  },
})

export const annulerPiece = internalMutation({
  args: { pieceId: v.id('pieces') },
  handler: async (ctx, args) => {
    const piece = await ctx.db.get(args.pieceId)
    if (!piece) throw new Error('Piece not found')
    if (piece.statut === 'annulee') throw new Error('Piece already cancelled')

    const lignes = await ctx.db
      .query('lignes')
      .withIndex('by_piece', (q) => q.eq('pieceId', args.pieceId))
      .collect()

    for (const ligne of lignes) {
      if (ligne.sens === 'debit') {
        await ctx.runMutation(internal.comptabilite.debitCompte, {
          compteCode: ligne.compteCode,
          montant: ligne.montant,
        })
      } else {
        await ctx.runMutation(internal.comptabilite.creditCompte, {
          compteCode: ligne.compteCode,
          montant: ligne.montant,
        })
      }
    }

    await ctx.db.patch(args.pieceId, { statut: 'annulee' })
  },
})

export const getMouvements = query({
  args: { compteCode: v.string() },
  handler: async (ctx, args) => {
    const lignes = await ctx.db
      .query('lignes')
      .withIndex('by_compte', (q) => q.eq('compteCode', args.compteCode))
      .order('desc')
      .collect()

    const pieces = new Map<string, any>()
    for (const ligne of lignes) {
      if (!pieces.has(ligne.pieceId)) {
        const piece = await ctx.db.get(ligne.pieceId)
        if (piece) pieces.set(ligne.pieceId, piece)
      }
    }

    return lignes.map((l) => ({
      id: l._id,
      pieceId: l.pieceId,
      sens: l.sens,
      montant: l.montant,
      soldeApres: l.soldeApres,
      date: pieces.get(l.pieceId)?.date ?? 0,
      libelle: pieces.get(l.pieceId)?.libelle ?? '',
      statut: pieces.get(l.pieceId)?.statut ?? '',
    }))
  },
})

export const soldeClient = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const compte = await ctx.db
      .query('comptes')
      .withIndex('by_code', (q) => q.eq('code', `411-${args.userId}`))
      .unique()
    return compte?.solde ?? 0
  },
})

export const getMyMouvements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const lignes = await ctx.db
      .query('lignes')
      .withIndex('by_compte', (q) => q.eq('compteCode', `411-${identity.subject}`))
      .order('desc')
      .take(50)

    const pieces = new Map<string, any>()
    for (const ligne of lignes) {
      if (!pieces.has(ligne.pieceId)) {
        const piece = await ctx.db.get(ligne.pieceId)
        if (piece) pieces.set(ligne.pieceId, piece)
      }
    }

    return lignes.map((l) => {
      const piece = pieces.get(l.pieceId)
      return {
        id: l._id,
        pieceId: l.pieceId,
        sens: l.sens,
        montant: l.montant,
        soldeApres: l.soldeApres,
        date: piece?.date ?? 0,
        libelle: piece?.libelle ?? '',
        statut: piece?.statut ?? '',
      }
    })
  },
})
