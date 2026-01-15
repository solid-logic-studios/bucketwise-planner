-- Migration: Add timezone support to budget_profiles and fortnight_snapshots
-- Version: 0.2.0
-- Date: 2026-01-14
-- Description: Adds user timezone storage and explicit UTC boundary columns for fortnights
-- Breaking: No (fully backward compatible - new columns are nullable)

-- ============================================================================
-- PART 1: Add timezone to budget_profiles
-- ============================================================================

-- Add timezone column (IANA timezone format, e.g., 'Australia/Melbourne')
-- Defaults to 'UTC' for backward compatibility
ALTER TABLE budget_profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC' NOT NULL;

-- Add index for quick lookup by user timezone
CREATE INDEX IF NOT EXISTS idx_budget_profiles_user_timezone 
ON budget_profiles(user_id, timezone);

-- Add comment explaining the column
COMMENT ON COLUMN budget_profiles.timezone IS 
'IANA timezone identifier (e.g., Australia/Melbourne, Europe/Copenhagen, UTC). Used to interpret fortnight boundaries in user''s local calendar.';

-- ============================================================================
-- PART 2: Add explicit UTC boundaries to fortnight_snapshots
-- ============================================================================

-- Add UTC boundary columns (nullable for existing rows, populated by backfill)
ALTER TABLE fortnight_snapshots
ADD COLUMN IF NOT EXISTS period_start_utc TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS period_end_utc_exclusive TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS period_start_local_date DATE,
ADD COLUMN IF NOT EXISTS period_end_local_date DATE,
ADD COLUMN IF NOT EXISTS timezone_at_creation TEXT;

-- Add indexes for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_fortnight_snapshots_utc_bounds 
ON fortnight_snapshots(user_id, period_start_utc, period_end_utc_exclusive);

CREATE INDEX IF NOT EXISTS idx_fortnight_snapshots_local_dates 
ON fortnight_snapshots(user_id, period_start_local_date, period_end_local_date);

-- Add comments explaining the columns
COMMENT ON COLUMN fortnight_snapshots.period_start_utc IS 
'Start of fortnight in UTC (inclusive). Computed from period_start_local_date + timezone_at_creation.';

COMMENT ON COLUMN fortnight_snapshots.period_end_utc_exclusive IS 
'End of fortnight in UTC (exclusive, half-open interval). Computed from period_end_local_date + timezone_at_creation. Transactions < this time are included.';

COMMENT ON COLUMN fortnight_snapshots.period_start_local_date IS 
'First day of fortnight in user''s local calendar (YYYY-MM-DD). Example: 2026-01-14.';

COMMENT ON COLUMN fortnight_snapshots.period_end_local_date IS 
'Last day of fortnight in user''s local calendar (YYYY-MM-DD). Example: 2026-01-27. Inclusive end date.';

COMMENT ON COLUMN fortnight_snapshots.timezone_at_creation IS 
'IANA timezone used when creating this fortnight. Preserved for historical accuracy even if user changes timezone later.';

-- ============================================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================================

-- Check that all budget_profiles have timezone set
-- SELECT user_id, timezone FROM budget_profiles WHERE timezone IS NULL;
-- Expected: 0 rows

-- Check existing fortnight_snapshots (should have NULL new columns until backfill)
-- SELECT id, period_start, period_end, period_start_utc, timezone_at_creation 
-- FROM fortnight_snapshots 
-- ORDER BY period_start DESC 
-- LIMIT 10;
-- Expected: period_start_utc and timezone_at_creation are NULL for old rows

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- Uncomment to rollback (WARNING: drops timezone data)
-- ALTER TABLE budget_profiles DROP COLUMN IF EXISTS timezone;
-- DROP INDEX IF EXISTS idx_budget_profiles_user_timezone;
-- 
-- ALTER TABLE fortnight_snapshots 
--   DROP COLUMN IF EXISTS period_start_utc,
--   DROP COLUMN IF EXISTS period_end_utc_exclusive,
--   DROP COLUMN IF EXISTS period_start_local_date,
--   DROP COLUMN IF EXISTS period_end_local_date,
--   DROP COLUMN IF EXISTS timezone_at_creation;
-- DROP INDEX IF EXISTS idx_fortnight_snapshots_utc_bounds;
-- DROP INDEX IF EXISTS idx_fortnight_snapshots_local_dates;
