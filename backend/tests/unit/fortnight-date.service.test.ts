import { describe, expect, it } from 'vitest';
import { FortnightDateService } from '../../src/domain/services/fortnight-date.service.js';

describe('FortnightDateService', () => {
  const service = new FortnightDateService();

  describe('getCurrentFortnight', () => {
    it('should return correct fortnight for date within first fortnight', () => {
      const referenceStart = new Date('2026-01-03');
      const referenceDate = new Date('2026-01-10');
      
      const result = service.getCurrentFortnight(referenceDate, referenceStart);
      
      expect(result.start.toISOString().split('T')[0]).toBe('2026-01-03');
      expect(result.end.toISOString().split('T')[0]).toBe('2026-01-16');
    });

    it('should return correct fortnight for date in second fortnight', () => {
      const referenceStart = new Date('2026-01-03');
      const referenceDate = new Date('2026-01-20');
      
      const result = service.getCurrentFortnight(referenceDate, referenceStart);
      
      expect(result.start.toISOString().split('T')[0]).toBe('2026-01-17');
      expect(result.end.toISOString().split('T')[0]).toBe('2026-01-30');
    });

    it('should use referenceDate as start when referenceStartDate not provided', () => {
      const referenceDate = new Date('2026-01-03');
      
      const result = service.getCurrentFortnight(referenceDate);
      
      expect(result.start.toISOString().split('T')[0]).toBe('2026-01-03');
      expect(result.end.toISOString().split('T')[0]).toBe('2026-01-16');
    });
  });

  describe('getFortnightByNumber', () => {
    it('should return correct dates for fortnight 0', () => {
      const startDate = new Date('2026-01-03');
      
      const result = service.getFortnightByNumber(startDate, 0);
      
      expect(result.start.toISOString().split('T')[0]).toBe('2026-01-03');
      expect(result.end.toISOString().split('T')[0]).toBe('2026-01-16');
    });

    it('should return correct dates for fortnight 1', () => {
      const startDate = new Date('2026-01-03');
      
      const result = service.getFortnightByNumber(startDate, 1);
      
      expect(result.start.toISOString().split('T')[0]).toBe('2026-01-17');
      expect(result.end.toISOString().split('T')[0]).toBe('2026-01-30');
    });

    it('should return correct dates for fortnight 5', () => {
      const startDate = new Date('2026-01-03');
      
      const result = service.getFortnightByNumber(startDate, 5);
      
      // 5 fortnights = 70 days from start
      expect(result.start.toISOString().split('T')[0]).toBe('2026-03-14');
      expect(result.end.toISOString().split('T')[0]).toBe('2026-03-27');
    });

    it('should set end time to end of day', () => {
      const startDate = new Date('2026-01-03');
      
      const result = service.getFortnightByNumber(startDate, 0);
      
      expect(result.end.getHours()).toBe(23);
      expect(result.end.getMinutes()).toBe(59);
      expect(result.end.getSeconds()).toBe(59);
    });
  });

  describe('getFortnightLabel', () => {
    it('should format dates within same month', () => {
      const start = new Date('2026-01-03');
      const end = new Date('2026-01-16');
      
      const label = service.getFortnightLabel(start, end);
      
      expect(label).toBe('1/3 - 1/16');
    });

    it('should format dates across month boundary', () => {
      const start = new Date('2026-01-24');
      const end = new Date('2026-02-06');
      
      const label = service.getFortnightLabel(start, end);
      
      expect(label).toBe('1/24 - 2/6');
    });

    it('should format dates across year boundary', () => {
      const start = new Date('2025-12-27');
      const end = new Date('2026-01-09');
      
      const label = service.getFortnightLabel(start, end);
      
      expect(label).toBe('12/27 - 1/9');
    });
  });

  describe('dateToFortnightNumber', () => {
    it('should return 0 for date in first fortnight', () => {
      const referenceStart = new Date('2026-01-03');
      const date = new Date('2026-01-10');
      
      const fortnightNum = service.dateToFortnightNumber(date, referenceStart);
      
      expect(fortnightNum).toBe(0);
    });

    it('should return 1 for date in second fortnight', () => {
      const referenceStart = new Date('2026-01-03');
      const date = new Date('2026-01-20');
      
      const fortnightNum = service.dateToFortnightNumber(date, referenceStart);
      
      expect(fortnightNum).toBe(1);
    });

    it('should return 0 for reference start date', () => {
      const referenceStart = new Date('2026-01-03');
      
      const fortnightNum = service.dateToFortnightNumber(referenceStart, referenceStart);
      
      expect(fortnightNum).toBe(0);
    });

    it('should return correct number for date many fortnights ahead', () => {
      const referenceStart = new Date('2026-01-03');
      const date = new Date('2026-07-03'); // ~6 months later
      
      const fortnightNum = service.dateToFortnightNumber(date, referenceStart);
      
      // Approximately 13 fortnights (182 days / 14)
      expect(fortnightNum).toBeGreaterThanOrEqual(12);
      expect(fortnightNum).toBeLessThanOrEqual(13);
    });
  });
});
