import { z } from 'zod';

export const skipDebtPaymentBodySchema = z.object({
  fortnightId: z.string().min(1),
  paymentDate: z.coerce.date(),
  amountCents: z.number().int().positive(),
  skipReason: z.string().max(500).optional(),
});

export const skipDebtPaymentSchema = skipDebtPaymentBodySchema.extend({
  debtId: z.string().uuid(),
});

export type SkipDebtPaymentInput = z.infer<typeof skipDebtPaymentSchema>;
