/**
 * FortnightDateService: Utility service for calculating fortnight date boundaries.
 * Provides methods to work with fortnightly periods based on a reference start date.
 * 
 * A fortnight is a 14-day period. All calculations assume fortnights start on
 * a specific reference date and continue in 14-day increments.
 * 
 * @example
 * ```typescript
 * const service = new FortnightDateService();
 * const current = service.getCurrentFortnight(new Date('2026-01-03'));
 * console.log(service.getFortnightLabel(current.start, current.end)); // "1/3 - 1/17"
 * ```
 */
export class FortnightDateService {
  private static readonly DAYS_IN_FORTNIGHT = 14;

  /**
   * Get the current fortnight boundaries based on a reference date.
   * The reference date is treated as the start of fortnight #1.
   * 
   * @param referenceDate - The date to calculate the current fortnight from
   * @param referenceStartDate - Optional start date of the first fortnight (defaults to referenceDate)
   * @returns Object with start and end dates of the current fortnight
   * 
   * @example
   * const today = new Date('2026-01-10');
   * const firstFortnightStart = new Date('2026-01-03');
   * const { start, end } = service.getCurrentFortnight(today, firstFortnightStart);
   * // Returns: { start: 2026-01-03, end: 2026-01-16 }
   */
  getCurrentFortnight(
    referenceDate: Date,
    referenceStartDate?: Date
  ): { start: Date; end: Date } {
    const startDate = referenceStartDate || referenceDate;
    
    // Calculate which fortnight we're in
    const daysSinceStart = Math.floor(
      (referenceDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const fortnightNumber = Math.floor(daysSinceStart / FortnightDateService.DAYS_IN_FORTNIGHT);
    
    return this.getFortnightByNumber(startDate, fortnightNumber);
  }

  /**
   * Get fortnight boundaries for a specific fortnight number.
   * Fortnight numbers are 0-indexed (0 = first fortnight, 1 = second, etc.)
   * 
   * @param startDate - The start date of the first fortnight (fortnight 0)
   * @param fortnightNumber - Zero-indexed fortnight number
   * @returns Object with start and end dates of the specified fortnight
   * 
   * @example
   * const firstFortnightStart = new Date('2026-01-03');
   * const { start, end } = service.getFortnightByNumber(firstFortnightStart, 0);
   * // Returns: { start: 2026-01-03, end: 2026-01-16 }
   * 
   * const { start: start2, end: end2 } = service.getFortnightByNumber(firstFortnightStart, 1);
   * // Returns: { start: 2026-01-17, end: 2026-01-30 }
   */
  getFortnightByNumber(
    startDate: Date,
    fortnightNumber: number
  ): { start: Date; end: Date } {
    const start = new Date(startDate);
    start.setDate(start.getDate() + fortnightNumber * FortnightDateService.DAYS_IN_FORTNIGHT);
    
    const end = new Date(start);
    end.setDate(end.getDate() + FortnightDateService.DAYS_IN_FORTNIGHT - 1);
    
    // Set time to end of day for end date
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  /**
   * Format fortnight date range as a readable label.
   * 
   * @param start - Start date of the fortnight
   * @param end - End date of the fortnight
   * @returns Formatted string like "1/3 - 1/17"
   * 
   * @example
   * const label = service.getFortnightLabel(
   *   new Date('2026-01-03'),
   *   new Date('2026-01-17')
   * );
   * console.log(label); // "1/3 - 1/17"
   */
  getFortnightLabel(start: Date, end: Date): string {
    const startMonth = start.getMonth() + 1;
    const startDay = start.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();
    
    return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
  }

  /**
   * Convert a date to its fortnight number relative to a reference start date.
   * Fortnight numbers are 0-indexed.
   * 
   * @param date - The date to convert
   * @param referenceStartDate - The start date of fortnight 0
   * @returns Zero-indexed fortnight number
   * 
   * @example
   * const referenceStart = new Date('2026-01-03');
   * const fortnightNum = service.dateToFortnightNumber(
   *   new Date('2026-01-20'),
   *   referenceStart
   * );
   * console.log(fortnightNum); // 1 (second fortnight)
   */
  dateToFortnightNumber(date: Date, referenceStartDate: Date): number {
    const daysSinceStart = Math.floor(
      (date.getTime() - referenceStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.floor(daysSinceStart / FortnightDateService.DAYS_IN_FORTNIGHT);
  }
}
