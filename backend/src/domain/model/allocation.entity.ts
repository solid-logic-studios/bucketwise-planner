import { ValidationError } from '../exceptions/validation-error.js';
import { type BarefootBucket } from './barefoot-bucket.js';
import { BaseEntity } from './base.entity.js';

const requiredBlowBuckets = new Set([
    'Daily Expenses',
    'Splurge',
    'Smile',
    'Fire Extinguisher',
]);

/**
 * Allocation: Entity representing the budget allocation for a specific bucket.
 * Allocations define what percentage of income should go to each bucket.
 * Example: 60% to Daily Expenses, 20% to Fire Extinguisher, etc.
 * 
 * @example
 * ```typescript
 * const dailyExpensesAlloc = new Allocation(
 *   'alloc-1',
 *   'Daily Expenses',
 *   0.6
 * );
 * ```
 */
export class Allocation extends BaseEntity {
    /**
     * The bucket this allocation applies to
     */
    readonly bucket: BarefootBucket;

    /**
     * The percentage (0.0 to 1.0) of income allocated to this bucket
     */
    readonly percentage: number;

    constructor(
        id: string,
        bucket: BarefootBucket,
        percentage: number
    ) {
        super(id);
        this.bucket = bucket;
        this.validatePercentage(percentage);
        this.percentage = percentage;
    }

    /**
     * Validate that percentage is within valid range (0 to 1).
     * @param percentage - The percentage to validate
     * @throws ValidationError if percentage is outside valid range
     */
    private validatePercentage(percentage: number): void {
        // Optional buckets (Mojo/Grow) may be 0; required Blow buckets must be >0
        const isRequiredBlow = requiredBlowBuckets.has(this.bucket as string);

        if (percentage < 0 || percentage > 1) {
            throw new ValidationError('Percentage must be between 0 and 1');
        }

        if (isRequiredBlow && percentage === 0) {
            throw new ValidationError('Required buckets must have a positive allocation');
        }
    }
}