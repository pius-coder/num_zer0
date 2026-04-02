import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  uniqueIndex,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { provider } from './services'
import { smsActivation } from './activations'
import { creditPurchase } from './credits'
import { promoCode } from './governance'
import { notificationTypeEnum, notificationChannelEnum } from './enums'

export const activationAttempt = pgTable(
  'activation_attempt',
  {
    id: text('id').primaryKey(),
    activationId: text('activation_id')
      .notNull()
      .references(() => smsActivation.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').references(() => provider.id),
    attemptOrder: integer('attempt_order').notNull(),
    serviceCode: text('service_code').notNull(),
    countryCode: text('country_code').notNull(),
    maxPriceSentUsd: jsonb('max_price_sent_usd'),
    responseStatus: text('response_status'),
    responseRaw: jsonb('response_raw'),
    responseTimeMs: integer('response_time_ms'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('activation_attempt_activation_idx').on(table.activationId),
    index('activation_attempt_provider_idx').on(table.providerId),
  ]
)

export const providerBalanceLog = pgTable(
  'provider_balance_log',
  {
    id: text('id').primaryKey(),
    providerId: text('provider_id')
      .notNull()
      .references(() => provider.id, { onDelete: 'cascade' }),
    balanceUsd: numeric('balance_usd', { precision: 10, scale: 4 }).notNull(),
    checkedAt: timestamp('checked_at').defaultNow().notNull(),
  },
  (table) => [index('provider_balance_log_provider_idx').on(table.providerId)]
)

export const promoCodeUsage = pgTable(
  'promo_code_usage',
  {
    id: text('id').primaryKey(),
    promoCodeId: text('promo_code_id')
      .notNull()
      .references(() => promoCode.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    purchaseId: text('purchase_id').references(() => creditPurchase.id),
    creditsAwarded: integer('credits_awarded').notNull(),
    discountAppliedXaf: integer('discount_applied_xaf').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('promo_code_usage_unique').on(table.promoCodeId, table.userId),
    index('promo_code_usage_user_idx').on(table.userId),
  ]
)

export const userDevice = pgTable(
  'user_device',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    fingerprint: text('fingerprint').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
    firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
    isBlocked: boolean('is_blocked').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_device_unique').on(table.userId, table.fingerprint),
    index('user_device_fingerprint_idx').on(table.fingerprint),
  ]
)

export const notification = pgTable(
  'notification',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    channel: notificationChannelEnum('channel').notNull(),
    titleFr: text('title_fr'),
    titleEn: text('title_en'),
    contentFr: text('content_fr'),
    contentEn: text('content_en'),
    metadata: jsonb('metadata'),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at'),
    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('notification_user_idx').on(table.userId),
    index('notification_read_idx').on(table.isRead),
    index('notification_type_idx').on(table.type),
  ]
)

export const activationAttemptRelations = relations(activationAttempt, ({ one }) => ({
  activation: one(smsActivation, {
    fields: [activationAttempt.activationId],
    references: [smsActivation.id],
  }),
  provider: one(provider, {
    fields: [activationAttempt.providerId],
    references: [provider.id],
  }),
}))

export const providerBalanceLogRelations = relations(providerBalanceLog, ({ one }) => ({
  provider: one(provider, {
    fields: [providerBalanceLog.providerId],
    references: [provider.id],
  }),
}))

export const promoCodeUsageRelations = relations(promoCodeUsage, ({ one }) => ({
  promoCode: one(promoCode, {
    fields: [promoCodeUsage.promoCodeId],
    references: [promoCode.id],
  }),
  user: one(user, {
    fields: [promoCodeUsage.userId],
    references: [user.id],
  }),
}))

export const userDeviceRelations = relations(userDevice, ({ one }) => ({
  user: one(user, {
    fields: [userDevice.userId],
    references: [user.id],
  }),
}))

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}))
