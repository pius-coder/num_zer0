-- Migration 0004: Recreate credit_hold table with explicit defaults
-- The old table was failing due to implicit defaults conflict on Vercel/Supabase.

-- 1. Drop the problematic table
DROP TABLE IF EXISTS credit_hold CASCADE;

-- 2. Recreate with robust schema
CREATE TABLE credit_hold (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL REFERENCES credit_wallet(id) ON DELETE CASCADE,
  
  -- FK Security: Allows NULL if not assigned yet, SET NULL if activation deleted
  activation_id TEXT DEFAULT NULL REFERENCES sms_activation(id) ON DELETE SET NULL,
  
  amount INTEGER NOT NULL,
  credit_type credit_type NOT NULL,
  lot_id TEXT NOT NULL REFERENCES credit_lot(id) ON DELETE CASCADE,
  
  state credit_hold_state DEFAULT 'held' NOT NULL,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  
  idempotency_key TEXT UNIQUE,
  
  -- EXPLICIT DEFAULTS ensures Postgres knows what to do if value is omitted by code
  debited_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,
  released_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Performance Indexes
CREATE INDEX credit_hold_idempotency_idx ON credit_hold(idempotency_key);
CREATE INDEX credit_hold_state_idx ON credit_hold(state);
CREATE INDEX credit_hold_wallet_idx ON credit_hold(wallet_id);
