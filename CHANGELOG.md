# Changelog

All notable changes to Bucketwise Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.0]: https://github.com/PaulAtkins88/bucketwise-planner/releases/tag/v0.2.0
[0.1.0]: https://github.com/PaulAtkins88/bucketwise-planner/releases/tag/v0.1.0
