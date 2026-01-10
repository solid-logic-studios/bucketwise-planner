import { z } from 'zod';
import { barefootBuckets } from '../../../domain/model/barefoot-bucket.js';

const requiredBlowAllocations = {
  'Daily Expenses': 0.6,
  Splurge: 0.1,
  Smile: 0.1,
  'Fire Extinguisher': 0.2,
} as const;

const optionalBuckets = ['Mojo', 'Grow'] as const;

/**
 * CreateFortnightSchema: Zod schema for validating fortnight creation input.
 * Ensures allocations sum to 100% and all data is valid.
 * 
 * @example
 * ```typescript
 * const input = {
 *   periodStart: new Date('2026-01-01'),
 *   periodEnd: new Date('2026-01-14'),
 *   allocations: [...]
 * };
 * const validated = createFortnightSchema.parse(input);
 * ```
 */
const allocationSchema = z.object({
  bucket: z.enum(barefootBuckets).describe('Barefoot bucket type'),
  percent: z
    .number()
    .min(0)
    .max(1)
    .describe('Allocation percentage (0 to 1.0, required >0 for Blow buckets)'),
});

export const createFortnightSchema = z
  .object({
    periodStart: z.coerce.date().describe('Start date of fortnight'),
    periodEnd: z.coerce.date().describe('End date of fortnight'),
    allocations: z
      .array(allocationSchema)
      .min(1)
      .describe('Budget allocations for each bucket'),
  })
  .refine(
    (data) => data.periodEnd > data.periodStart,
    {
      message: 'Period end must be after period start',
      path: ['periodEnd'],
    }
  )
  .refine(
    (data) => {
      // Enforce required Blow allocations at fixed percentages
      const byBucket = new Map(data.allocations.map((a) => [a.bucket, a.percent]));

      // Required buckets must be present and match required percentages (within tolerance)
      for (const [bucket, required] of Object.entries(requiredBlowAllocations)) {
        const value = byBucket.get(bucket as keyof typeof requiredBlowAllocations);
        if (value === undefined) {
          return false;
        }
        if (Math.abs(value - required) > 0.0001) {
          return false;
        }
      }

      // Optional buckets (Mojo, Grow) may be present with 0..1, but total must still be 1.0
      const sum = data.allocations.reduce((acc, a) => acc + a.percent, 0);
      return Math.abs(sum - 1.0) < 0.001;
    },
    {
      message: 'Allocations must include Blow buckets at 60/10/10/20 and total 100%',
      path: ['allocations'],
    }
  );

/**
 * Type inference for validated input
 */
type CreateFortnightSchemaType = z.infer<typeof createFortnightSchema>;
