import { describe, expect, it } from 'vitest';
import { TimezoneService } from '../../../src/domain/services/timezone.service.js';

describe('TimezoneService', () => {
  describe('getLocalDayBoundsUtc', () => {
    it('should convert local midnight to UTC for Australia/Melbourne (AEDT UTC+11)', () => {
      // 2026-01-14 is in Australian summer (AEDT = UTC+11)
      const { startUtc, endUtcExclusive } = TimezoneService.getLocalDayBoundsUtc(
        '2026-01-14',
        'Australia/Melbourne'
      );

      // 2026-01-14 00:00 AEDT = 2026-01-13 13:00 UTC
      expect(startUtc.toISOString()).toBe('2026-01-13T13:00:00.000Z');
      // 2026-01-15 00:00 AEDT = 2026-01-14 13:00 UTC
      expect(endUtcExclusive.toISOString()).toBe('2026-01-14T13:00:00.000Z');
    });

    it('should handle UTC timezone (no offset)', () => {
      const { startUtc, endUtcExclusive } = TimezoneService.getLocalDayBoundsUtc(
        '2026-01-14',
        'UTC'
      );

      expect(startUtc.toISOString()).toBe('2026-01-14T00:00:00.000Z');
      expect(endUtcExclusive.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    });

    it('should convert local midnight to UTC for Europe/Copenhagen (CET UTC+1)', () => {
      // 2026-01-14 is in European winter (CET = UTC+1)
      const { startUtc, endUtcExclusive } = TimezoneService.getLocalDayBoundsUtc(
        '2026-01-14',
        'Europe/Copenhagen'
      );

      // 2026-01-14 00:00 CET = 2026-01-13 23:00 UTC
      expect(startUtc.toISOString()).toBe('2026-01-13T23:00:00.000Z');
      // 2026-01-15 00:00 CET = 2026-01-14 23:00 UTC
      expect(endUtcExclusive.toISOString()).toBe('2026-01-14T23:00:00.000Z');
    });

    it('should handle DST transition in Australia (AEDT→AEST, Apr 2026)', () => {
      // DST ends on 2026-04-05 03:00 AEDT → 02:00 AEST
      // Day before DST transition: 2026-04-04
      const beforeDst = TimezoneService.getLocalDayBoundsUtc(
        '2026-04-04',
        'Australia/Melbourne'
      );
      // 2026-04-04 00:00 AEDT (UTC+11) = 2026-04-03 13:00 UTC
      expect(beforeDst.startUtc.toISOString()).toBe('2026-04-03T13:00:00.000Z');
      // 2026-04-05 00:00 AEDT (still DST, transitions at 03:00) = 2026-04-04 13:00 UTC
      // DST hasn't ended yet at midnight on April 5
      expect(beforeDst.endUtcExclusive.toISOString()).toBe('2026-04-04T13:00:00.000Z');
    });

    it('should handle DST transition in Europe (CET→CEST, Mar 2026)', () => {
      // DST starts on 2026-03-29 02:00 CET → 03:00 CEST
      // Day before DST transition: 2026-03-28
      const beforeDst = TimezoneService.getLocalDayBoundsUtc(
        '2026-03-28',
        'Europe/Copenhagen'
      );
      // 2026-03-28 00:00 CET (UTC+1) = 2026-03-27 23:00 UTC
      expect(beforeDst.startUtc.toISOString()).toBe('2026-03-27T23:00:00.000Z');
      // 2026-03-29 00:00 CET (DST hasn't started yet at midnight) = 2026-03-28 23:00 UTC
      // DST starts at 02:00, not at midnight
      expect(beforeDst.endUtcExclusive.toISOString()).toBe('2026-03-28T23:00:00.000Z');
    });

    it('should handle year boundary (Dec 31 → Jan 1)', () => {
      const { startUtc, endUtcExclusive } = TimezoneService.getLocalDayBoundsUtc(
        '2025-12-31',
        'Australia/Melbourne'
      );

      // 2025-12-31 00:00 AEDT = 2025-12-30 13:00 UTC
      expect(startUtc.toISOString()).toBe('2025-12-30T13:00:00.000Z');
      // 2026-01-01 00:00 AEDT = 2025-12-31 13:00 UTC
      expect(endUtcExclusive.toISOString()).toBe('2025-12-31T13:00:00.000Z');
    });

    it('should handle negative UTC offset (America/New_York EST UTC-5)', () => {
      // 2026-01-14 is in Eastern winter (EST = UTC-5)
      const { startUtc, endUtcExclusive } = TimezoneService.getLocalDayBoundsUtc(
        '2026-01-14',
        'America/New_York'
      );

      // 2026-01-14 00:00 EST = 2026-01-14 05:00 UTC
      expect(startUtc.toISOString()).toBe('2026-01-14T05:00:00.000Z');
      // 2026-01-15 00:00 EST = 2026-01-15 05:00 UTC
      expect(endUtcExclusive.toISOString()).toBe('2026-01-15T05:00:00.000Z');
    });
  });

  describe('getFortnightBoundsUtc', () => {
    it('should compute fortnight bounds for Australia/Melbourne', () => {
      const { startUtc, endUtcExclusive } = TimezoneService.getFortnightBoundsUtc(
        '2026-01-14',
        '2026-01-27',
        'Australia/Melbourne'
      );

      // Start: 2026-01-14 00:00 AEDT = 2026-01-13 13:00 UTC
      expect(startUtc.toISOString()).toBe('2026-01-13T13:00:00.000Z');
      // End: 2026-01-28 00:00 AEDT = 2026-01-27 13:00 UTC (exclusive)
      expect(endUtcExclusive.toISOString()).toBe('2026-01-27T13:00:00.000Z');
    });

    it('should compute fortnight bounds for UTC', () => {
      const { startUtc, endUtcExclusive } = TimezoneService.getFortnightBoundsUtc(
        '2026-01-14',
        '2026-01-27',
        'UTC'
      );

      expect(startUtc.toISOString()).toBe('2026-01-14T00:00:00.000Z');
      expect(endUtcExclusive.toISOString()).toBe('2026-01-28T00:00:00.000Z');
    });

    it('should compute fortnight bounds for Europe/Copenhagen', () => {
      const { startUtc, endUtcExclusive } = TimezoneService.getFortnightBoundsUtc(
        '2026-01-14',
        '2026-01-27',
        'Europe/Copenhagen'
      );

      // Start: 2026-01-14 00:00 CET = 2026-01-13 23:00 UTC
      expect(startUtc.toISOString()).toBe('2026-01-13T23:00:00.000Z');
      // End: 2026-01-28 00:00 CET = 2026-01-27 23:00 UTC (exclusive)
      expect(endUtcExclusive.toISOString()).toBe('2026-01-27T23:00:00.000Z');
    });

    it('should handle fortnight spanning DST transition in Australia', () => {
      // Fortnight from 2026-03-28 to 2026-04-10 (spans DST end on Apr 5)
      const { startUtc, endUtcExclusive } = TimezoneService.getFortnightBoundsUtc(
        '2026-03-28',
        '2026-04-10',
        'Australia/Melbourne'
      );

      // Start: 2026-03-28 00:00 AEDT = 2026-03-27 13:00 UTC
      expect(startUtc.toISOString()).toBe('2026-03-27T13:00:00.000Z');
      // End: 2026-04-11 00:00 AEST = 2026-04-10 14:00 UTC (after DST ends, UTC+10)
      expect(endUtcExclusive.toISOString()).toBe('2026-04-10T14:00:00.000Z');
    });

    it('should produce half-open interval (start inclusive, end exclusive)', () => {
      const { startUtc, endUtcExclusive } = TimezoneService.getFortnightBoundsUtc(
        '2026-01-14',
        '2026-01-27',
        'UTC'
      );

      // Transaction at exactly 2026-01-28 00:00:00.000Z should NOT be included
      const txAtEndBoundary = new Date('2026-01-28T00:00:00.000Z');
      expect(txAtEndBoundary >= startUtc).toBe(true); // After start
      expect(txAtEndBoundary < endUtcExclusive).toBe(false); // At exclusive end, not included

      // Transaction at 2026-01-27 23:59:59.999Z should be included
      const txJustBeforeEnd = new Date('2026-01-27T23:59:59.999Z');
      expect(txJustBeforeEnd >= startUtc).toBe(true);
      expect(txJustBeforeEnd < endUtcExclusive).toBe(true);
    });
  });

  describe('toLocalDateString', () => {
    it('should convert UTC date to local YYYY-MM-DD in Australia/Melbourne', () => {
      const utcDate = new Date('2026-01-13T13:00:00.000Z'); // 2026-01-14 00:00 AEDT
      const localDateStr = TimezoneService.toLocalDateString(utcDate, 'Australia/Melbourne');
      expect(localDateStr).toBe('2026-01-14');
    });

    it('should convert UTC date to local YYYY-MM-DD in UTC', () => {
      const utcDate = new Date('2026-01-14T00:00:00.000Z');
      const localDateStr = TimezoneService.toLocalDateString(utcDate, 'UTC');
      expect(localDateStr).toBe('2026-01-14');
    });

    it('should convert UTC date to local YYYY-MM-DD in Europe/Copenhagen', () => {
      const utcDate = new Date('2026-01-13T23:00:00.000Z'); // 2026-01-14 00:00 CET
      const localDateStr = TimezoneService.toLocalDateString(utcDate, 'Europe/Copenhagen');
      expect(localDateStr).toBe('2026-01-14');
    });

    it('should handle year boundary conversion', () => {
      const utcDate = new Date('2025-12-31T23:30:00.000Z'); // 2026-01-01 00:30 CET
      const localDateStr = TimezoneService.toLocalDateString(utcDate, 'Europe/Copenhagen');
      expect(localDateStr).toBe('2026-01-01');
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle leap year (Feb 29, 2024)', () => {
      const { startUtc, endUtcExclusive } = TimezoneService.getLocalDayBoundsUtc(
        '2024-02-29',
        'UTC'
      );
      expect(startUtc.toISOString()).toBe('2024-02-29T00:00:00.000Z');
      expect(endUtcExclusive.toISOString()).toBe('2024-03-01T00:00:00.000Z');
    });

    it('should handle single-day fortnight (same start and end)', () => {
      const { startUtc, endUtcExclusive } = TimezoneService.getFortnightBoundsUtc(
        '2026-01-14',
        '2026-01-14',
        'UTC'
      );
      expect(startUtc.toISOString()).toBe('2026-01-14T00:00:00.000Z');
      expect(endUtcExclusive.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    });

    it('should handle Pacific/Auckland (UTC+13 summer)', () => {
      // New Zealand is one of the earliest timezones (UTC+13 in summer)
      const { startUtc, endUtcExclusive } = TimezoneService.getLocalDayBoundsUtc(
        '2026-01-14',
        'Pacific/Auckland'
      );
      // 2026-01-14 00:00 NZDT = 2026-01-13 11:00 UTC
      expect(startUtc.toISOString()).toBe('2026-01-13T11:00:00.000Z');
      // 2026-01-15 00:00 NZDT = 2026-01-14 11:00 UTC
      expect(endUtcExclusive.toISOString()).toBe('2026-01-14T11:00:00.000Z');
    });

    it('should handle Pacific/Honolulu (UTC-10, no DST)', () => {
      // Hawaii doesn't observe DST
      const { startUtc, endUtcExclusive } = TimezoneService.getLocalDayBoundsUtc(
        '2026-01-14',
        'Pacific/Honolulu'
      );
      // 2026-01-14 00:00 HST = 2026-01-14 10:00 UTC
      expect(startUtc.toISOString()).toBe('2026-01-14T10:00:00.000Z');
      // 2026-01-15 00:00 HST = 2026-01-15 10:00 UTC
      expect(endUtcExclusive.toISOString()).toBe('2026-01-15T10:00:00.000Z');
    });
  });
});
