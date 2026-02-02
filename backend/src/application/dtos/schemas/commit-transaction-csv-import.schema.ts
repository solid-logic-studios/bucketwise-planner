import { z } from 'zod';
import { barefootBuckets } from '../../../domain/model/barefoot-bucket.js';

export const commitTransactionCsvImportSchema = z.object({
  skipDuplicates: z.boolean().optional(),
  rows: z
    .array(
      z.object({
        rowIndex: z.number().int().positive(),
        occurredAt: z.string().min(1),
        kind: z.enum(['income', 'expense']),
        amountCents: z.number().int().positive(),
        description: z.string().min(1).max(255),
        sourceBucket: z.enum(barefootBuckets),
        tags: z.array(z.string()).default([]),
      })
    )
    .min(1),
});

export type CommitTransactionCsvImportRequest = z.infer<typeof commitTransactionCsvImportSchema>;
