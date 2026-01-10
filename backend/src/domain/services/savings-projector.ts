import { FortnightSnapshot } from '../model/fortnight-snapshot.entity.js';
import { Money } from '../model/money.js';
import { BaseDomainService } from './base.domain-service.js';

/**
 * SavingsProjector: Domain service for projecting savings goals.
 * Analyzes historical spending and projects future savings accumulation.
 * Helps users understand their average savings rate and plan ahead.
 * 
 * @extends BaseDomainService
 * @example
 * ```typescript
 * const projector = new SavingsProjector();
 * const projectedSavings = projector.projectSavings(history, 26); // Next 6 months
 * const avgByBucket = projector.getAverageSpendingByBucket(history);
 * ```
 */
export class SavingsProjector extends BaseDomainService {
  /**
   * Project savings over N fortnights based on historical data.
   * Calculates average surplus per fortnight and extrapolates forward.
   * 
   * @param history - Array of past FortnightSnapshots to analyze
   * @param fortnightCount - Number of fortnights to project ahead
   * @returns Projected Money for the period
   */
  projectSavings(history: FortnightSnapshot[], fortnightCount: number): Money {
    if (history.length === 0) return new Money(0);

    // Calculate average surplus per fortnight
    const totalFortnights = history.length;
    let totalSurplus = new Money(0);

    for (const snapshot of history) {
      const income = snapshot.totalIncome();
      const expenses = snapshot.totalExpenses();
      const surplus = income.subtract(expenses);
      totalSurplus = totalSurplus.add(surplus);
    }

    const averageSurplus = new Money(
      Math.floor(totalSurplus.cents / totalFortnights)
    );

    return averageSurplus.multiply(fortnightCount);
  }

  /**
   * Get average spending per bucket from historical data.
   * Useful for understanding which buckets consume most budget.
   * 
   * @param history - Array of past FortnightSnapshots to analyze
   * @returns Map of bucket name to average spending Money
   */
  getAverageSpendingByBucket(
    history: FortnightSnapshot[]
  ): Map<string, Money> {
    const bucketTotals = new Map<string, Money>();

    for (const snapshot of history) {
      const allocations = snapshot.allocations;
      for (const alloc of allocations) {
        const spend = snapshot.bucketSpend(alloc.bucket);
        const current = bucketTotals.get(alloc.bucket) || new Money(0);
        bucketTotals.set(alloc.bucket, current.add(spend));
      }
    }

    // Divide by number of fortnights to get average
    for (const [bucket, total] of bucketTotals.entries()) {
      bucketTotals.set(
        bucket,
        new Money(Math.floor(total.cents / history.length))
      );
    }

    return bucketTotals;
  }
}
