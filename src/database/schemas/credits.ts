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
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { payment } from './payments'
import { smsActivation } from './activations'
import { promoCode } from './governance'
import {
  creditTypeEnum,
  creditTxnTypeEnum,
  creditHoldStateEnum,
  purchaseStatusEnum,
  approvalStatusEnum,
  paymentMethodEnum,
} from './enums'

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
  (table) => [
    index('credit_package_sort_idx').on(table.sortOrder),
    index('credit_package_active_idx').on(table.isActive),
  ]
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
    heldBalance: integer('held_balance').default(0).notNull(),
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
    activationId: text('activation_id')
      .notNull()
      .references(() => smsActivation.id, { onDelete: 'cascade' }),
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
  (table) => [
    index('credit_hold_state_idx').on(table.state),
    index('credit_hold_expires_idx').on(table.expiresAt),
  ]
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
    serviceId: text('service_id'),
    activationId: text('activation_id').references(() => smsActivation.id),
    purchaseId: text('purchase_id').references(() => creditPurchase.id),
    lotId: text('lot_id').references(() => creditLot.id),
    holdId: text('hold_id').references(() => creditHold.id),
    wholesaleCostUsd: jsonb('wholesale_cost_usd'),
    revenueXaf: jsonb('revenue_xaf'),
    description: text('description'),
    adminNote: text('admin_note'),
    ipAddress: text('ip_address'),
    deviceFingerprint: text('device_fingerprint'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('credit_txn_user_idx').on(table.userId),
    index('credit_txn_type_idx').on(table.type),
  ]
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
    promoCodeId: text('promo_code_id').references(() => promoCode.id),
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
  (table) => [
    index('credit_purchase_user_idx').on(table.userId),
    index('credit_purchase_status_idx').on(table.status),
  ]
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
  (table) => [
    index('credit_adjustment_status_idx').on(table.status),
    index('credit_adjustment_created_idx').on(table.createdAt),
  ]
)

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

export const creditTransactionRelations = relations(creditTransaction, ({ one }) => ({
  user: one(user, {
    fields: [creditTransaction.userId],
    references: [user.id],
  }),
  wallet: one(creditWallet, {
    fields: [creditTransaction.walletId],
    references: [creditWallet.id],
  }),
}))
