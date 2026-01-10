import { z } from 'zod';
import { barefootBuckets } from '../../../domain/model/barefoot-bucket.js';

const fixedExpenseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  bucket: z.enum(barefootBuckets),
  amountCents: z.number().int().nonnegative(),
});

export const upsertProfileSchema = z.object({
  fortnightlyIncomeCents: z.number().int().nonnegative(),
  defaultFireExtinguisherPercent: z.number().min(0).max(100),
  fixedExpenses: z.array(fixedExpenseSchema).optional().default([]),
});

export type UpsertProfileSchemaType = z.infer<typeof upsertProfileSchema>;
