CREATE TYPE "public"."sms_activation_state" AS ENUM('requested', 'assigned', 'waiting', 'received', 'completed', 'expired', 'cancelled', 'cancelled_no_refund', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."config_value_type" AS ENUM('string', 'number', 'boolean', 'json');--> statement-breakpoint
CREATE TYPE "public"."credit_hold_state" AS ENUM('held', 'debited', 'released', 'expired');--> statement-breakpoint
CREATE TYPE "public"."credit_txn_type" AS ENUM('purchase', 'debit', 'refund', 'bonus_signup', 'bonus_referral', 'bonus_promo', 'bonus_vip', 'bonus_first_purchase', 'adjustment', 'expiration', 'hold', 'release_hold');--> statement-breakpoint
CREATE TYPE "public"."credit_type" AS ENUM('base', 'bonus', 'promotional');--> statement-breakpoint
CREATE TYPE "public"."fraud_action" AS ENUM('flag', 'rate_limit', 'soft_ban', 'hard_ban', 'require_2fa');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('none', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'sms', 'email', 'push');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('credit_expiry_warning', 'otp_received', 'refund_processed', 'low_balance', 'system_alert', 'promo', 'admin_alert');--> statement-breakpoint
CREATE TYPE "public"."economics_payment_method" AS ENUM('mtn_momo', 'orange_money', 'card', 'bank_transfer', 'crypto', 'free');--> statement-breakpoint
CREATE TYPE "public"."credit_purchase_status" AS ENUM('initiated', 'payment_pending', 'confirmed', 'credited', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."support_direction" AS ENUM('user_to_admin', 'admin_to_user');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'super_admin', 'agent');--> statement-breakpoint
CREATE TYPE "public"."vip_tier" AS ENUM('free', 'vip', 'pro');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"username" text,
	"display_username" text,
	"phone_number" text,
	"phone_number_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"banned" boolean DEFAULT false NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"referral_code" text,
	"referred_by_user_id" text,
	"vip_tier" "vip_tier" DEFAULT 'free' NOT NULL,
	"vip_expires_at" timestamp,
	"kyc_status" "kyc_status" DEFAULT 'none' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "user_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_customer_id" text NOT NULL,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"customer_id" text,
	"subscription_id" text,
	"provider" text NOT NULL,
	"provider_payment_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"customer_id" text,
	"provider" text NOT NULL,
	"provider_subscription_id" text NOT NULL,
	"status" text NOT NULL,
	"plan" text NOT NULL,
	"interval" text,
	"amount" numeric(10, 2),
	"currency" text,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_adjustment_approval" (
	"id" text PRIMARY KEY NOT NULL,
	"requester_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"reason_note" text,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"approver_id" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"rejection_note" text,
	"executed_txn_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_hold" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"activation_id" text,
	"amount" integer NOT NULL,
	"credit_type" "credit_type" NOT NULL,
	"lot_id" text NOT NULL,
	"state" "credit_hold_state" DEFAULT 'held' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"idempotency_key" text,
	"debited_at" timestamp,
	"released_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_hold_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "credit_lot" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_id" text NOT NULL,
	"credit_type" "credit_type" NOT NULL,
	"initial_amount" integer NOT NULL,
	"remaining_amount" integer NOT NULL,
	"source_txn_id" text,
	"expires_at" timestamp,
	"is_expired" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_package" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_fr" text NOT NULL,
	"name_en" text NOT NULL,
	"credits" integer NOT NULL,
	"price_xaf" integer NOT NULL,
	"bonus_pct" integer DEFAULT 0 NOT NULL,
	"label" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"allowed_payment_methods" jsonb,
	"min_purchase_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_package_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "credit_purchase" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"package_id" text NOT NULL,
	"linked_payment_id" text,
	"credits_base" integer NOT NULL,
	"credits_bonus" integer NOT NULL,
	"total_credits" integer NOT NULL,
	"price_xaf" integer NOT NULL,
	"payment_method" "economics_payment_method" NOT NULL,
	"payment_ref" text,
	"payment_gateway_id" text,
	"checkout_url" text,
	"promo_code_id" text,
	"idempotency_key" text,
	"status" "credit_purchase_status" DEFAULT 'initiated' NOT NULL,
	"is_first_purchase" boolean DEFAULT false NOT NULL,
	"credited_at" timestamp,
	"failed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_purchase_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "credit_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"type" "credit_txn_type" NOT NULL,
	"credit_type" "credit_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"service_id" text,
	"activation_id" text,
	"purchase_id" text,
	"lot_id" text,
	"hold_id" text,
	"wholesale_cost_usd" jsonb,
	"revenue_xaf" jsonb,
	"description" text,
	"admin_note" text,
	"ip_address" text,
	"device_fingerprint" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"base_balance" integer DEFAULT 0 NOT NULL,
	"bonus_balance" integer DEFAULT 0 NOT NULL,
	"promo_balance" integer DEFAULT 0 NOT NULL,
	"total_purchased" integer DEFAULT 0 NOT NULL,
	"total_consumed" integer DEFAULT 0 NOT NULL,
	"total_refunded" integer DEFAULT 0 NOT NULL,
	"total_expired" integer DEFAULT 0 NOT NULL,
	"total_bonus_received" integer DEFAULT 0 NOT NULL,
	"held_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_wallet_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "external_country_mapping" (
	"id" text PRIMARY KEY NOT NULL,
	"iso_code" text NOT NULL,
	"provider_id" text NOT NULL,
	"external_country_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_service_mapping" (
	"id" text PRIMARY KEY NOT NULL,
	"local_slug" text NOT NULL,
	"provider_id" text NOT NULL,
	"external_api_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_override" (
	"id" text PRIMARY KEY NOT NULL,
	"service_slug" text NOT NULL,
	"country_iso" text NOT NULL,
	"price_credits" integer NOT NULL,
	"floor_credits" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"service_slug" text NOT NULL,
	"country_iso" text NOT NULL,
	"price_credits" integer NOT NULL,
	"floor_credits" integer NOT NULL,
	"baseline_wholesale_usd" numeric(10, 4),
	"low_stock_threshold" integer DEFAULT 50,
	"low_stock_multiplier_pct" integer DEFAULT 15,
	"cached_availability" integer DEFAULT 0,
	"availability_last_checked_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"api_base_url" text NOT NULL,
	"api_key_encrypted" text NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"uptime_pct_30d" numeric(5, 2) DEFAULT '100',
	"avg_response_ms" integer DEFAULT 0,
	"error_rate_30d" numeric(5, 4) DEFAULT '0',
	"success_rate_30d" numeric(5, 4) DEFAULT '1',
	"max_retry_attempts" integer DEFAULT 3 NOT NULL,
	"reliability_penalty_multiplier" numeric(3, 1) DEFAULT '2',
	"cache_ttl_seconds" integer DEFAULT 60 NOT NULL,
	"current_balance_usd" numeric(10, 4),
	"balance_last_checked_at" timestamp,
	"min_balance_alert_usd" numeric(10, 4),
	"last_health_check" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provider_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sms_activation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"service_slug" text NOT NULL,
	"country_code" text NOT NULL,
	"requested_country_iso" text,
	"provider_id" text,
	"provider_activation_id" text,
	"phone_number" text,
	"sms_code" text,
	"full_sms_text" text,
	"state" "sms_activation_state" DEFAULT 'requested' NOT NULL,
	"credits_charged" integer NOT NULL,
	"wholesale_cost_usd" jsonb,
	"max_price_sent_usd" jsonb,
	"margin_ratio" jsonb,
	"can_get_another_sms" boolean DEFAULT false NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"failure_reason" text,
	"provider_response_raw" jsonb,
	"timer_expires_at" timestamp,
	"number_assigned_at" timestamp,
	"sms_received_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"expired_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"before_data" jsonb,
	"after_data" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fraud_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"rule_id" text,
	"signal_type" text NOT NULL,
	"signals" jsonb NOT NULL,
	"decision" "fraud_action" NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp,
	"resolution_note" text,
	"ip_address" text,
	"device_fingerprint" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fraud_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"signal_type" text NOT NULL,
	"threshold" numeric(10, 2) NOT NULL,
	"action" "fraud_action" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"window_hours" integer DEFAULT 1,
	"min_attempts" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"value_type" "config_value_type" NOT NULL,
	"category" text NOT NULL,
	"description_fr" text,
	"description_en" text,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_code" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description_fr" text,
	"description_en" text,
	"bonus_credits" integer DEFAULT 0 NOT NULL,
	"discount_pct" numeric(5, 2) DEFAULT '0',
	"usage_limit" integer NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"max_uses_per_user" integer DEFAULT 1 NOT NULL,
	"new_users_only" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promo_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"admin_id" text,
	"direction" "support_direction" NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referee_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_earnings_credits" integer DEFAULT 0 NOT NULL,
	"purchases_tracked" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activation_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"activation_id" text NOT NULL,
	"provider_id" text,
	"attempt_order" integer NOT NULL,
	"service_code" text NOT NULL,
	"country_code" text NOT NULL,
	"max_price_sent_usd" jsonb,
	"response_status" text,
	"response_raw" jsonb,
	"response_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"title_fr" text,
	"title_en" text,
	"content_fr" text,
	"content_en" text,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_code_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"promo_code_id" text NOT NULL,
	"user_id" text NOT NULL,
	"purchase_id" text,
	"credits_awarded" integer NOT NULL,
	"discount_applied_xaf" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_balance_log" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"balance_usd" numeric(10, 4) NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_device" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"fingerprint" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_referred_by_user_id_user_id_fk" FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_adjustment_approval" ADD CONSTRAINT "credit_adjustment_approval_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_adjustment_approval" ADD CONSTRAINT "credit_adjustment_approval_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_adjustment_approval" ADD CONSTRAINT "credit_adjustment_approval_approver_id_user_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_adjustment_approval" ADD CONSTRAINT "credit_adjustment_approval_executed_txn_id_credit_transaction_id_fk" FOREIGN KEY ("executed_txn_id") REFERENCES "public"."credit_transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_hold" ADD CONSTRAINT "credit_hold_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_hold" ADD CONSTRAINT "credit_hold_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."credit_wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_hold" ADD CONSTRAINT "credit_hold_activation_id_sms_activation_id_fk" FOREIGN KEY ("activation_id") REFERENCES "public"."sms_activation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_hold" ADD CONSTRAINT "credit_hold_lot_id_credit_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."credit_lot"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_lot" ADD CONSTRAINT "credit_lot_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."credit_wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_purchase" ADD CONSTRAINT "credit_purchase_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_purchase" ADD CONSTRAINT "credit_purchase_package_id_credit_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."credit_package"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_purchase" ADD CONSTRAINT "credit_purchase_linked_payment_id_payment_id_fk" FOREIGN KEY ("linked_payment_id") REFERENCES "public"."payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_purchase" ADD CONSTRAINT "credit_purchase_promo_code_id_promo_code_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."credit_wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_activation_id_sms_activation_id_fk" FOREIGN KEY ("activation_id") REFERENCES "public"."sms_activation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_purchase_id_credit_purchase_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."credit_purchase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_lot_id_credit_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."credit_lot"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_hold_id_credit_hold_id_fk" FOREIGN KEY ("hold_id") REFERENCES "public"."credit_hold"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_wallet" ADD CONSTRAINT "credit_wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_country_mapping" ADD CONSTRAINT "external_country_mapping_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_service_mapping" ADD CONSTRAINT "external_service_mapping_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_activation" ADD CONSTRAINT "sms_activation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_activation" ADD CONSTRAINT "sms_activation_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fraud_event" ADD CONSTRAINT "fraud_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fraud_event" ADD CONSTRAINT "fraud_event_rule_id_fraud_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."fraud_rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fraud_event" ADD CONSTRAINT "fraud_event_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_config" ADD CONSTRAINT "platform_config_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrer_id_user_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referee_id_user_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activation_attempt" ADD CONSTRAINT "activation_attempt_activation_id_sms_activation_id_fk" FOREIGN KEY ("activation_id") REFERENCES "public"."sms_activation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activation_attempt" ADD CONSTRAINT "activation_attempt_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_usage" ADD CONSTRAINT "promo_code_usage_promo_code_id_promo_code_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_code"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_usage" ADD CONSTRAINT "promo_code_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_usage" ADD CONSTRAINT "promo_code_usage_purchase_id_credit_purchase_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."credit_purchase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_balance_log" ADD CONSTRAINT "provider_balance_log_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_device" ADD CONSTRAINT "user_device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "customer_userId_idx" ON "customer" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_provider_customerId_idx" ON "customer" USING btree ("provider_customer_id");--> statement-breakpoint
CREATE INDEX "payment_userId_idx" ON "payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_customerId_idx" ON "payment" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payment_subscriptionId_idx" ON "payment" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "payment_provider_paymentId_idx" ON "payment" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE INDEX "subscription_userId_idx" ON "subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_customerId_idx" ON "subscription" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "subscription_provider_subscriptionId_idx" ON "subscription" USING btree ("provider_subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credit_adjustment_status_idx" ON "credit_adjustment_approval" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credit_adjustment_created_idx" ON "credit_adjustment_approval" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_hold_state_idx" ON "credit_hold" USING btree ("state");--> statement-breakpoint
CREATE INDEX "credit_hold_expires_idx" ON "credit_hold" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "credit_lot_wallet_idx" ON "credit_lot" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "credit_lot_type_idx" ON "credit_lot" USING btree ("credit_type");--> statement-breakpoint
CREATE INDEX "credit_lot_expires_idx" ON "credit_lot" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "credit_lot_remaining_idx" ON "credit_lot" USING btree ("remaining_amount");--> statement-breakpoint
CREATE INDEX "credit_package_sort_idx" ON "credit_package" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "credit_package_active_idx" ON "credit_package" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "credit_purchase_user_idx" ON "credit_purchase" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_purchase_status_idx" ON "credit_purchase" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credit_txn_user_idx" ON "credit_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_txn_type_idx" ON "credit_transaction" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_wallet_user_unique" ON "credit_wallet" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_country_mapping_unique" ON "external_country_mapping" USING btree ("iso_code","provider_id");--> statement-breakpoint
CREATE INDEX "external_country_mapping_iso_idx" ON "external_country_mapping" USING btree ("iso_code");--> statement-breakpoint
CREATE INDEX "external_country_mapping_provider_idx" ON "external_country_mapping" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_service_mapping_unique" ON "external_service_mapping" USING btree ("local_slug","provider_id");--> statement-breakpoint
CREATE INDEX "external_service_mapping_slug_idx" ON "external_service_mapping" USING btree ("local_slug");--> statement-breakpoint
CREATE INDEX "external_service_mapping_provider_idx" ON "external_service_mapping" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "price_override_unique" ON "price_override" USING btree ("service_slug","country_iso");--> statement-breakpoint
CREATE INDEX "price_override_slug_idx" ON "price_override" USING btree ("service_slug");--> statement-breakpoint
CREATE INDEX "price_override_iso_idx" ON "price_override" USING btree ("country_iso");--> statement-breakpoint
CREATE UNIQUE INDEX "price_rule_unique" ON "price_rule" USING btree ("service_slug","country_iso");--> statement-breakpoint
CREATE INDEX "price_rule_slug_idx" ON "price_rule" USING btree ("service_slug");--> statement-breakpoint
CREATE INDEX "price_rule_iso_idx" ON "price_rule" USING btree ("country_iso");--> statement-breakpoint
CREATE INDEX "price_rule_active_idx" ON "price_rule" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "provider_priority_idx" ON "provider" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "provider_active_idx" ON "provider" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sms_activation_user_idx" ON "sms_activation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sms_activation_state_idx" ON "sms_activation" USING btree ("state");--> statement-breakpoint
CREATE INDEX "sms_activation_slug_idx" ON "sms_activation" USING btree ("service_slug");--> statement-breakpoint
CREATE INDEX "admin_audit_admin_idx" ON "admin_audit_log" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_audit_created_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "fraud_event_user_idx" ON "fraud_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fraud_event_resolved_idx" ON "fraud_event" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX "fraud_rule_active_idx" ON "fraud_rule" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "platform_config_category_idx" ON "platform_config" USING btree ("category");--> statement-breakpoint
CREATE INDEX "promo_code_active_idx" ON "promo_code" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "support_messages_userId_idx" ON "support_messages" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_referee_unique" ON "referral" USING btree ("referee_id");--> statement-breakpoint
CREATE INDEX "activation_attempt_activation_idx" ON "activation_attempt" USING btree ("activation_id");--> statement-breakpoint
CREATE INDEX "activation_attempt_provider_idx" ON "activation_attempt" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_read_idx" ON "notification" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notification" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_code_usage_unique" ON "promo_code_usage" USING btree ("promo_code_id","user_id");--> statement-breakpoint
CREATE INDEX "promo_code_usage_user_idx" ON "promo_code_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "provider_balance_log_provider_idx" ON "provider_balance_log" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_device_unique" ON "user_device" USING btree ("user_id","fingerprint");--> statement-breakpoint
CREATE INDEX "user_device_fingerprint_idx" ON "user_device" USING btree ("fingerprint");