# Automatic Database Migrations

## Overview

The backend now automatically applies database migrations on startup, making deployments seamless for all users (both existing and new).

## How It Works

1. **Server Startup** (`server.ts` → `app.ts`)
   - Creates database pool
   - Runs `ensureSchema()` - creates base schema (tables, indexes)
   - Runs `runMigrations()` - applies any pending migrations

2. **Migration Tracking** (`infrastructure/database/migrations.ts`)
   - Creates `schema_migrations` table to track applied migrations
   - Reads all `.sql` files from `migrations/` directory
   - Sorts files alphabetically (001-, 002-, etc)
   - Applies only **pending** migrations (idempotent)
   - Records each migration as applied

3. **Idempotent Migrations**
   - Each migration runs **at most once**
   - Safe to restart server without re-running migrations
   - Uses `IF NOT EXISTS` in SQL to avoid errors on re-runs

## File Structure

```
backend/
├── migrations/
│   ├── 001-add-timezone-support.sql        (applied once)
│   ├── 002-add-transfer-support.sql        (applied once)
│   └── 003-future-migration.sql            (will apply automatically)
├── src/
│   └── infrastructure/
│       └── database/
│           ├── pg.ts                       (base schema for fresh installs)
│           ├── migrations.ts               (NEW: migration runner)
│           └── ...
```

## Migration Lifecycle

### Fresh Install (New User)
1. Server starts
2. `ensureSchema()` creates complete base schema (with `source_bucket`, `destination_bucket`, etc.)
3. `runMigrations()` runs - finds no migrations to apply (or applies any new ones)
4. ✅ User has full schema ready to use

### Existing Install (200+ Users Who Already Cloned)
1. Server starts
2. `ensureSchema()` runs - `CREATE TABLE IF NOT EXISTS` does nothing (tables exist)
3. `runMigrations()` runs:
   - Checks `schema_migrations` table
   - `001-add-timezone-support.sql` - already applied (skipped)
   - `002-add-transfer-support.sql` - **NOT applied yet** (applies now)
   - Records migration as applied
4. ✅ User's database automatically updated, no manual action needed

### Future Deployments
- Any new migration files added to `migrations/` directory are applied automatically
- User doesn't need to run any manual SQL or restart services
- Happens transparently on next server start/restart

## SQL Migration Guidelines

When creating new migrations:

1. **File naming**: Use `NNN-description.sql` format (001-, 002-, etc)
2. **Use IF NOT EXISTS**: For safe re-runs
   ```sql
   ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE;
   ```
3. **Transaction safety**: Wrap in `BEGIN;` and `COMMIT;`
   ```sql
   BEGIN;
   -- your SQL here
   COMMIT;
   ```
4. **Comments**: Add header explaining what the migration does
   ```sql
   -- Migration: Description
   -- Reason: Why this change
   -- Date: YYYY-MM-DD
   ```

## Example: 002-add-transfer-support.sql

```sql
-- Migration: Add transfer functionality support
-- Description: Add source_bucket and destination_bucket columns
-- Date: 2026-01-17

BEGIN;

ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS source_bucket TEXT,
  ADD COLUMN IF NOT EXISTS destination_bucket TEXT;

UPDATE transactions
SET source_bucket = bucket
WHERE source_bucket IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_source_bucket 
  ON transactions(source_bucket);

COMMIT;
```

## Monitoring Migrations

### Startup Logs
```
Storage method: postgres
Running migration: 001-add-timezone-support.sql
✓ Migration already applied: 001-add-timezone-support.sql
Running migration: 002-add-transfer-support.sql
✓ Migration applied: 002-add-transfer-support.sql
✓ All migrations completed successfully
```

### Check Applied Migrations
```sql
SELECT * FROM schema_migrations ORDER BY filename;
```

Output:
```
 id |           filename           |       executed_at
----+------------------------------+------------------------
  1 | 001-add-timezone-support.sql | 2026-01-10 10:23:45+00
  2 | 002-add-transfer-support.sql | 2026-01-17 14:32:12+00
```

## Error Handling

### Migration Failure
If a migration fails:
1. Error logged with migration name
2. Stack trace printed
3. Server startup fails (safe failure)
4. User must fix the migration SQL or database state
5. Server can be restarted once fixed

### Common Issues

**"Migration already applied"**
- Normal log message, not an error
- Migration has already run, skipping re-run

**"No migrations directory found"**
- Fine for existing installs without migrations
- New installs will have migrations directory

**"Migration failed: 002-add-transfer-support.sql"**
- Migration SQL has syntax error OR
- Target table/column doesn't exist OR
- Database constraint violation
- Fix the issue and restart server

## For Developers

### Adding a New Migration

1. Create file: `backend/migrations/003-your-migration.sql`
2. Write SQL with comments and `IF NOT EXISTS`
3. Test locally:
   ```bash
   cd backend
   pnpm dev
   ```
4. Check logs for "✓ Migration applied: 003-your-migration.sql"
5. Commit and push

### Testing Migrations

To test migrations on fresh database:
1. Delete local database
2. Restart server
3. Verify migrations apply in order
4. Check logs

## Backward Compatibility

✅ **No breaking changes**:
- Fresh installs get complete schema (including new columns)
- Existing installs run migrations automatically
- All migrations use `IF NOT EXISTS` (safe to re-run)
- Migration tracking prevents duplicate runs
- All code updates are backward compatible

## Performance Notes

- Migration runner only checks `schema_migrations` table once per startup
- Minimal overhead (typically <100ms)
- Safe concurrent execution (PostgreSQL serializes DDL)

## Future Enhancements

Possible improvements:
- [ ] Migration status endpoint (GET `/admin/migrations`)
- [ ] Rollback capability (not needed for append-only schema)
- [ ] Pre-migration backups (manual for safety)
- [ ] Dry-run mode (test migrations without applying)
- [ ] Down migrations (remove columns/tables - risky, usually avoided)

## References

- Migration file: `backend/src/infrastructure/database/migrations.ts`
- App initialization: `backend/src/presentation/http/app.ts`
- Existing migrations: `backend/migrations/`
- Base schema: `backend/src/infrastructure/database/pg.ts`
