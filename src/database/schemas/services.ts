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

export const providerServiceCost = pgTable(
  'provider_service_cost',
  {
    id: text('id').primaryKey(),
    providerId: text('provider_id')
      .notNull()
      .references(() => provider.id, { onDelete: 'cascade' }),
    serviceCode: text('service_code').notNull(),
    countryCode: text('country_code').notNull(),
    costUsd: numeric('cost_usd', { precision: 10, scale: 4 }).notNull(),
    availability: integer('availability').default(0).notNull(),
    successRate30d: numeric('success_rate_30d', { precision: 5, scale: 4 }).default('1'),
    lastCheckedAt: timestamp('last_checked_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('provider_service_cost_unique').on(
      table.providerId,
      table.serviceCode,
      table.countryCode
    ),
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
  serviceCosts: many(providerServiceCost),
  serviceMappings: many(externalServiceMapping),
  countryMappings: many(externalCountryMapping),
}))

export const providerServiceCostRelations = relations(providerServiceCost, ({ one }) => ({
  provider: one(provider, {
    fields: [providerServiceCost.providerId],
    references: [provider.id],
  }),
}))

export const subProviderCost = pgTable(
  'sub_provider_cost',
  {
    id: text('id').primaryKey(),
    providerId: text('provider_id')
      .notNull()
      .references(() => provider.id, { onDelete: 'cascade' }),
    serviceCode: text('service_code').notNull(),
    countryCode: text('country_code').notNull(),
    subProviderId: text('sub_provider_id').notNull(),
    minPriceUsd: numeric('min_price_usd', { precision: 10, scale: 4 }).notNull(),
    maxPriceUsd: numeric('max_price_usd', { precision: 10, scale: 4 }).notNull(),
    priceCount: integer('price_count').default(1).notNull(),
    availability: integer('availability').default(0).notNull(),
    lastCheckedAt: timestamp('last_checked_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('spc_unique').on(
      table.providerId,
      table.serviceCode,
      table.countryCode,
      table.subProviderId
    ),
    index('spc_provider_idx').on(table.providerId),
    index('spc_service_country_idx').on(table.serviceCode, table.countryCode),
  ]
)
