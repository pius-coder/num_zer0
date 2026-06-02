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
})
