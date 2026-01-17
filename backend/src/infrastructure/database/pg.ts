import { Pool } from 'pg';

function buildConnectionConfig() {
  const connectionString = process.env.PG_CONNECTION_STRING;
  if (connectionString) {
    return { connectionString };
  }

const requiredVars = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'] as const;
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
    throw new Error(`Missing required PostgreSQL environment variables: ${missing.join(', ')}`);
}

return {
    host: process.env.PGHOST!,
    port: Number(process.env.PGPORT!),
    user: process.env.PGUSER!,
    password: process.env.PGPASSWORD!,
    database: process.env.PGDATABASE!,
};
}

export function createPgPool(): Pool {
  return new Pool(buildConnectionConfig());
}

export async function ensureSchema(pool: Pool): Promise<void> {
  await pool.query(`
    -- Create users table FIRST (other tables reference it)
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

    -- Create domain tables without user_id initially
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY,
      bucket TEXT NOT NULL,
      kind TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      description TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL,
      tags TEXT[] NOT NULL DEFAULT '{}',
      source_bucket TEXT,
      destination_bucket TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Indexes for transaction queries and transfer support
    CREATE INDEX IF NOT EXISTS idx_transactions_source_bucket ON transactions(source_bucket);
    CREATE INDEX IF NOT EXISTS idx_transactions_destination_bucket ON transactions(destination_bucket);
    CREATE INDEX IF NOT EXISTS idx_transactions_source_dest ON transactions(source_bucket, destination_bucket);

    CREATE TABLE IF NOT EXISTS fortnight_snapshots (
      id UUID PRIMARY KEY,
      period_start TIMESTAMPTZ NOT NULL,
      period_end TIMESTAMPTZ NOT NULL,
      allocations JSONB NOT NULL DEFAULT '[]',
      transactions JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS debts (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      debt_type TEXT NOT NULL CHECK (debt_type IN ('credit-card', 'mortgage')),
      original_amount_cents INTEGER NOT NULL,
      current_balance_cents INTEGER NOT NULL,
      interest_rate DECIMAL(5,4) NOT NULL,
      minimum_payment_cents INTEGER NOT NULL,
      priority INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_debts_priority 
      ON debts (priority ASC, current_balance_cents ASC);
    CREATE INDEX IF NOT EXISTS idx_debts_type 
      ON debts (debt_type);

    CREATE TABLE IF NOT EXISTS budget_profiles (
      id TEXT PRIMARY KEY,
      fortnightly_income_cents INTEGER NOT NULL DEFAULT 0,
      default_fire_extinguisher_cents INTEGER NOT NULL DEFAULT 0,
      default_fire_extinguisher_bps INTEGER NOT NULL DEFAULT 0,
      fixed_expenses JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS skipped_debt_payments (
      id UUID PRIMARY KEY,
      debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
      fortnight_id TEXT NOT NULL,
      payment_date DATE NOT NULL,
      amount_cents INTEGER NOT NULL,
      skip_reason TEXT,
      skipped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uniq_skipped_payment UNIQUE (debt_id, fortnight_id)
    );

    CREATE INDEX IF NOT EXISTS idx_skipped_debt_payments_debt_id ON skipped_debt_payments (debt_id);
    CREATE INDEX IF NOT EXISTS idx_skipped_debt_payments_fortnight_id ON skipped_debt_payments (fortnight_id);

    -- Add user_id columns via ALTER TABLE (safe for existing tables)
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
    ALTER TABLE fortnight_snapshots ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
    ALTER TABLE debts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
    ALTER TABLE budget_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
    ALTER TABLE skipped_debt_payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

    -- Create indexes on user_id columns
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_fortnight_snapshots_user_id ON fortnight_snapshots(user_id);
    CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
    CREATE INDEX IF NOT EXISTS idx_budget_profiles_user_id ON budget_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_skipped_debt_payments_user_id ON skipped_debt_payments(user_id);

    -- Mortgage-specific extra fields on debts (non-breaking, optional)
    ALTER TABLE debts ADD COLUMN IF NOT EXISTS min_payment_frequency TEXT NOT NULL DEFAULT 'FORTNIGHTLY' CHECK (min_payment_frequency IN ('FORTNIGHTLY','MONTHLY'));
    ALTER TABLE debts ADD COLUMN IF NOT EXISTS annual_fee_cents INTEGER NOT NULL DEFAULT 0;
  `);
}
