-- Migration 005: Add configurable currency code to budget profiles
-- Supports MVP currencies: AUD, USD, NZD

ALTER TABLE budget_profiles
ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'AUD';

ALTER TABLE budget_profiles
DROP CONSTRAINT IF EXISTS budget_profiles_currency_code_check;

ALTER TABLE budget_profiles
ADD CONSTRAINT budget_profiles_currency_code_check
CHECK (currency_code IN ('AUD', 'USD', 'NZD'));

COMMENT ON COLUMN budget_profiles.currency_code IS
'Profile currency code for money display/input. MVP supports AUD, USD, and NZD.';
