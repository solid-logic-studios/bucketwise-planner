import { z } from 'zod';

export const debtTypeSchema = z.enum(['credit-card', 'mortgage']);

export const paymentFrequencySchema = z.enum(['FORTNIGHTLY', 'MONTHLY']);

export const createDebtSchema = z.object({
  name: z.string().min(1).max(255),
  debtType: debtTypeSchema,
  originalAmountCents: z.number().int().nonnegative(),
  currentBalanceCents: z.number().int().nonnegative(),
  interestRate: z.number().min(0),
  minimumPaymentCents: z.number().int().nonnegative(),
  minPaymentFrequency: paymentFrequencySchema.default('FORTNIGHTLY'),
  priority: z.number().int().nonnegative().optional(),
}).superRefine((val, ctx) => {
  if (val.currentBalanceCents > val.originalAmountCents) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Current balance cannot exceed original amount',
      path: ['currentBalanceCents'],
    });
  }

  if (val.debtType === 'credit-card' && val.interestRate > 0.36) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Credit card rate cannot exceed 36%',
      path: ['interestRate'],
    });
  }

  if (val.debtType === 'mortgage' && val.interestRate > 0.10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Mortgage rate cannot exceed 10%',
      path: ['interestRate'],
    });
  }

  if (val.debtType === 'mortgage' && val.priority !== undefined && val.priority < 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Mortgage priority must be at least 5',
      path: ['priority'],
    });
  }
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;

export const updateDebtBodySchema = createDebtSchema;

export const updateDebtSchema = createDebtSchema.extend({
  id: z.string().uuid(),
});

export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
