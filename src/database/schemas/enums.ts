import { pgEnum } from 'drizzle-orm/pg-core'

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
export const creditHoldStateEnum = pgEnum('credit_hold_state', [
  'held',
  'debited',
  'released',
  'expired',
])
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
  'cancelled_no_refund',
  'failed',
  'refunded',
])
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected'])
export const configValueTypeEnum = pgEnum('config_value_type', [
  'string',
  'number',
  'boolean',
  'json',
])
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
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'super_admin', 'agent'])
export const vipTierEnum = pgEnum('vip_tier', ['free', 'vip', 'pro'])
export const kycStatusEnum = pgEnum('kyc_status', ['none', 'pending', 'verified', 'rejected'])
export const notificationTypeEnum = pgEnum('notification_type', [
  'credit_expiry_warning',
  'otp_received',
  'refund_processed',
  'low_balance',
  'system_alert',
  'promo',
  'admin_alert',
])
export const notificationChannelEnum = pgEnum('notification_channel', [
  'in_app',
  'sms',
  'email',
  'push',
])
