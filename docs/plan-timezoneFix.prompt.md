# Timezone Fix & Release Plan v0.2.0

**Date Created:** 2026-01-14  
**Scope:** Multi-user timezone support with half-open intervals for fortnight boundaries.  
**Breaking Changes:** None (fully backward compatible).  
**Version Bump:** 0.1.0 → 0.2.0 (new feature, no breaking changes).

## 1. Versioning Strategy

### Semantic Versioning (0.x.0 pre-1.0 stabilization)
- **Current:** v0.1.0 (initial release, multi-user auth + debt snowball)
- **This release:** v0.2.0 (timezone support + boundary safety)
- **Rationale:** New feature (timezone), backward compatible (old data works as-is), pre-1.0 so minor version bump is expected.

### Release Timeline
- **v0.2.0-alpha.1:** Internal testing with this change.
- **v0.2.0-rc.1:** Test with deployed instance (after migration validation).
- **v0.2.0:** Public release (changelog + docs updated).

### Changelog Entry (for CHANGELOG.md)
```
## [0.2.0] - 2026-02-15

### Added
- **Timezone support:** Users can now set their timezone in Profile; fortnights are evaluated in local calendar days, not UTC.
- **Date boundary safety:** Fortnight filtering now uses half-open intervals (inclusive start, exclusive end) to eliminate fencepost errors.
- **`date-fns-tz` integration:** Server-side timezone-aware date range conversions (via new `TimezoneService`).

### Changed
- **Fortnight filtering:** Now respects user's timezone when determining which transactions belong to a fortnight. Existing data is preserved and re-evaluated under default user timezone (UTC, or migrated to user's preferred TZ).
- **Database schema:** New columns on `fortnight_snapshots` and `budget_profiles` (see "Schema Changes" below); old columns remain for backward compatibility.

### Migration
- **Zero downtime:** New columns are optional; existing queries work unchanged.
- **Backfill script:** Run after deploy to populate new timezone columns and compute UTC exclusive ends.
- **User action:** Optional. Users without explicit timezone default to UTC (existing behavior preserved).

### Fixed
- Transactions recorded just before midnight are no longer excluded from their intended fortnight.
- End-of-fortnight inclusion bug: transactions on the last day (up to 23:59:59 local) are now correctly included.
```

## 2. Schema Changes (Non-Breaking)

### Phase A: Add Timezone & UTC Boundary Columns (1 migration)

**Migration:** `add-timezone-support-to-profiles-and-fortnights.sql`

```sql
-- Add timezone to budget_profiles (default UTC for backward compat)
ALTER TABLE budget_profiles
ADD COLUMN timezone TEXT DEFAULT 'UTC' NOT NULL;

-- Add indexes for quick lookup
CREATE INDEX idx_budget_profiles_timezone ON budget_profiles(user_id, timezone);

-- Add explicit UTC boundaries to fortnight_snapshots (non-nullable for new rows, nullable for old)
ALTER TABLE fortnight_snapshots
ADD COLUMN period_start_utc TIMESTAMP WITH TIME ZONE,
ADD COLUMN period_end_utc_exclusive TIMESTAMP WITH TIME ZONE,
ADD COLUMN period_start_local_date DATE,
ADD COLUMN period_end_local_date DATE,
ADD COLUMN timezone_at_creation TEXT;

-- For new snapshots, these will be populated; for old ones, backfill will compute them.
-- After backfill, we can make them NOT NULL.

-- Add triggers to auto-update created_at / updated_at if needed (optional, for hygiene)
```

Also make sure to update the `backend/src/infrastructure/database/pg.ts` ensureSchema function to include these new columns for future deployments.

### Phase B: Backfill Script (run post-deploy)

**File:** `backend/scripts/backfill-timezone-boundaries.ts`

Logic:
1. Fetch all `fortnight_snapshots` where `period_start_utc` is NULL.
2. For each, fetch the associated user's timezone (or default to 'UTC').
3. Recompute `period_start_utc`, `period_end_utc_exclusive` using the old `period_start`/`period_end` as local calendar days in that timezone.
4. Extract `period_start_local_date`, `period_end_local_date` from the old values.
5. Update the snapshot with new columns.

This preserves all existing fortnights; they are now re-interpreted with explicit timezone context.

### Versioning within Schema
- Old code: ignores new columns, works as before.
- New code (v0.2.0): prefers new columns, falls back to old ones + user timezone if new ones are NULL (during transition).
- No downtime, no schema lock.

---

## 3. Code Design (SOLID + DRY + YAGNI + KISS)

### A. TimezoneService (Single Responsibility + DRY)

**File:** `backend/src/domain/services/timezone.service.ts`

```typescript
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * TimezoneService: Convert between UTC and user-local calendar dates.
 * SOLID: Single Responsibility — timezone logic is isolated.
 * DRY: One place to maintain timezone conversions.
 * YAGNI: Only methods we need (local date range → UTC bounds).
 */
export class TimezoneService {
  /**
   * Convert a local calendar day (YYYY-MM-DD in user's timezone) to UTC boundaries.
   * Returns half-open interval: [startUtc, endUtcExclusive)
   * 
   * @param localDate YYYY-MM-DD (e.g., '2026-01-14')
   * @param timezone IANA timezone (e.g., 'Australia/Melbourne')
   * @returns { startUtc: Date, endUtcExclusive: Date }
   */
  static getLocalDayBoundsUtc(localDate: string, timezone: string): { startUtc: Date; endUtcExclusive: Date } {
    // Parse local date as local midnight
    const localStart = new Date(`${localDate}T00:00:00`);
    const localEnd = new Date(`${localDate}T23:59:59.999`);

    // Convert to UTC
    const startUtc = fromZonedTime(localStart, timezone);
    const endUtcExclusive = fromZonedTime(new Date(`${localDate}T23:59:59.999`), timezone);
    
    // Move end to next day at 00:00 UTC (half-open convention)
    endUtcExclusive.setUTCDate(endUtcExclusive.getUTCDate() + 1);
    endUtcExclusive.setUTCHours(0, 0, 0, 0);

    return { startUtc, endUtcExclusive };
  }

  /**
   * Get UTC boundaries for a fortnight (inclusive start, exclusive end) in user's timezone.
   */
  static getFortnightBoundsUtc(startDate: string, endDate: string, timezone: string): { startUtc: Date; endUtcExclusive: Date } {
    const { startUtc } = this.getLocalDayBoundsUtc(startDate, timezone);
    // End date's exclusive boundary is the next day at 00:00 UTC
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const endDateStr = nextDay.toISOString().split('T')[0];
    const { startUtc: endUtcExclusive } = this.getLocalDayBoundsUtc(endDateStr, timezone);

    return { startUtc, endUtcExclusive };
  }
}
```

**Design Rationale:**
- Pure, testable static methods (no state).
- Domain service (not infrastructure) so it's reusable.
- KISS: only two methods, one concern.
- YAGNI: no reverse conversions, DST handling (date-fns-tz handles that), or caching.

### B. Repository Update (Open/Closed Principle)

**File:** `backend/src/infrastructure/persistence/postgres/postgres-transaction.repository.ts`

Change:
```typescript
async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
  // Half-open: startDate inclusive, endDate exclusive
  const result = await this.pool.query(
    'SELECT * FROM transactions WHERE user_id = $1 AND occurred_at >= $2 AND occurred_at < $3 ORDER BY occurred_at DESC',
    [userId, startDate, endDate] // endDate is now exclusive boundary
  );
  return result.rows.map(mapRowToTransaction);
}
```

**Design Rationale:**
- Method signature unchanged (backward compatible).
- Caller must now pass `endExclusive` instead of `endInclusive`.
- Use cases responsible for computing and passing correct bounds (Dependency Inversion).

### C. Use Case Updates (Dependency Inversion)

**File:** `backend/src/application/use-cases/get-fortnight.use-case.ts`

```typescript
import { TimezoneService } from '../../domain/services/timezone.service.js';

export class GetFortnightUseCase extends UseCase<GetFortnightRequest, FortnightDetailDTO> {
  constructor(
    private fortnightSnapshotRepository: FortnightSnapshotRepository,
    private transactionRepository: TransactionRepository,
    private profileRepository: ProfileRepository, // new dependency for timezone
  ) {
    super();
  }

  async execute(request: GetFortnightRequest): Promise<FortnightDetailDTO> {
    const snapshot = await this.fortnightSnapshotRepository.findById(request.userId, request.fortnightId);
    if (!snapshot) throw new ValidationError(`Fortnight ${request.fortnightId} not found`);

    // Get user's timezone; fall back to 'UTC' if not set
    const profile = await this.profileRepository.findByUserId(request.userId);
    const timezone = profile?.timezone ?? 'UTC';

    // Compute UTC bounds using TimezoneService
    const localStart = snapshot.periodStart.toISOString().split('T')[0]; // YYYY-MM-DD
    const localEnd = snapshot.periodEnd.toISOString().split('T')[0];
    const { startUtc, endUtcExclusive } = TimezoneService.getFortnightBoundsUtc(localStart, localEnd, timezone);

    // Query transactions with half-open bounds
    const allTransactions = await this.transactionRepository.getAll(request.userId);
    const periodTransactions = allTransactions.filter(tx => {
      const txDate = tx.occurredAt;
      return txDate >= startUtc && txDate < endUtcExclusive; // half-open
    });

    // Rest of logic unchanged...
  }
}
```

**Design Rationale:**
- Use case knows *how* to compute bounds (via service), not the gory timezone details.
- Profile dependency is injected (Dependency Inversion).
- KISS: logic flow is clear.

### D. Controller (Orchestration Point)

**File:** `backend/src/presentation/http/controllers/fortnight.controller.ts`

```typescript
async listTransactions(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;
  const bucket = req.query.bucket as string | undefined;
  const fortnightId = req.query.fortnightId as string | undefined;
  const startDateStr = req.query.startDate as string | undefined;
  const endDateStr = req.query.endDate as string | undefined;
  // ... pagination params ...

  // If date range is provided, apply timezone conversion
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (startDateStr && endDateStr) {
    const profile = await this.profileRepository.findByUserId(userId);
    const timezone = profile?.timezone ?? 'UTC';

    const { startUtc, endUtcExclusive } = TimezoneService.getFortnightBoundsUtc(startDateStr, endDateStr, timezone);
    startDate = startUtc;
    endDate = endUtcExclusive; // Pass exclusive end to use case
  }

  const result = await this.listTransactionsUseCase.execute({
    userId,
    ...(bucket && { bucket }),
    ...(fortnightId && { fortnightId }),
    ...(startDate && endDate && { startDate, endDate }),
    // ... pagination ...
  });

  this.sendSuccess(res, result);
}
```

**Design Rationale:**
- Controller is thin orchestration layer.
- Timezone conversion happens here (edge of HTTP layer, before domain).
- Use case doesn't know or care about timezones; it gets UTC bounds.
- SOLID: Dependency Inversion (controller fetches profile, not use case).

---

## 4. Implementation Phases

### Phase 1: Foundations (v0.2.0-alpha.1)
**Goal:** Half-open intervals + timezone service in place, backward compatible.

**Tasks:**
1. Add `date-fns-tz` to `backend/package.json`.
2. Create `TimezoneService` (domain/services).
3. Update `PostgresTransactionRepository.findByDateRange()` to use `<` instead of `<=`.
4. Update `GetFortnightUseCase` to compute UTC bounds via `TimezoneService`.
5. Unit tests for `TimezoneService` (test DST edge cases, different timezones).
6. Run existing tests; should pass (query semantics are now correct).

**Duration:** ~2–3 hours.  
**Risk:** Low. No schema changes, logic is isolated, old code path unchanged if timezone isn't involved yet.

### Phase 2: Profile & Schema (v0.2.0-rc.1)
**Goal:** User timezone persisted; schema migration ready.

**Tasks:**
1. Run migration: add `timezone` column to `budget_profiles`, add UTC boundary columns to `fortnight_snapshots`.
2. Create backfill script: `backend/scripts/backfill-timezone-boundaries.ts`.
3. Test backfill on a copy of prod data locally.
4. Update `ProfileRepository` to include timezone.
5. Add GET/PUT `/profile/timezone` endpoints (optional: part of existing profile endpoint).
6. Update Profile DTO to include timezone.
7. Integration tests: ensure backfilled data matches old snapshot semantics.

**Duration:** ~3–4 hours.  
**Risk:** Low. Backfill is tested, migration is reversible, code still works if new columns are NULL.

### Phase 3: Controller & Frontend (v0.2.0)
**Goal:** Controllers apply timezone conversion; frontend profile UI.

**Tasks:**
1. Update `FortnightController.listTransactions()` to fetch user timezone and pass UTC bounds to use case.
2. Update other controllers that filter by date range (similar pattern).
3. Frontend: add timezone picker in Profile view (Mantine Select with common IANA zones).
4. Frontend: POST/PUT timezone to API when user changes it.
5. E2E test: create fortnight, record transaction at local midnight, verify inclusion.
6. E2E test: change timezone, verify transactions re-sort into different fortnights.

**Duration:** ~3–4 hours.  
**Risk:** Medium. User-facing changes, but fully backward compatible (old users default to UTC, no action required).

### Phase 4: Polish & Docs (v0.2.0 release)
**Goal:** Docs, changelog, safety nets.

**Tasks:**
1. Update docs/ARCHITECTURE.md to explain timezone model.
2. Update backend/README.md with timezone-aware date handling notes.
3. Update CHANGELOG.md with v0.2.0 entry.
4. Add comment in `TimezoneService` linking to this plan and DST considerations.
5. Rollback script (optional): if severe bugs, restore old behavior by ignoring new columns.

**Duration:** ~1–2 hours.

---

## 5. Testing Strategy

### Unit Tests
- `TimezoneService.test.ts`: test DST transitions (Mar/Oct in Australia), boundary dates (Dec 31 → Jan 1), Denmark vs Ballarat.
- `PostgresTransactionRepository.test.ts`: verify half-open interval semantics (end date excluded).

### Integration Tests
- Create fortnight on 2026-01-14, record transaction at 2026-01-14T09:00 AEDT (before noon UTC).
- Assert transaction appears in fortnight (should pass with Phase 1 fix).
- Create fortnight, change user timezone to 'Europe/Copenhagen', assert same transaction may shift fortnights.

### E2E Tests
- Add to `backend/tests/integration/fortnight-timezone.integration.test.ts`.
- Create fortnight spanning Jan 14–27.
- Record transactions at start/end boundaries (local midnight, 23:59:59).
- Assert all are included.
- Change timezone; re-fetch; verify inclusion.

---

## 6. SOLID/DRY/YAGNI/KISS Checklist

| Principle | Application |
|-----------|-------------|
| **Single Responsibility** | `TimezoneService` handles timezone logic only; controller handles HTTP; use case handles business. |
| **Open/Closed** | Repositories accept pre-computed bounds; implementation doesn't change behavior. |
| **Liskov Substitution** | All repositories implement the same interface; half-open semantics are consistent. |
| **Interface Segregation** | `ProfileRepository` only needs timezone; `TimezoneService` doesn't depend on repository. |
| **Dependency Inversion** | Controllers depend on abstractions (repository interfaces, service contracts), not implementations. |
| **DRY** | Timezone conversion logic in one place (`TimezoneService`); reused by all controllers. |
| **YAGNI** | Only implement timezone picker, timezone storage, and UTC conversion. No reverse-tz, no caching, no UI for DST rules. |
| **KISS** | Half-open intervals are simple, standard practice. UTC storage is simple. Timezone service has two static methods. |

---

## 7. Rollback Strategy

If critical bugs found before v0.2.0 release:

1. **Phase 1 issue:** Revert `GetFortnightUseCase` to old `<=` logic. Old transactions re-include. No data loss.
2. **Phase 2 issue:** Backfill is idempotent; re-run with corrected logic. Old columns never deleted.
3. **Phase 3 issue:** Frontend gracefully falls back to 'UTC' if timezone missing. Controller defaults to 'UTC'. No breakage.

Roll forward by fixing root cause and re-deploying; no data migration needed.

---

## 8. Documentation Updates

### For ARCHITECTURE.md (new section)
```
### Timezone Model (v0.2.0+)

Fortnights are evaluated in the user's local calendar, not UTC. This ensures transactions
recorded around midnight are assigned to the intended fortnight regardless of the user's timezone.

**Design:**
- All event timestamps are stored in UTC.
- User timezone (IANA, e.g., Australia/Melbourne) is stored in their profile.
- Fortnight boundaries are interpreted as local calendar days:
  - Start: user's local midnight (converted to UTC).
  - End: user's local 23:59:59.999 (converted to UTC), stored as exclusive boundary for next day 00:00 UTC.
- Server-side conversion: `TimezoneService.getFortnightBoundsUtc()` computes UTC bounds from local dates and user timezone.
- Frontend coordination: Frontend may send date-only or explicit instants; server converts as needed.

**Example:**
- User in Australia/Melbourne records transaction at 2026-01-14 09:00 AEDT (2026-01-13 22:00 UTC).
- Fortnight is defined as local 2026-01-14 to 2026-01-27.
- TimezoneService computes: startUtc = 2026-01-13 13:00 UTC, endUtcExclusive = 2026-01-28 13:00 UTC.
- Transaction at 22:00 UTC on Jan 13 is < 2026-01-28 13:00 UTC, so it's included. ✓

**DST Note:**
- `date-fns-tz` handles DST transitions correctly. No special handling needed in application code.
```

---

## 9. Summary

| Aspect | Details |
|--------|---------|
| **Version** | 0.1.0 → 0.2.0 (feature, no breaking changes) |
| **Duration** | ~2 weeks (4 phases, 1–2 sprints) |
| **Risk** | Low to medium (well-isolated, backward compatible, tested) |
| **Breaking Changes** | None. Old data works as-is; new timezone column optional. |
| **Key File Changes** | `TimezoneService` (new), `PostgresTransactionRepository`, `GetFortnightUseCase`, `FortnightController`, `ProfileRepository`, 1 migration |
| **Dependencies** | Add `date-fns-tz` v2.x (lightweight, no extra deps) |
| **User Action** | Optional. Default to UTC; users can set timezone in Profile when ready. |
