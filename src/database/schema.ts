import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  decimal,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(), // Nullable — phone-first auth generates a synthetic email
  emailVerified: boolean('email_verified').default(false).notNull(),
  username: text('username').unique(), // Required by Better-Auth username plugin
  displayUsername: text('display_username'), // Case-preserved username (required by username plugin)
  phoneNumber: text('phone_number').unique(), // Primary identifier (raw phone with +)
  phoneNumberVerified: boolean('phone_number_verified').default(false).notNull(),
  image: text('image'),
  banned: boolean('banned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)]
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)]
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
)

// Payment system tables
export const customer = pgTable(
  'customer',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(), // 'stripe', 'polar', 'dodo', 'creem', 'autumn'
    providerCustomerId: text('provider_customer_id').notNull(), // Customer ID from payment provider
    email: text('email'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('customer_userId_idx').on(table.userId),
    index('customer_provider_customerId_idx').on(table.providerCustomerId),
  ]
)

export const subscription = pgTable(
  'subscription',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    customerId: text('customer_id').references(() => customer.id, { onDelete: 'set null' }),
    provider: text('provider').notNull(), // 'stripe', 'polar', 'dodo', 'creem', 'autumn'
    providerSubscriptionId: text('provider_subscription_id').notNull(), // Subscription ID from payment provider
    status: text('status').notNull(), // 'active', 'canceled', 'past_due', 'trialing', 'incomplete'
    plan: text('plan').notNull(), // 'free', 'starter', 'pro', 'enterprise', etc.
    interval: text('interval'), // 'month', 'year', null for one-time
    amount: decimal('amount', { precision: 10, scale: 2 }), // Price amount
    currency: text('currency'), // 'usd', 'eur', etc.
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    canceledAt: timestamp('canceled_at'),
    trialStart: timestamp('trial_start'),
    trialEnd: timestamp('trial_end'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('subscription_userId_idx').on(table.userId),
    index('subscription_customerId_idx').on(table.customerId),
    index('subscription_provider_subscriptionId_idx').on(table.providerSubscriptionId),
    index('subscription_status_idx').on(table.status),
  ]
)

export const payment = pgTable(
  'payment',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    customerId: text('customer_id').references(() => customer.id, { onDelete: 'set null' }),
    subscriptionId: text('subscription_id').references(() => subscription.id, {
      onDelete: 'set null',
    }),
    provider: text('provider').notNull(), // 'stripe', 'polar', 'dodo', 'creem', 'autumn'
    providerPaymentId: text('provider_payment_id').notNull(), // Payment ID from provider
    type: text('type').notNull(), // 'subscription', 'one_time', 'refund'
    status: text('status').notNull(), // 'succeeded', 'pending', 'failed', 'canceled'
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('payment_userId_idx').on(table.userId),
    index('payment_customerId_idx').on(table.customerId),
    index('payment_subscriptionId_idx').on(table.subscriptionId),
    index('payment_provider_paymentId_idx').on(table.providerPaymentId),
  ]
)

export const premiumPurchase = pgTable(
  'premium_purchase',
  {
    id: text('id').primaryKey(),
    stripeSessionId: text('stripe_session_id').notNull().unique(),
    stripeCustomerEmail: text('stripe_customer_email'),
    githubEmail: text('github_email'),
    githubUsername: text('github_username'),
    twitterHandle: text('twitter_handle'),
    amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }),
    currency: text('currency'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('premium_purchase_stripe_sessionId_idx').on(table.stripeSessionId)]
)

// ============================================================
// ECONOMICS SYSTEM TABLES
// ============================================================

export const creditTypeEnum = pgEnum('credit_type', ['base', 'bonus', 'promotional'])
export const creditTxnTypeEnum = pgEnum('credit_txn_type', [
  'purchase',
  'debit',
  'refund',
  'bonus_signup',
  'bonus_referral',
  'bonus_promo',
  'bonus_vip',
  'bonus_first_purchase',
  'adjustment',
  'expiration',
  'hold',
  'release_hold',
])
export const creditHoldStateEnum = pgEnum('credit_hold_state', ['held', 'debited', 'released', 'expired'])
export const purchaseStatusEnum = pgEnum('credit_purchase_status', [
  'initiated',
  'payment_pending',
  'confirmed',
  'credited',
  'failed',
  'refunded',
])
export const activationStateEnum = pgEnum('sms_activation_state', [
  'requested',
  'assigned',
  'waiting',
  'received',
  'completed',
  'expired',
  'cancelled',
  'failed',
  'refunded',
])
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected'])
export const configValueTypeEnum = pgEnum('config_value_type', ['string', 'number', 'boolean', 'json'])
export const fraudActionEnum = pgEnum('fraud_action', [
  'flag',
  'rate_limit',
  'soft_ban',
  'hard_ban',
  'require_2fa',
])
export const paymentMethodEnum = pgEnum('economics_payment_method', [
  'mtn_momo',
  'orange_money',
  'card',
  'bank_transfer',
  'crypto',
  'free',
])

export const supportDirectionEnum = pgEnum('support_direction', ['user_to_admin', 'admin_to_user'])

export const creditPackage = pgTable(
  'credit_package',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    nameFr: text('name_fr').notNull(),
    nameEn: text('name_en').notNull(),
    credits: integer('credits').notNull(),
    priceXaf: integer('price_xaf').notNull(),
    bonusPct: integer('bonus_pct').default(0).notNull(),
    label: text('label'),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    allowedPaymentMethods: jsonb('allowed_payment_methods'),
    minPurchaseCount: integer('min_purchase_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('credit_package_sort_idx').on(table.sortOrder), index('credit_package_active_idx').on(table.isActive)]
)

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

export const creditWallet = pgTable(
  'credit_wallet',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    baseBalance: integer('base_balance').default(0).notNull(),
    bonusBalance: integer('bonus_balance').default(0).notNull(),
    promoBalance: integer('promo_balance').default(0).notNull(),
    totalPurchased: integer('total_purchased').default(0).notNull(),
    totalConsumed: integer('total_consumed').default(0).notNull(),
    totalRefunded: integer('total_refunded').default(0).notNull(),
    totalExpired: integer('total_expired').default(0).notNull(),
    totalBonusReceived: integer('total_bonus_received').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('credit_wallet_user_unique').on(table.userId)]
)

export const creditLot = pgTable(
  'credit_lot',
  {
    id: text('id').primaryKey(),
    walletId: text('wallet_id')
      .notNull()
      .references(() => creditWallet.id, { onDelete: 'cascade' }),
    creditType: creditTypeEnum('credit_type').notNull(),
    initialAmount: integer('initial_amount').notNull(),
    remainingAmount: integer('remaining_amount').notNull(),
    sourceTxnId: text('source_txn_id'),
    expiresAt: timestamp('expires_at'),
    isExpired: boolean('is_expired').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('credit_lot_wallet_idx').on(table.walletId),
    index('credit_lot_type_idx').on(table.creditType),
    index('credit_lot_expires_idx').on(table.expiresAt),
    index('credit_lot_remaining_idx').on(table.remainingAmount),
  ]
)

export const service = pgTable(
  'service',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    apiCode: text('api_code').notNull(),
    nameFr: text('name_fr').notNull(),
    nameEn: text('name_en').notNull(),
    descriptionFr: text('description_fr'),
    descriptionEn: text('description_en'),
    iconUrl: text('icon_url'),
    isActive: boolean('is_active').default(true).notNull(),
    isPaused: boolean('is_paused').default(false).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    defaultPriceCredits: integer('default_price_credits').notNull(),
    defaultFloorCredits: integer('default_floor_credits').notNull(),
    totalActivations: integer('total_activations').default(0).notNull(),
    successRate30d: numeric('success_rate_30d', { precision: 5, scale: 4 }).default('0'),
    avgDeliverySeconds: integer('avg_delivery_seconds').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('service_code_idx').on(table.code), index('service_active_idx').on(table.isActive)]
)

export const serviceCountryPrice = pgTable(
  'service_country_price',
  {
    id: text('id').primaryKey(),
    serviceId: text('service_id')
      .notNull()
      .references(() => service.id, { onDelete: 'cascade' }),
    countryCode: text('country_code').notNull(),
    countryNameFr: text('country_name_fr'),
    countryNameEn: text('country_name_en'),
    priceCredits: integer('price_credits').notNull(),
    floorCredits: integer('floor_credits').notNull(),
    baselineWholesaleUsd: numeric('baseline_wholesale_usd', { precision: 10, scale: 4 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('service_country_price_unique').on(table.serviceId, table.countryCode)]
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
    reliabilityPenaltyMultiplier: numeric('reliability_penalty_multiplier', { precision: 3, scale: 1 }).default('2'),
    cacheTtlSeconds: integer('cache_ttl_seconds').default(60).notNull(),
    lastHealthCheck: timestamp('last_health_check'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('provider_priority_idx').on(table.priority), index('provider_active_idx').on(table.isActive)]
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
  (table) => [uniqueIndex('provider_service_cost_unique').on(table.providerId, table.serviceCode, table.countryCode)]
)

export const creditPurchase = pgTable(
  'credit_purchase',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    packageId: text('package_id')
      .notNull()
      .references(() => creditPackage.id),
    linkedPaymentId: text('linked_payment_id').references(() => payment.id),
    creditsBase: integer('credits_base').notNull(),
    creditsBonus: integer('credits_bonus').notNull(),
    totalCredits: integer('total_credits').notNull(),
    priceXaf: integer('price_xaf').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentRef: text('payment_ref'),
    paymentGatewayId: text('payment_gateway_id'),
    checkoutUrl: text('checkout_url'),
    idempotencyKey: text('idempotency_key').unique(),
    status: purchaseStatusEnum('status').default('initiated').notNull(),
    isFirstPurchase: boolean('is_first_purchase').default(false).notNull(),
    creditedAt: timestamp('credited_at'),
    failedAt: timestamp('failed_at'),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('credit_purchase_user_idx').on(table.userId), index('credit_purchase_status_idx').on(table.status)]
)

export const smsActivation = pgTable(
  'sms_activation',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    serviceId: text('service_id').references(() => service.id),
    countryCode: text('country_code').notNull(),
    providerId: text('provider_id').references(() => provider.id),
    providerActivationId: text('provider_activation_id'),
    phoneNumber: text('phone_number'),
    smsCode: text('sms_code'),
    fullSmsText: text('full_sms_text'),
    state: activationStateEnum('state').default('requested').notNull(),
    creditsCharged: integer('credits_charged').notNull(),
    wholesaleCostUsd: numeric('wholesale_cost_usd', { precision: 10, scale: 4 }),
    marginRatio: numeric('margin_ratio', { precision: 5, scale: 4 }),
    timerExpiresAt: timestamp('timer_expires_at'),
    numberAssignedAt: timestamp('number_assigned_at'),
    smsReceivedAt: timestamp('sms_received_at'),
    completedAt: timestamp('completed_at'),
    cancelledAt: timestamp('cancelled_at'),
    expiredAt: timestamp('expired_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('sms_activation_user_idx').on(table.userId), index('sms_activation_state_idx').on(table.state)]
)

export const creditHold = pgTable(
  'credit_hold',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    walletId: text('wallet_id')
      .notNull()
      .references(() => creditWallet.id, { onDelete: 'cascade' }),
    activationId: text('activation_id').references(() => smsActivation.id),
    amount: integer('amount').notNull(),
    creditType: creditTypeEnum('credit_type').notNull(),
    lotId: text('lot_id')
      .notNull()
      .references(() => creditLot.id),
    state: creditHoldStateEnum('state').default('held').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    idempotencyKey: text('idempotency_key').unique(),
    debitedAt: timestamp('debited_at'),
    releasedAt: timestamp('released_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('credit_hold_state_idx').on(table.state), index('credit_hold_expires_idx').on(table.expiresAt)]
)

export const creditTransaction = pgTable(
  'credit_transaction',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    walletId: text('wallet_id')
      .notNull()
      .references(() => creditWallet.id, { onDelete: 'cascade' }),
    type: creditTxnTypeEnum('type').notNull(),
    creditType: creditTypeEnum('credit_type').notNull(),
    amount: integer('amount').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    serviceId: text('service_id').references(() => service.id),
    activationId: text('activation_id').references(() => smsActivation.id),
    purchaseId: text('purchase_id').references(() => creditPurchase.id),
    lotId: text('lot_id').references(() => creditLot.id),
    wholesaleCostUsd: numeric('wholesale_cost_usd', { precision: 10, scale: 4 }),
    revenueXaf: numeric('revenue_xaf', { precision: 12, scale: 2 }),
    description: text('description'),
    adminNote: text('admin_note'),
    ipAddress: text('ip_address'),
    deviceFingerprint: text('device_fingerprint'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('credit_txn_user_idx').on(table.userId), index('credit_txn_type_idx').on(table.type)]
)

export const referral = pgTable(
  'referral',
  {
    id: text('id').primaryKey(),
    referrerId: text('referrer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    refereeId: text('referee_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').default('pending').notNull(),
    totalEarningsCredits: integer('total_earnings_credits').default(0).notNull(),
    purchasesTracked: integer('purchases_tracked').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('referral_referee_unique').on(table.refereeId)]
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
  (table) => [index('fraud_event_user_idx').on(table.userId), index('fraud_event_resolved_idx').on(table.isResolved)]
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
  (table) => [index('admin_audit_admin_idx').on(table.adminId), index('admin_audit_created_idx').on(table.createdAt)]
)

export const creditAdjustmentApproval = pgTable(
  'credit_adjustment_approval',
  {
    id: text('id').primaryKey(),
    requesterId: text('requester_id')
      .notNull()
      .references(() => user.id),
    targetUserId: text('target_user_id')
      .notNull()
      .references(() => user.id),
    amount: integer('amount').notNull(),
    reason: text('reason').notNull(),
    reasonNote: text('reason_note'),
    status: approvalStatusEnum('status').default('pending').notNull(),
    approverId: text('approver_id').references(() => user.id),
    approvedAt: timestamp('approved_at'),
    rejectedAt: timestamp('rejected_at'),
    rejectionNote: text('rejection_note'),
    executedTxnId: text('executed_txn_id').references(() => creditTransaction.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('credit_adjustment_status_idx').on(table.status), index('credit_adjustment_created_idx').on(table.createdAt)]
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


// Relations moved to bottom to avoid initialization errors
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  supportMessages: many(supportMessages, { relationName: 'support_messages_user' }),
  adminSupportMessages: many(supportMessages, { relationName: 'support_messages_admin' }),
  creditPurchases: many(creditPurchase),
  smsActivations: many(smsActivation),
  creditTransactions: many(creditTransaction),
  referrals: many(referral),
  fraudEvents: many(fraudEvent, { relationName: 'fraud_events_user' }),
  resolvedFraudEvents: many(fraudEvent, { relationName: 'fraud_events_resolver' }),
  auditLogs: many(adminAuditLog),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

// Payment system relations
export const customerRelations = relations(customer, ({ one, many }) => ({
  user: one(user, {
    fields: [customer.userId],
    references: [user.id],
  }),
  subscriptions: many(subscription),
  payments: many(payment),
}))

export const subscriptionRelations = relations(subscription, ({ one, many }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
  customer: one(customer, {
    fields: [subscription.customerId],
    references: [customer.id],
  }),
  payments: many(payment),
}))

export const paymentRelations = relations(payment, ({ one }) => ({
  user: one(user, {
    fields: [payment.userId],
    references: [user.id],
  }),
  customer: one(customer, {
    fields: [payment.customerId],
    references: [customer.id],
  }),
  subscription: one(subscription, {
    fields: [payment.subscriptionId],
    references: [subscription.id],
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

export const creditPurchaseRelations = relations(creditPurchase, ({ one }) => ({
  user: one(user, {
    fields: [creditPurchase.userId],
    references: [user.id],
  }),
  package: one(creditPackage, {
    fields: [creditPurchase.packageId],
    references: [creditPackage.id],
  }),
  payment: one(payment, {
    fields: [creditPurchase.linkedPaymentId],
    references: [payment.id],
  }),
}))

export const smsActivationRelations = relations(smsActivation, ({ one }) => ({
  user: one(user, {
    fields: [smsActivation.userId],
    references: [user.id],
  }),
  service: one(service, {
    fields: [smsActivation.serviceId],
    references: [service.id],
  }),
  provider: one(provider, {
    fields: [smsActivation.providerId],
    references: [provider.id],
  }),
}))

export const creditTransactionRelations = relations(creditTransaction, ({ one }) => ({
  user: one(user, {
    fields: [creditTransaction.userId],
    references: [user.id],
  }),
  wallet: one(creditWallet, {
    fields: [creditTransaction.walletId],
    references: [creditWallet.id],
  }),
  service: one(service, {
    fields: [creditTransaction.serviceId],
    references: [service.id],
  }),
  activation: one(smsActivation, {
    fields: [creditTransaction.activationId],
    references: [smsActivation.id],
  }),
  purchase: one(creditPurchase, {
    fields: [creditTransaction.purchaseId],
    references: [creditPurchase.id],
  }),
}))

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
