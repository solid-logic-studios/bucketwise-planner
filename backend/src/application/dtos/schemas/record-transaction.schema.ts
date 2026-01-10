import { z } from 'zod';
import { barefootBuckets } from '../../../domain/model/barefoot-bucket.js';

/**
 * RecordTransactionSchema: Zod schema for validating transaction input.
 * Ensures all transaction data is valid before creating domain entities.
 * Used by middleware to validate HTTP requests.
 * 
 * @example
 * ```typescript
 * const input = { bucket: 'Daily Expenses', kind: 'expense', ... };
 * const validated = recordTransactionSchema.parse(input); // throws if invalid
 * ```
 */
export const recordTransactionSchema = z.object({
  bucket: z.enum(barefootBuckets).describe('Barefoot bucket type'),
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
});

/**
 * Type inference for validated input
 */
type RecordTransactionSchemaType = z.infer<typeof recordTransactionSchema>;
