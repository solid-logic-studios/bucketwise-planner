-- Migration 004: Make user_id the unique conflict key for budget_profiles
--
-- The budget_profiles table previously used a hardcoded id TEXT = 'profile' as its
-- primary key, which meant all users shared the same conflict key on upsert. This is
-- a data-integrity bug in a multi-user system. This migration:
--   1. Ensures user_id is NOT NULL (it always should have been)
--   2. Drops the old meaningless `id` TEXT primary key
--   3. Adds user_id as the new primary key, which correctly scopes each profile to one user

-- Step 1: Ensure all existing rows have a user_id (clean up any orphaned rows first)
DELETE FROM budget_profiles WHERE user_id IS NULL;

-- Step 2: Set user_id NOT NULL
ALTER TABLE budget_profiles ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Drop the old TEXT primary key constraint
ALTER TABLE budget_profiles DROP CONSTRAINT IF EXISTS budget_profiles_pkey;

-- Step 4: Drop the legacy id column (it was always the hardcoded string 'profile')
ALTER TABLE budget_profiles DROP COLUMN IF EXISTS id;

-- Step 5: Make user_id the primary key (enforces uniqueness and replaces old PK)
ALTER TABLE budget_profiles ADD PRIMARY KEY (user_id);
