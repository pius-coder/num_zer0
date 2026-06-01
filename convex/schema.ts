import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  products: defineTable({
    title: v.string(),
    imageId: v.string(),
    price: v.number(),
  }),
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    priority: v.optional(
      v.union(v.literal('p1'), v.literal('p2'), v.literal('p3'), v.literal('p4'))
    ),
    category: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    recurring: v.optional(
      v.union(v.literal('daily'), v.literal('weekly'), v.literal('monthly'))
    ),
    completedAt: v.optional(v.number()),
    dueDateLabel: v.optional(v.string()),
  }),
  users: defineTable({
    betterAuthUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    isAnonymous: v.boolean(),
    accessExpiresAt: v.optional(v.number()),
    convertedAt: v.optional(v.number()),
    linkedPermanentUserId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_betterAuthUserId', ['betterAuthUserId'])
    .index('by_email', ['email']),
})
