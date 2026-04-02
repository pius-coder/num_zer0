import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { provider } from './services'
import { activationStateEnum } from './enums'

export const smsActivation = pgTable(
  'sms_activation',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    serviceSlug: text('service_slug').notNull(),
    countryCode: text('country_code').notNull(),
    requestedCountryIso: text('requested_country_iso'),
    providerId: text('provider_id').references(() => provider.id),
    providerActivationId: text('provider_activation_id'),
    phoneNumber: text('phone_number'),
    smsCode: text('sms_code'),
    fullSmsText: text('full_sms_text'),
    state: activationStateEnum('state').default('requested').notNull(),
    creditsCharged: integer('credits_charged').notNull(),
    wholesaleCostUsd: jsonb('wholesale_cost_usd'),
    maxPriceSentUsd: jsonb('max_price_sent_usd'),
    marginRatio: jsonb('margin_ratio'),
    canGetAnotherSms: boolean('can_get_another_sms').default(false).notNull(),
    retryCount: integer('retry_count').default(0).notNull(),
    failureReason: text('failure_reason'),
    providerResponseRaw: jsonb('provider_response_raw'),
    timerExpiresAt: timestamp('timer_expires_at'),
    numberAssignedAt: timestamp('number_assigned_at'),
    smsReceivedAt: timestamp('sms_received_at'),
    completedAt: timestamp('completed_at'),
    cancelledAt: timestamp('cancelled_at'),
    expiredAt: timestamp('expired_at'),
    refundedAt: timestamp('refunded_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('sms_activation_user_idx').on(table.userId),
    index('sms_activation_state_idx').on(table.state),
    index('sms_activation_slug_idx').on(table.serviceSlug),
  ]
)

export const smsActivationRelations = relations(smsActivation, ({ one }) => ({
  user: one(user, {
    fields: [smsActivation.userId],
    references: [user.id],
  }),
  provider: one(provider, {
    fields: [smsActivation.providerId],
    references: [provider.id],
  }),
}))
