#!/usr/bin/env tsx
/**
 * Backfill Script: Populate timezone boundary columns in fortnight_snapshots
 * 
 * Purpose: After adding timezone support (migration 001), this script:
 * 1. Fetches all fortnight_snapshots where period_start_utc IS NULL
 * 2. For each snapshot, gets the user's timezone (or defaults to 'UTC')
 * 3. Recomputes UTC boundaries from existing period_start/period_end
 * 4. Extracts local calendar dates
 * 5. Updates the snapshot with new columns
 * 
 * Run after migration: tsx backend/scripts/backfill-timezone-boundaries.ts
 * 
 * Idempotent: Safe to run multiple times (only updates rows with NULL period_start_utc)
 */

import 'dotenv/config';
import pg from 'pg';
import { TimezoneService } from '../src/domain/services/timezone.service.js';

const { Pool } = pg;

interface FortnightSnapshotRow {
  id: string;
  user_id: string;
  period_start: Date;
  period_end: Date;
}

interface UserTimezone {
  user_id: string;
  timezone: string;
}

async function backfillTimezoneBoundaries() {
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
  });

  try {
    console.log('🔄 Starting timezone boundary backfill...\n');

    // Step 1: Fetch all fortnight snapshots that need backfilling
    const snapshotsResult = await pool.query<FortnightSnapshotRow>(`
      SELECT id, user_id, period_start, period_end
      FROM fortnight_snapshots
      WHERE period_start_utc IS NULL
      ORDER BY period_start DESC
    `);

    const snapshots = snapshotsResult.rows;
    console.log(`📊 Found ${snapshots.length} fortnight snapshots to backfill\n`);

    if (snapshots.length === 0) {
      console.log('✅ No snapshots need backfilling. All done!');
      return;
    }

    // Step 2: Fetch user timezones (with default 'UTC')
    const userIds = [...new Set(snapshots.map(s => s.user_id))];
    const timezonesResult = await pool.query<UserTimezone>(`
      SELECT user_id, timezone
      FROM budget_profiles
      WHERE user_id = ANY($1::uuid[])
    `, [userIds]);

    const userTimezones = new Map<string, string>(
      timezonesResult.rows.map(row => [row.user_id, row.timezone])
    );

    console.log(`👥 Found timezones for ${userTimezones.size} users\n`);

    // Step 3: Process each snapshot
    let updatedCount = 0;
    let errorCount = 0;

    for (const snapshot of snapshots) {
      try {
        // Get user's timezone (default to 'UTC' if not found)
        const timezone = userTimezones.get(snapshot.user_id) ?? 'UTC';

        // Extract local calendar dates (YYYY-MM-DD)
        const periodStartLocalDate = snapshot.period_start.toISOString().split('T')[0];
        const periodEndLocalDate = snapshot.period_end.toISOString().split('T')[0];

        // Compute UTC boundaries using TimezoneService
        const { startUtc, endUtcExclusive } = TimezoneService.getFortnightBoundsUtc(
          periodStartLocalDate,
          periodEndLocalDate,
          timezone
        );

        // Update snapshot with new columns
        await pool.query(`
          UPDATE fortnight_snapshots
          SET 
            period_start_utc = $1,
            period_end_utc_exclusive = $2,
            period_start_local_date = $3,
            period_end_local_date = $4,
            timezone_at_creation = $5
          WHERE id = $6
        `, [
          startUtc,
          endUtcExclusive,
          periodStartLocalDate,
          periodEndLocalDate,
          timezone,
          snapshot.id
        ]);

        updatedCount++;

        if (updatedCount % 10 === 0) {
          console.log(`  ✓ Processed ${updatedCount}/${snapshots.length} snapshots...`);
        }

      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error processing snapshot ${snapshot.id}:`, error);
      }
    }

    console.log(`\n✅ Backfill complete!`);
    console.log(`   - Updated: ${updatedCount} snapshots`);
    console.log(`   - Errors: ${errorCount}`);

    // Step 4: Verification query
    console.log('\n🔍 Verification (sample of updated rows):');
    const verificationResult = await pool.query(`
      SELECT 
        id,
        period_start,
        period_end,
        period_start_utc,
        period_end_utc_exclusive,
        period_start_local_date,
        period_end_local_date,
        timezone_at_creation
      FROM fortnight_snapshots
      WHERE period_start_utc IS NOT NULL
      ORDER BY period_start DESC
      LIMIT 5
    `);

    console.table(verificationResult.rows);

    // Check for remaining NULL rows
    const remainingNullsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM fortnight_snapshots
      WHERE period_start_utc IS NULL
    `);

    const remainingNulls = parseInt(remainingNullsResult.rows[0].count, 10);
    if (remainingNulls > 0) {
      console.log(`\n⚠️  Warning: ${remainingNulls} snapshots still have NULL period_start_utc`);
      console.log('   Run this script again to retry failed rows.');
    } else {
      console.log('\n✅ All snapshots have been backfilled successfully!');
    }

  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
backfillTimezoneBoundaries()
  .then(() => {
    console.log('\n🎉 Backfill script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Backfill script failed:', error);
    process.exit(1);
  });
