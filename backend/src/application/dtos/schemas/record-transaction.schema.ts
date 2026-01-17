import { z } from 'zod';
import { barefootBuckets } from '../../../domain/model/barefoot-bucket.js';

/**
 * RecordTransactionSchema: Zod schema for validating transaction input.
 * Ensures all transaction data is valid before creating domain entities.
 * Used by middleware to validate HTTP requests.
 * 
 * Conditional validation:
 * - If kind === 'transfer': sourceBucket and destinationBucket both required and must differ
 * - If kind !== 'transfer': sourceBucket required, destinationBucket must not be present
 * - debtId cannot be used with transfers (transfers don't apply to debt payoff)
 * 
 * @example
 * ```typescript
 * // Regular expense
 * const input = { bucket: 'Daily Expenses', kind: 'expense', ... };
 * 
 * // Transfer between buckets
 * const input = { 
 *   sourceBucket: 'Splurge',
 *   destinationBucket: 'Fire Extinguisher',
 *   kind: 'transfer',
 *   ...
 * };
 * ```
 */
export const recordTransactionSchema = z.object({
  bucket: z.enum(barefootBuckets).optional().describe('Backward-compatibility field'),
  sourceBucket: z.enum(barefootBuckets).describe('Source bucket (or only bucket for income/expense)'),
  destinationBucket: z.enum(barefootBuckets).optional().nullable().describe('Destination bucket (only for transfers)'),
  kind: z.enum(['income', 'expense', 'transfer']).describe('Transaction type'),
  description: z
    .string()
    .min(1)
    .max(255)
    .describe('Description of transaction'),
  amountCents: z
    .number()
    .int()
    .positive()
    .describe('Amount in cents (positive integer)'),
  occurredAt: z.coerce.date().describe('When transaction occurred'),
  tags: z.array(z.string()).optional().describe('Optional categorization tags'),
  debtId: z.string().uuid().optional().describe('Optional debt to apply payment against'),
}).refine(
  (data) => {
    // Transfers must have destinationBucket and it must differ from sourceBucket
    if (data.kind === 'transfer') {
      return data.destinationBucket !== null && 
             data.destinationBucket !== undefined && 
             data.destinationBucket !== data.sourceBucket;
    }
    return true;
  },
  {
    message: 'Transfer must have destinationBucket specified and it must differ from sourceBucket',
    path: ['destinationBucket'],
  }
).refine(
  (data) => {
    // Non-transfers must not have destinationBucket
    if (data.kind !== 'transfer') {
      return data.destinationBucket === null || data.destinationBucket === undefined;
    }
    return true;
  },
  {
    message: 'Only transfer transactions can have a destinationBucket',
    path: ['destinationBucket'],
  }
).refine(
  (data) => {
    // Transfers cannot be applied to debts
    if (data.kind === 'transfer' && data.debtId) {
      return false;
    }
    return true;
  },
  {
    message: 'Transfer transactions cannot be applied to debt payments',
    path: ['debtId'],
  }
);

/**
 * Type inference for validated input
 */
type RecordTransactionSchemaType = z.infer<typeof recordTransactionSchema>;

