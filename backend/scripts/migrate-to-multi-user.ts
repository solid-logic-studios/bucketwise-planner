import { createPgPool } from '../src/infrastructure/database/pg.js';
import 'dotenv/config';

/**
 * Migration script to assign existing rows to a default user and tighten constraints.
 *
 * Usage:
 *   DEFAULT_USER_ID=<uuid-of-existing-user> pnpm tsx scripts/migrate-to-multi-user.ts
 *
 * Steps:
 *   1) Ensure user_id columns exist (created by ensureSchema).
 *   2) Set user_id = DEFAULT_USER_ID for any NULL rows across domain tables.
 *   3) Optionally add NOT NULL constraints (opt-in via ADD_NOT_NULL=true).
 */
async function main() {
  const defaultUserId = process.env.DEFAULT_USER_ID;
  const addNotNull = (process.env.ADD_NOT_NULL || '').toLowerCase() === 'true';
  if (!defaultUserId) {
    throw new Error('DEFAULT_USER_ID env var is required');
  }

  const pool = createPgPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tables = [
      'transactions',
      'fortnight_snapshots',
      'debts',
      'budget_profiles',
      'skipped_debt_payments',
    ];

    for (const table of tables) {
      const { rowCount } = await client.query(
        `UPDATE ${table} SET user_id = $1 WHERE user_id IS NULL`,
        [defaultUserId]
      );
      console.log(`Updated ${rowCount} rows in ${table}`);
    }

    if (addNotNull) {
      for (const table of tables) {
        await client.query(`ALTER TABLE ${table} ALTER COLUMN user_id SET NOT NULL`);
      }
      console.log('Applied NOT NULL constraints on user_id columns.');
    }

    await client.query('COMMIT');
    console.log('Migration complete.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
