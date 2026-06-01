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
} from 'drizzle-orm/pg-core'

export const externalServiceMapping = pgTable(
  'external_service_mapping',
  {
    id: text('id').primaryKey(),
    localSlug: text('local_slug').notNull(),
    providerId: text('provider_id')
      .notNull()
      .references(() => provider.id, { onDelete: 'cascade' }),
    externalApiCode: text('external_api_code').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('external_service_mapping_unique').on(table.localSlug, table.providerId),
    index('external_service_mapping_slug_idx').on(table.localSlug),
    index('external_service_mapping_provider_idx').on(table.providerId),
  ]
)

export const externalCountryMapping = pgTable(
  'external_country_mapping',
  {
    id: text('id').primaryKey(),
    isoCode: text('iso_code').notNull(),
    providerId: text('provider_id')
      .notNull()
      .references(() => provider.id, { onDelete: 'cascade' }),
    externalCountryId: text('external_country_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('external_country_mapping_unique').on(table.isoCode, table.providerId),
    index('external_country_mapping_iso_idx').on(table.isoCode),
    index('external_country_mapping_provider_idx').on(table.providerId),
  ]
)

export const priceRule = pgTable(
  'price_rule',
  {
    id: text('id').primaryKey(),
    serviceSlug: text('service_slug').notNull(),
    countryIso: text('country_iso').notNull(),
    priceCredits: integer('price_credits').notNull(),
    floorCredits: integer('floor_credits').notNull(),
    baselineWholesaleUsd: numeric('baseline_wholesale_usd', { precision: 10, scale: 4 }),
    lowStockThreshold: integer('low_stock_threshold').default(50),
    lowStockMultiplierPct: integer('low_stock_multiplier_pct').default(15),
    cachedAvailability: integer('cached_availability').default(0),
    availabilityLastCheckedAt: timestamp('availability_last_checked_at'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('price_rule_unique').on(table.serviceSlug, table.countryIso),
    index('price_rule_slug_idx').on(table.serviceSlug),
    index('price_rule_iso_idx').on(table.countryIso),
    index('price_rule_active_idx').on(table.isActive),
  ]
)

export const priceOverride = pgTable(
  'price_override',
  {
    id: text('id').primaryKey(),
    serviceSlug: text('service_slug').notNull(),
    countryIso: text('country_iso').notNull(),
    priceCredits: integer('price_credits').notNull(),
    floorCredits: integer('floor_credits'),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('price_override_unique').on(table.serviceSlug, table.countryIso),
    index('price_override_slug_idx').on(table.serviceSlug),
    index('price_override_iso_idx').on(table.countryIso),
  ]
)

export const provider = pgTable(
  'provider',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    apiBaseUrl: text('api_base_url').notNull(),
    apiKeyEncrypted: text('api_key_encrypted').notNull(),
    priority: integer('priority').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    uptimePct30d: numeric('uptime_pct_30d', { precision: 5, scale: 2 }).default('100'),
    avgResponseMs: integer('avg_response_ms').default(0),
    errorRate30d: numeric('error_rate_30d', { precision: 5, scale: 4 }).default('0'),
    successRate30d: numeric('success_rate_30d', { precision: 5, scale: 4 }).default('1'),
    maxRetryAttempts: integer('max_retry_attempts').default(3).notNull(),
    reliabilityPenaltyMultiplier: numeric('reliability_penalty_multiplier', {
      precision: 3,
      scale: 1,
    }).default('2'),
    cacheTtlSeconds: integer('cache_ttl_seconds').default(60).notNull(),
    currentBalanceUsd: numeric('current_balance_usd', { precision: 10, scale: 4 }),
    balanceLastCheckedAt: timestamp('balance_last_checked_at'),
    minBalanceAlertUsd: numeric('min_balance_alert_usd', { precision: 10, scale: 4 }),
    lastHealthCheck: timestamp('last_health_check'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('provider_priority_idx').on(table.priority),
    index('provider_active_idx').on(table.isActive),
  ]
)


export const externalServiceMappingRelations = relations(externalServiceMapping, ({ one }) => ({
  provider: one(provider, {
    fields: [externalServiceMapping.providerId],
    references: [provider.id],
  }),
}))

export const externalCountryMappingRelations = relations(externalCountryMapping, ({ one }) => ({
  provider: one(provider, {
    fields: [externalCountryMapping.providerId],
    references: [provider.id],
  }),
}))

export const providerRelations = relations(provider, ({ many }) => ({
  serviceMappings: many(externalServiceMapping),
  countryMappings: many(externalCountryMapping),
}))
