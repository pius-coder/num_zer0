import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  uniqueIndex,
  jsonb,
  numeric,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { configValueTypeEnum, fraudActionEnum, supportDirectionEnum } from './enums'

export const platformConfig = pgTable(
  'platform_config',
  {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    valueType: configValueTypeEnum('value_type').notNull(),
    category: text('category').notNull(),
    descriptionFr: text('description_fr'),
    descriptionEn: text('description_en'),
    updatedBy: text('updated_by').references(() => user.id),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('platform_config_category_idx').on(table.category)]
)

export const promoCode = pgTable(
  'promo_code',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    descriptionFr: text('description_fr'),
    descriptionEn: text('description_en'),
    bonusCredits: integer('bonus_credits').default(0).notNull(),
    discountPct: numeric('discount_pct', { precision: 5, scale: 2 }).default('0'),
    usageLimit: integer('usage_limit').notNull(),
    usedCount: integer('used_count').default(0).notNull(),
    maxUsesPerUser: integer('max_uses_per_user').default(1).notNull(),
    newUsersOnly: boolean('new_users_only').default(false).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: text('created_by').references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('promo_code_active_idx').on(table.isActive)]
)

export const fraudRule = pgTable(
  'fraud_rule',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    signalType: text('signal_type').notNull(),
    threshold: numeric('threshold', { precision: 10, scale: 2 }).notNull(),
    action: fraudActionEnum('action').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    windowHours: integer('window_hours').default(1),
    minAttempts: integer('min_attempts'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('fraud_rule_active_idx').on(table.isActive)]
)

export const fraudEvent = pgTable(
  'fraud_event',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ruleId: text('rule_id').references(() => fraudRule.id),
    signalType: text('signal_type').notNull(),
    signals: jsonb('signals').notNull(),
    decision: fraudActionEnum('decision').notNull(),
    isResolved: boolean('is_resolved').default(false).notNull(),
    resolvedBy: text('resolved_by').references(() => user.id),
    resolvedAt: timestamp('resolved_at'),
    resolutionNote: text('resolution_note'),
    ipAddress: text('ip_address'),
    deviceFingerprint: text('device_fingerprint'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('fraud_event_user_idx').on(table.userId),
    index('fraud_event_resolved_idx').on(table.isResolved),
  ]
)

export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: text('id').primaryKey(),
    adminId: text('admin_id')
      .notNull()
      .references(() => user.id),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    beforeData: jsonb('before_data'),
    afterData: jsonb('after_data'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('admin_audit_admin_idx').on(table.adminId),
    index('admin_audit_created_idx').on(table.createdAt),
  ]
)

export const supportMessages = pgTable(
  'support_messages',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    adminId: text('admin_id').references(() => user.id),
    direction: supportDirectionEnum('direction').notNull(),
    subject: text('subject'),
    content: text('content').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('support_messages_userId_idx').on(table.userId)]
)

export const fraudEventRelations = relations(fraudEvent, ({ one }) => ({
  user: one(user, {
    fields: [fraudEvent.userId],
    references: [user.id],
    relationName: 'fraud_events_user',
  }),
  resolver: one(user, {
    fields: [fraudEvent.resolvedBy],
    references: [user.id],
    relationName: 'fraud_events_resolver',
  }),
}))

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  admin: one(user, {
    fields: [adminAuditLog.adminId],
    references: [user.id],
  }),
}))

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  user: one(user, {
    fields: [supportMessages.userId],
    references: [user.id],
    relationName: 'support_messages_user',
  }),
  admin: one(user, {
    fields: [supportMessages.adminId],
    references: [user.id],
    relationName: 'support_messages_admin',
  }),
}))
