-- Migration 0005: Set activation_id NOT NULL in credit_hold table
-- Required because Drizzle schema has activationId as notNull()
-- Syncs Postgres schema to match application requirements

-- 1. Delete orphaned rows where activation_id IS NULL
-- These are broken holds from the chicken-and-egg bug (activation never created)
-- They are unrecoverable: no activation exists to link them to
DELETE FROM credit_hold WHERE activation_id IS NULL;

-- 2. Set the column to NOT NULL
-- First drop the DEFAULT NULL so it becomes a true NOT NULL without default
ALTER TABLE credit_hold ALTER COLUMN activation_id DROP DEFAULT;

-- 3. Add NOT NULL constraint
ALTER TABLE credit_hold ALTER COLUMN activation_id SET NOT NULL;

-- 4. Add index for activation_id lookups (performance for release by activation)
CREATE INDEX IF NOT EXISTS credit_hold_activation_idx ON credit_hold(activation_id);
