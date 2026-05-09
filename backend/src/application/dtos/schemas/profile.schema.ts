import { z } from 'zod';
import { barefootBuckets } from '../../../domain/model/barefoot-bucket.js';
import {
  DEFAULT_CURRENCY_CODE,
  supportedCurrencyCodes,
} from '../../../domain/model/currency-code.js';

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
  timezone: z.string().optional().default('UTC'),
  currencyCode: z.enum(supportedCurrencyCodes).optional().default(DEFAULT_CURRENCY_CODE),
});

export type UpsertProfileSchemaType = z.infer<typeof upsertProfileSchema>;
