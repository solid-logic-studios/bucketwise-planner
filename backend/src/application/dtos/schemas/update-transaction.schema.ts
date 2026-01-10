import { z } from 'zod';
import { barefootBuckets } from '../../../domain/model/barefoot-bucket.js';

/**
 * UpdateTransactionSchema: Zod schema for validating transaction update input.
 * Similar to RecordTransactionSchema but requires an ID.
 * 
 * @example
 * ```typescript
 * const input = { id: 'uuid', bucket: 'Daily Expenses', kind: 'expense', ... };
 * const validated = updateTransactionSchema.parse(input);
 * ```
 */
export const updateTransactionSchema = z.object({
  id: z.string().uuid().describe('Transaction ID to update'),
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
});

/**
 * Type inference for validated input
 */
type UpdateTransactionSchemaType = z.infer<typeof updateTransactionSchema>;
