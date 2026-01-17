import { z } from 'zod';
import { barefootBuckets } from '../../../domain/model/barefoot-bucket.js';

/**
 * UpdateTransactionSchema: Zod schema for validating transaction update input.
 * Similar to RecordTransactionSchema but requires an ID.
 * Applies same transfer validation rules as record schema.
 * 
 * @example
 * ```typescript
 * // Regular transaction update
 * const input = { id: 'uuid', sourceBucket: 'Daily Expenses', kind: 'expense', ... };
 * 
 * // Transfer update
 * const input = {
 *   id: 'uuid',
 *   sourceBucket: 'Splurge',
 *   destinationBucket: 'Fire Extinguisher',
 *   kind: 'transfer',
 *   ...
 * };
 * ```
 */
export const updateTransactionSchema = z.object({
  id: z.string().uuid().describe('Transaction ID to update'),
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
);

/**
 * Type inference for validated input
 */
type UpdateTransactionSchemaType = z.infer<typeof updateTransactionSchema>;

