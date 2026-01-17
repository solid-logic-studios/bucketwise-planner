-- Migration: Add transfer functionality support
-- Description: Add source_bucket and destination_bucket columns to transactions table
--              to support transferring funds between buckets within a fortnight.
--              Also migrate existing fortnight_snapshots JSON data to new format.
-- Version: 2
-- Date: 2026-01-17

BEGIN;

-- Step 1: Add new columns to transactions table (nullable for backward compatibility during migration)
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS source_bucket TEXT,
  ADD COLUMN IF NOT EXISTS destination_bucket TEXT;

-- Step 2: Backfill existing transactions in transactions table
-- For existing transactions, source_bucket = bucket (current behavior)
-- destination_bucket remains NULL (not a transfer)
UPDATE transactions
SET source_bucket = bucket
WHERE source_bucket IS NULL;

-- Step 3: Migrate fortnight_snapshots JSON data
-- Transform transactions from old format { bucket, kind, ... } 
-- to new format { sourceBucket, destinationBucket, kind, ... }
UPDATE fortnight_snapshots
SET transactions = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tx->>'id',
      'sourceBucket', COALESCE(tx->>'sourceBucket', tx->>'bucket'),
      'destinationBucket', tx->>'destinationBucket',
      'kind', tx->>'kind',
      'amountCents', tx->>'amountCents',
      'description', tx->>'description',
      'occurredAt', tx->>'occurredAt',
      'tags', tx->'tags'
    )
  )
  FROM jsonb_array_elements(transactions) AS tx
)
WHERE transactions IS NOT NULL AND jsonb_array_length(transactions) > 0;

-- Step 4: Create indexes for transfer queries
CREATE INDEX IF NOT EXISTS idx_transactions_source_bucket ON transactions(source_bucket);
CREATE INDEX IF NOT EXISTS idx_transactions_destination_bucket ON transactions(destination_bucket);
CREATE INDEX IF NOT EXISTS idx_transactions_source_dest ON transactions(source_bucket, destination_bucket);

COMMIT;
