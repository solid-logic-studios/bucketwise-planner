# Changelog

All notable changes to Bucketwise Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.4] - 2026-04-08

### Fixed

- Profile page: salary and fixed expenses no longer revert on every keypress — `useEffect` dependency `[form]` replaced with `[]` to prevent Mantine `useForm` reference churn from triggering server re-fetches that overwrite in-progress edits (closes #24)
- Profile data isolation: `budget_profiles` now uses `user_id` as the primary key so each user's profile is always written to and read from their own row; previously all users shared `id='profile'`, causing multi-user data corruption

### Migration Notes

1. Migration `004-budget-profiles-user-id-primary-key.sql` runs automatically on backend startup
2. The migration deletes any orphaned rows (rows without a matching `users` record), promotes `user_id` to `PRIMARY KEY`, and drops the old `id TEXT` column — **back up your database before upgrading**
3. Existing profile data for authenticated users is preserved as long as their `user_id` FK reference is intact

## [0.4.3] - 2026-02-12

### Added

- Debt balance adjustments (interest/fees/charges/credits) with dedicated audit records
- Debts UI action to record balance adjustments without affecting buckets

### Changed

- Credit card balances can exceed original amounts (mortgage rule unchanged)

### Migration Notes

1. New table `debt_balance_adjustments` is created automatically on startup

## [0.4.2] - 2026-02-11

### Fixed

- Fortnight boundaries now honor user-local dates when listing transactions and dashboard data, preventing "first morning" transactions from disappearing in UTC+ timezones

### Changed

- Fortnight creation now persists local dates + timezone and derives UTC bounds consistently across APIs
- Added a backfill migration to populate timezone-aware fortnight bounds for existing data

### Migration Notes

1. Run migration: `psql < backend/migrations/003-backfill-fortnight-timezone-bounds.sql`
2. Alternatively: `pnpm --filter backend db:backfill-fortnight-bounds`
3. Restart backend (migrations run automatically on startup)

## [0.4.1] - 2026-02-02

### Changed

- Repository cleanup (docs + metadata)

## [0.4.0] - 2026-02-02

### Added

- Transaction import (CSV/QIF)
  - CSV/QIF preview + commit flow with optional duplicate skipping
  - Importer registry + base importer patterns (OCP-friendly extension point)
  - Frontend import wizard with presets, mapping, preview, and selective row import

### Changed

- Monorepo linting consolidated into root ESLint config
- Frontend tests allow empty suites (`vitest --passWithNoTests`)

### Fixed

- Theme toggle could trigger "Maximum update depth exceeded" in some flows
- URL hash navigation sync moved into an effect to satisfy linting and avoid side effects in handlers

## [0.3.1] - 2026-01-18

### Fixed

- Frontend API client now uses relative API paths for Docker deployments

## [0.3.0] - 2026-01-18

### ⚠️ BREAKING CHANGES

**Database Migration Required**: If upgrading from v0.2.x, you MUST run the migration script.

- Transfer feature: Transactions now support moving money between buckets
- Database schema: Added `source_bucket` and `destination_bucket` columns to transactions table
- API changes: `bucket` field replaced with `sourceBucket`/`destinationBucket` (backward compatible fallback removed)

### Added

- 🎉 **Transfer Between Buckets** - Move money between your Barefoot buckets
  - Transfer from any bucket to any other bucket (e.g., Smile → Daily Expenses)
  - Proper bucket balance calculations (source decreases, destination increases)
  - Transfer transactions appear in both source and destination bucket views
  - Frontend UI with dedicated transfer form and validation

### Changed

- Transaction API now uses `sourceBucket` and `destinationBucket` fields consistently
- Bucket spending calculations account for transfers (in/out)
- Transaction filtering matches both source and destination buckets

### Fixed

- Bucket balances now update correctly for transfer transactions
- All legacy `tx.bucket` references replaced with proper source/destination logic

### Migration Guide for Existing Users

**IMPORTANT**: Back up your database before upgrading!

```bash
# 1. Backup database
pg_dump -U budgetwise budgetwise > backup_before_0.3.0.sql

# 2. Pull latest code
git pull origin main

# 3. Restart services (migrations run automatically)
docker compose down
docker compose up -d

# OR for manual setup:
cd backend
pnpm install
pnpm dev  # Migrations run on startup
```

## [0.2.0] - 2026-01-15

### Added

- **User timezone support**: Users can now set their local timezone in Profile settings
- **Timezone-aware fortnight boundaries**: Transactions are now matched to fortnights using the user's local calendar, not UTC
- New `TimezoneService` domain service for consistent timezone conversions across the application
- Timezone picker in Profile view with common IANA timezones (Australia/Melbourne, Europe/Copenhagen, UTC, etc.)
- Database schema additions: `timezone` column in `budget_profiles`, UTC boundary columns in `fortnight_snapshots`
- Backfill script for migrating existing data to new timezone-aware schema

### Changed

- **Half-open interval semantics**: Fortnight date ranges now use `[start, end)` (exclusive end) instead of `[start, end]` (inclusive end) to eliminate fencepost errors
- Updated `GetFortnightUseCase` to compute UTC boundaries from user's local timezone
- Updated `PostgresTransactionRepository.findByDateRange()` to use `< endDate` instead of `<= endDate`
- Profile API now accepts and returns `timezone` field (defaults to 'UTC' for backward compatibility)

### Fixed

- **Critical timezone bug**: Transactions recorded before UTC midnight but on the correct local calendar day are now correctly included in the fortnight
- **Example**: Users in Australia/Melbourne (UTC+11) recording transactions at 9:00 AM local time (22:00 UTC previous day) no longer need to fabricate later times to ensure inclusion
- Fencepost errors at 23:59:59.999 boundaries eliminated with half-open intervals

### Technical Details

- **Dependencies**: Added `date-fns-tz@3.2.0` for DST-aware timezone conversions
- **Backward compatibility**: All changes are non-breaking; existing users default to 'UTC' timezone
- **Migration**: Idempotent backfill script populates new columns for existing fortnights
- **Testing**: 87 tests passing (20 new timezone service tests covering DST, edge cases, multiple timezones)
- **Documentation**: Updated ARCHITECTURE.md with timezone model explanation

### Migration Notes

1. Run migration: `psql < backend/migrations/001-add-timezone-support.sql`
2. Run backfill: `pnpm tsx backend/scripts/backfill-timezone-boundaries.ts`
3. Users can now set their timezone in Profile view (optional; defaults to UTC)

### Attribution

See [docs/plan-timezoneFix.prompt.md](docs/plan-timezoneFix.prompt.md) for full implementation details.

---

## [0.1.0] - 2026-01-10

### Added

- Initial release of Bucketwise Planner
- Fortnightly bucket-based budgeting (60/10/10/20 allocation: Daily Expenses, Splurge, Smile, Fire Extinguisher)
- Debt snowball prioritization and payoff timeline
- Transaction tracking (income, expenses, debt payments) with bucket assignments
- Multi-user authentication (JWT-based signup/login)
- Optional AI financial advisor powered by Google Gemini 2.5 Flash
- Docker Compose deployment with PostgreSQL backend
- React + Mantine UI with dark theme and responsive design
- Global help system with searchable content and keyboard shortcuts
- Barefoot Investor methodology implementation (credit: Scott Pape)
- Domain-Driven Design backend with clean separation of concerns
- Comprehensive test suite (54+ passing tests)
- Full documentation (self-hosting, architecture, FAQ, contributing guide)

### Implementation Details

- **Backend:** Node.js + Express v5 + TypeScript (ESM), PostgreSQL via node-postgres
- **Frontend:** React 18 + Vite 7 + Mantine v8.3.10 + Tabler Icons
- **Validation:** Zod schemas for all API inputs
- **Date handling:** Timezone-safe normalization using formatDateToISO() utility
- **Error handling:** Domain errors mapped to HTTP responses via middleware
- **Testing:** Vitest with unit and integration tests

### Features

- ✅ Fortnightly budgeting aligned with income cycles
- ✅ Bucket allocations with real-time tracking (spent vs remaining)
- ✅ Transaction recording with description, amount, bucket, and date
- ✅ Debt management with priority-based snowball method
- ✅ Automated payoff timeline calculations (fortnightly cadence)
- ✅ Dashboard with quick overview (current fortnight, debt summary, payoff timeline)
- ✅ Profile configuration (income, bucket percentages, fixed expenses)
- ✅ Optional AI advisor for personalized financial guidance
- ✅ Dark theme with navy/slate + teal/amber accents
- ✅ Tooltips on complex controls
- ✅ Loading/error/empty state patterns
- ✅ Keyboard shortcuts (⌘/ for help)

### Known Limitations

- Single self-hosted instance per deployment (not SaaS)
- AI advisor requires Google API key (optional, disabled by default)
- No built-in user password recovery (self-hosted responsibility)
- No mobile app (web responsive design available)

### Attribution

Implements the Barefoot Investor methodology by **Scott Pape**.
Learn more: https://www.barefootinvestor.com/

---

[0.4.4]: https://github.com/solid-logic-studios/bucketwise-planner/releases/tag/v0.4.4
[0.4.3]: https://github.com/solid-logic-studios/bucketwise-planner/releases/tag/v0.4.3
[0.4.2]: https://github.com/solid-logic-studios/bucketwise-planner/releases/tag/v0.4.2
[0.4.1]: https://github.com/solid-logic-studios/bucketwise-planner/releases/tag/v0.4.1
[0.4.0]: https://github.com/solid-logic-studios/bucketwise-planner/releases/tag/v0.4.0
[0.3.1]: https://github.com/solid-logic-studios/bucketwise-planner/releases/tag/v0.3.1
[0.3.0]: https://github.com/solid-logic-studios/bucketwise-planner/releases/tag/v0.3.0
[0.2.0]: https://github.com/solid-logic-studios/bucketwise-planner/releases/tag/v0.2.0
[0.1.0]: https://github.com/solid-logic-studios/bucketwise-planner/releases/tag/v0.1.0
