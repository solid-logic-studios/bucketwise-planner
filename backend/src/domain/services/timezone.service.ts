import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * UtcBounds: Half-open interval representing UTC date range boundaries.
 * Used by TimezoneService to represent timezone-aware date conversions.
 * 
 * @property startUtc - Inclusive start boundary (>=)
 * @property endUtcExclusive - Exclusive end boundary (<)
 * 
 * @example
 * {
 *   startUtc: 2026-01-13T13:00:00.000Z,
 *   endUtcExclusive: 2026-01-14T13:00:00.000Z
 * }
 */
export interface UtcBounds {
  startUtc: Date;
  endUtcExclusive: Date;
}

/**
 * TimezoneService: Convert between UTC and user-local calendar dates.
 * 
 * Purpose: Ensures fortnight boundaries and date ranges are evaluated in the user's 
 * local timezone, preventing transactions from being excluded due to UTC vs local 
 * calendar day mismatches.
 * 
 * Design Principles:
 * - SOLID: Single Responsibility — timezone logic is isolated.
 * - DRY: One place to maintain timezone conversions.
 * - YAGNI: Only methods we need (local date range → UTC bounds).
 * - KISS: Pure static methods, no state, fully testable.
 * 
 * DST Handling: date-fns-tz automatically handles Daylight Saving Time transitions.
 * No special application logic needed for DST edge cases.
 * 
 * Half-Open Interval Convention:
 * All methods return [startUtc, endUtcExclusive) where:
 * - startUtc is inclusive (>=)
 * - endUtcExclusive is exclusive (<)
 * This eliminates fencepost errors at date boundaries.
 */
export class TimezoneService {
  /**
   * Convert a local calendar day (YYYY-MM-DD in user's timezone) to UTC boundaries.
   * Returns half-open interval: [startUtc, endUtcExclusive)
   * 
   * Example:
   * - Input: '2026-01-14', 'Australia/Melbourne' (AEDT = UTC+11)
   * - Output: { 
   *     startUtc: 2026-01-13T13:00:00.000Z (2026-01-14 00:00 AEDT),
   *     endUtcExclusive: 2026-01-14T13:00:00.000Z (2026-01-15 00:00 AEDT)
   *   }
   * 
   * @param localDate YYYY-MM-DD (e.g., '2026-01-14')
   * @param timezone IANA timezone (e.g., 'Australia/Melbourne', 'Europe/Copenhagen', 'UTC')
   * @returns UtcBounds Half-open interval in UTC
   */
  static getLocalDayBoundsUtc(
    localDate: string,
    timezone: string
  ): UtcBounds {
    // Parse local date as local midnight (start of day)
    const localStart = new Date(`${localDate}T00:00:00`);
    
    // Convert local midnight to UTC
    const startUtc = fromZonedTime(localStart, timezone);

    // End is the next day at midnight (exclusive boundary)
    const nextDay = new Date(localStart);
    nextDay.setDate(nextDay.getDate() + 1);
    const endUtcExclusive = fromZonedTime(nextDay, timezone);

    return { startUtc, endUtcExclusive };
  }

  /**
   * Get UTC boundaries for a fortnight (inclusive start, exclusive end) in user's timezone.
   * 
   * A fortnight spans from startDate (00:00 local) to endDate (23:59:59.999 local).
   * The returned endUtcExclusive represents the next day at 00:00 (exclusive boundary).
   * 
   * Example:
   * - Input: '2026-01-14', '2026-01-27', 'Australia/Melbourne'
   * - Output: {
   *     startUtc: 2026-01-13T13:00:00.000Z (2026-01-14 00:00 AEDT),
   *     endUtcExclusive: 2026-01-27T13:00:00.000Z (2026-01-28 00:00 AEDT)
   *   }
   * - Transactions filtered as: occurredAt >= startUtc && occurredAt < endUtcExclusive
   * 
   * @param startDate YYYY-MM-DD local start date (e.g., '2026-01-14')
   * @param endDate YYYY-MM-DD local end date (e.g., '2026-01-27')
   * @param timezone IANA timezone (e.g., 'Australia/Melbourne')
   * @returns UtcBounds Half-open interval in UTC
   */
  static getFortnightBoundsUtc(
    startDate: string,
    endDate: string,
    timezone: string
  ): UtcBounds {
    // Get start boundary (midnight on startDate in user's timezone)
    const { startUtc } = this.getLocalDayBoundsUtc(startDate, timezone);

    // Get end boundary (midnight on day after endDate in user's timezone)
    const endDateObj = new Date(endDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const nextDayStr = endDateObj.toISOString().split('T')[0]!; // Always has date part
    const { startUtc: endUtcExclusive } = this.getLocalDayBoundsUtc(nextDayStr, timezone);

    return { startUtc, endUtcExclusive };
  }

  /**
   * Convert a UTC Date to a local calendar date string (YYYY-MM-DD) in user's timezone.
   * 
   * Useful for displaying dates in the user's local context.
   * 
   * @param utcDate UTC Date object
   * @param timezone IANA timezone (e.g., 'Australia/Melbourne')
   * @returns YYYY-MM-DD string in user's local timezone
   */
  static toLocalDateString(utcDate: Date, timezone: string): string {
    const zonedDate = toZonedTime(utcDate, timezone);
    const year = zonedDate.getFullYear();
    const month = String(zonedDate.getMonth() + 1).padStart(2, '0');
    const day = String(zonedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
