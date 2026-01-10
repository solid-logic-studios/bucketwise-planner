import { z } from 'zod';

// Payment frequency aligns with FE cadence and loan minimums
export const paymentFrequencySchema = z.enum(['FORTNIGHTLY', 'MONTHLY']);

export const upsertMortgageSchema = z.object({
  name: z.string().min(1).max(255).default('Home Mortgage'),
  originalPrincipalCents: z.number().int().nonnegative(),
  currentPrincipalCents: z.number().int().nonnegative(),
  annualRateBps: z.number().int().min(0).max(10000), // 0%..100% guard (domain narrows further)
  minPaymentCents: z.number().int().nonnegative(),
  minPaymentFrequency: paymentFrequencySchema.default('FORTNIGHTLY'),
  annualFeeCents: z.number().int().min(0).default(0),
  priority: z.number().int().min(5).default(5), // mortgages must be >=5 per Barefoot
}).superRefine((val, ctx) => {
  if (val.currentPrincipalCents > val.originalPrincipalCents) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currentPrincipalCents'],
      message: 'Current principal cannot exceed original principal',
    });
  }
  // Soft guard: 0..10% typical mortgage range; enforce strongly in domain layer
  const apr = val.annualRateBps / 10000;
  if (apr > 0.10) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['annualRateBps'], message: 'Mortgage APR should not exceed 10%' });
  }
});

export type UpsertMortgageInput = z.infer<typeof upsertMortgageSchema>;

export const mortgageOverpaymentQuerySchema = z.object({
  fortnightlyFeCents: z.coerce.number().int().min(0).default(0),
});

export type MortgageOverpaymentQuery = z.infer<typeof mortgageOverpaymentQuerySchema>;
