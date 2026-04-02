-- =============================================================================
-- 0001_optimization.sql
-- Indexes, views, and functions for query performance
-- =============================================================================

-- INDEXES

CREATE INDEX IF NOT EXISTS sms_activation_provider_activation_idx
  ON sms_activation (provider_activation_id) WHERE provider_activation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS sms_activation_user_created_idx
  ON sms_activation (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_hold_state_expires_idx
  ON credit_hold (state, expires_at) WHERE state = 'held';

CREATE INDEX IF NOT EXISTS credit_hold_activation_idx
  ON credit_hold (activation_id) WHERE activation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS credit_txn_user_created_idx
  ON credit_transaction (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_lot_consumption_idx
  ON credit_lot (wallet_id, expires_at NULLS LAST, remaining_amount) WHERE remaining_amount > 0;

CREATE INDEX IF NOT EXISTS psc_service_country_idx
  ON provider_service_cost (service_code, country_code);

CREATE INDEX IF NOT EXISTS psc_provider_idx
  ON provider_service_cost (provider_id);

CREATE INDEX IF NOT EXISTS spc_service_country_idx
  ON sub_provider_cost (service_code, country_code);

CREATE INDEX IF NOT EXISTS user_referral_code_idx
  ON "user" (referral_code) WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS price_rule_slug_active_idx
  ON price_rule (service_slug, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS notification_user_unread_idx
  ON notification (user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS fraud_event_unresolved_idx
  ON fraud_event (is_resolved, created_at DESC) WHERE is_resolved = false;

CREATE INDEX IF NOT EXISTS audit_log_admin_recent_idx
  ON admin_audit_log (admin_id, created_at DESC);

-- VIEWS

CREATE OR REPLACE VIEW service_with_availability AS
SELECT
  pr.service_slug, pr.country_iso, pr.price_credits, pr.floor_credits,
  pr.cached_availability, pr.is_active, psc.cost_usd,
  psc.availability AS provider_availability,
  spc.min_price_usd, spc.max_price_usd, spc.availability AS sub_provider_count
FROM price_rule pr
LEFT JOIN provider_service_cost psc ON pr.service_slug = psc.service_code AND pr.country_iso = psc.country_code
LEFT JOIN sub_provider_cost spc ON pr.service_slug = spc.service_code AND pr.country_iso = spc.country_code
WHERE pr.is_active = true;

CREATE OR REPLACE VIEW user_wallet_summary AS
SELECT
  cw.id AS wallet_id, cw.user_id, u.name AS user_name, u.email AS user_email,
  cw.base_balance, cw.bonus_balance, cw.promo_balance, cw.held_balance,
  (cw.base_balance + cw.bonus_balance + cw.promo_balance - cw.held_balance) AS available_balance,
  cw.total_purchased, cw.total_consumed, cw.total_refunded, cw.total_expired, cw.total_bonus_received,
  (SELECT COUNT(*) FROM credit_hold ch WHERE ch.wallet_id = cw.id AND ch.state = 'held') AS active_holds_count
FROM credit_wallet cw
JOIN "user" u ON u.id = cw.user_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM "user" WHERE banned = false) AS total_users,
  (SELECT COUNT(*) FROM "user" WHERE created_at > NOW() - INTERVAL '24 hours') AS new_users_today,
  (SELECT COUNT(*) FROM "user" WHERE created_at > NOW() - INTERVAL '7 days') AS new_users_week,
  (SELECT COALESCE(SUM(total_purchased), 0) FROM credit_wallet) AS total_credits_purchased,
  (SELECT COALESCE(SUM(total_consumed), 0) FROM credit_wallet) AS total_credits_consumed,
  (SELECT COALESCE(SUM(base_balance + bonus_balance + promo_balance), 0) FROM credit_wallet) AS total_credits_outstanding,
  (SELECT COUNT(*) FROM sms_activation WHERE created_at > NOW() - INTERVAL '24 hours') AS activations_today,
  (SELECT COUNT(*) FROM sms_activation WHERE state = 'completed' AND created_at > NOW() - INTERVAL '24 hours') AS completions_today,
  (SELECT COUNT(*) FROM sms_activation WHERE state = 'expired' AND created_at > NOW() - INTERVAL '24 hours') AS expirations_today,
  (SELECT COALESCE(SUM(price_xaf), 0) FROM credit_purchase WHERE status = 'credited' AND created_at > NOW() - INTERVAL '24 hours') AS revenue_today_xaf,
  (SELECT COALESCE(SUM(price_xaf), 0) FROM credit_purchase WHERE status = 'credited' AND created_at > NOW() - INTERVAL '7 days') AS revenue_week_xaf,
  (SELECT COUNT(*) FROM provider WHERE is_active = true) AS active_providers,
  (SELECT COUNT(*) FROM provider WHERE is_active = true AND uptime_pct_30d < 95) AS unhealthy_providers,
  NOW() AS refreshed_at;

CREATE UNIQUE INDEX IF NOT EXISTS dashboard_kpis_refreshed_idx ON dashboard_kpis (refreshed_at);

-- FUNCTIONS

CREATE OR REPLACE FUNCTION cleanup_expired_holds()
RETURNS INTEGER AS $$
DECLARE expired_count INTEGER;
BEGIN
  UPDATE credit_hold SET state = 'expired', released_at = NOW()
  WHERE state = 'held' AND expires_at < NOW();
  GET DIAGNOSTICS expired_count = ROW_COUNT;

  UPDATE credit_wallet cw
  SET base_balance = cw.base_balance + ch.amount, held_balance = cw.held_balance - ch.amount, updated_at = NOW()
  FROM credit_hold ch
  WHERE ch.wallet_id = cw.id AND ch.state = 'expired' AND ch.released_at > NOW() - INTERVAL '1 second';

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_consumable_lots(p_wallet_id TEXT, p_amount INTEGER)
RETURNS TABLE(lot_id TEXT, consume_amount INTEGER) AS $$
DECLARE remaining INTEGER := p_amount; lot RECORD;
BEGIN
  FOR lot IN SELECT cl.id, cl.remaining_amount FROM credit_lot cl
  WHERE cl.wallet_id = p_wallet_id AND cl.remaining_amount > 0
    AND (cl.expires_at IS NULL OR cl.expires_at > NOW())
  ORDER BY CASE cl.credit_type WHEN 'promotional' THEN 1 WHEN 'bonus' THEN 2 WHEN 'base' THEN 3 END,
           cl.expires_at ASC NULLS LAST FOR UPDATE OF cl
  LOOP
    IF remaining <= 0 THEN EXIT; END IF;
    lot_id := lot.id; consume_amount := LEAST(lot.remaining_amount, remaining);
    remaining := remaining - consume_amount; RETURN NEXT;
  END LOOP;
  IF remaining > 0 THEN RAISE EXCEPTION 'insufficient_credits: need %, short by %', p_amount, remaining; END IF;
END;
$$ LANGUAGE plpgsql;
