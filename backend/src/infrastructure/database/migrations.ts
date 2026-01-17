import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { Pool } from 'pg';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Migration tracker table for idempotent migrations.
 * Stores the filename and execution timestamp of each applied migration.
 */
async function ensureMigrationTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

/**
 * Get list of already-applied migrations.
 */
async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query(
    'SELECT filename FROM schema_migrations ORDER BY filename'
  );
  return new Set(result.rows.map((row: { filename: string }) => row.filename));
}

/**
 * Record a migration as applied.
 */
async function recordMigration(pool: Pool, filename: string): Promise<void> {
  await pool.query(
    'INSERT INTO schema_migrations (filename) VALUES ($1)',
    [filename]
  );
}

/**
 * Run all pending migrations in the migrations directory.
 * Migrations are executed in alphabetical order (001-, 002-, etc).
 * Each migration is executed at most once, tracked in schema_migrations table.
 *
 * @param pool PostgreSQL connection pool
 * @throws Error if a migration fails
 */
export async function runMigrations(pool: Pool): Promise<void> {
  try {
    // Ensure migration tracking table exists
    await ensureMigrationTable(pool);

    // Get list of already-applied migrations
    const appliedMigrations = await getAppliedMigrations(pool);

    // Read all .sql files from migrations directory
    const migrationsDir = join(__dirname, '../../..', 'migrations');
    let files: string[] = [];

    try {
      files = await readdir(migrationsDir);
    } catch (err) {
      // Migrations directory may not exist yet, which is fine
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
      console.log('No migrations directory found, skipping migration runner');
      return;
    }

    // Filter to SQL files and sort alphabetically
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      console.log('No migrations to apply');
      return;
    }

    // Apply pending migrations
    for (const filename of sqlFiles) {
      if (appliedMigrations.has(filename)) {
        console.log(`✓ Migration already applied: ${filename}`);
        continue;
      }

      const filepath = join(migrationsDir, filename);
      const sql = await readFile(filepath, 'utf-8');

      console.log(`Running migration: ${filename}`);

      try {
        await pool.query(sql);
        await recordMigration(pool, filename);
        console.log(`✓ Migration applied: ${filename}`);
      } catch (err) {
        console.error(`✗ Migration failed: ${filename}`, err);
        throw new Error(`Migration failed: ${filename}\n${(err as Error).message}`);
      }
    }

    console.log('✓ All migrations completed successfully');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  }
}
