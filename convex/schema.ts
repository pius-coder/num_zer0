import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  products: defineTable({
    title: v.string(),
    imageId: v.string(),
    price: v.number(),
  }),
  users: defineTable({
    betterAuthUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    isAnonymous: v.boolean(),
    hasMadeDeposit: v.optional(v.boolean()),
    accessExpiresAt: v.optional(v.number()),
    convertedAt: v.optional(v.number()),
    linkedPermanentUserId: v.optional(v.string()),
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
})
