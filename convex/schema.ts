import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    betterAuthUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    isAnonymous: v.boolean(),
    hasMadeDeposit: v.optional(v.boolean()),
    accessExpiresAt: v.optional(v.number()),
    convertedAt: v.optional(v.number()),
    country: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    balanceUsd: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_betterAuthUserId', ['betterAuthUserId'])
    .index('by_email', ['email']),
  analytics_events: defineTable({
    eventType: v.string(),
    sessionId: v.string(),
    country: v.optional(v.string()),
    device: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    timestamp: v.number(),
  })
    .index('by_eventType', ['eventType'])
    .index('by_sessionId', ['sessionId']),
  packages: defineTable({
    slug: v.string(),
    name: v.string(),
    priceXaf: v.number(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  }).index('by_slug', ['slug']),
  purchases: defineTable({
    userId: v.string(),
    packageId: v.string(),
    priceXaf: v.number(),
    promoCode: v.optional(v.string()),
    promoDiscount: v.optional(v.number()),
    paymentMethod: v.string(),
    status: v.string(),
    paymentGatewayId: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    idempotencyKey: v.string(),
    failureReason: v.optional(v.string()),
    failedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_idempotencyKey', ['idempotencyKey'])
    .index('by_paymentGatewayId', ['paymentGatewayId']),
  promoCodes: defineTable({
    code: v.string(),
    discountPercent: v.optional(v.number()),
    discountFlat: v.optional(v.number()),
    isActive: v.boolean(),
    maxUses: v.optional(v.number()),
    usedCount: v.number(),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_code', ['code']),

  comptes: defineTable({
    code: v.string(),
    libelle: v.string(),
    solde: v.number(),
  }).index('by_code', ['code']),

  pieces: defineTable({
    date: v.number(),
    libelle: v.string(),
    statut: v.string(),
    reference: v.optional(v.string()),
  }).index('by_reference', ['reference']),

  lignes: defineTable({
    pieceId: v.id('pieces'),
    compteCode: v.string(),
    sens: v.string(),
    montant: v.number(),
    soldeApres: v.number(),
  })
    .index('by_piece', ['pieceId'])
    .index('by_compte', ['compteCode']),

  marginOverrides: defineTable({
    countryIso: v.string(),
    serviceId: v.string(),
    marginXaf: v.number(),
    updatedBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_country_service', ['countryIso', 'serviceId'])
    .index('by_service', ['serviceId']),

  activations: defineTable({
    userId: v.string(),
    service: v.string(),
    country: v.string(),
    providerId: v.optional(v.number()),
    phoneNumber: v.optional(v.string()),
    status: v.union(
      v.literal('awaiting_number'),
      v.literal('awaiting_sms'),
      v.literal('sms_received'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('expired'),
      v.literal('no_numbers'),
      v.literal('max_price_too_low'),
    ),
    maxPrice: v.number(),
    operator: v.optional(v.string()),
    smsCode: v.optional(v.string()),
    canGetAnotherSms: v.boolean(),
    rentEndTime: v.optional(v.number()),
    providerCost: v.optional(v.number()),
    priceCharged: v.number(),
    rentTimeHours: v.optional(v.number()),
    rentProviderId: v.optional(v.number()),
    rentEndDate: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_providerId', ['providerId'])
    .index('by_status', ['status'])
    .index('by_userId_status', ['userId', 'status']),

  wallets: defineTable({
    userId: v.string(),
    balanceCents: v.number(),
    currency: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId']),

  wallet_ledger_entries: defineTable({
    walletId: v.id('wallets'),
    type: v.union(
      v.literal('credit'),
      v.literal('debit'),
      v.literal('release'),
      v.literal('refund'),
    ),
    amountCents: v.number(),
    balanceAfterCents: v.number(),
    referenceType: v.union(
      v.literal('payment_intent'),
      v.literal('escrow'),
      v.literal('order'),
      v.literal('admin'),
    ),
    referenceId: v.string(),
    description: v.string(),
    metadata: v.optional(v.object({ xafRate: v.optional(v.number()) })),
    createdAt: v.number(),
  })
    .index('by_walletId', ['walletId'])
    .index('by_walletId_createdAt', ['walletId', 'createdAt'])
    .index('by_reference', ['referenceType', 'referenceId']),

  payment_intents: defineTable({
    userId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('succeeded'),
      v.literal('failed'),
      v.literal('cancelled'),
      v.literal('expired'),
    ),
    gateway: v.string(),
    gatewayTransactionId: v.optional(v.string()),
    idempotencyKey: v.string(),
    xafAmount: v.number(),
    xafRate: v.number(),
    failureReason: v.optional(v.string()),
    metadata: v.optional(v.object({
      phone: v.optional(v.string()),
      paymentMethod: v.optional(v.string()),
      promoCode: v.optional(v.string()),
      promoDiscount: v.optional(v.number()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_idempotencyKey', ['idempotencyKey'])
    .index('by_gatewayTransactionId', ['gatewayTransactionId'])
    .index('by_status', ['status']),

  escrows: defineTable({
    userId: v.string(),
    activationId: v.id('activations'),
    amountCents: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('held'),
      v.literal('released'),
      v.literal('refunded'),
      v.literal('partial_released'),
    ),
    providerCostCents: v.optional(v.number()),
    marginCents: v.optional(v.number()),
    description: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_activationId', ['activationId'])
    .index('by_status', ['status']),

  orders: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal('recharge'),
      v.literal('activation'),
      v.literal('rental'),
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('refunded'),
    ),
    amountCents: v.number(),
    paymentIntentId: v.optional(v.id('payment_intents')),
    escrowId: v.optional(v.id('escrows')),
    description: v.string(),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_type', ['type']),

  provider_operations: defineTable({
    provider: v.string(),
    operation: v.string(),
    request: v.string(),
    response: v.string(),
    status: v.union(
      v.literal('success'),
      v.literal('error'),
    ),
    referenceId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_referenceId', ['referenceId'])
    .index('by_provider_operation', ['provider', 'operation']),
})
