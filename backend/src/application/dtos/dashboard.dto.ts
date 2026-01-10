import type { BucketBreakdown } from './fortnight-detail.dto.js';

/**
 * DebtSummary: Summary of a single debt for dashboard.
 */
export interface DebtSummary {
  id: string;
  name: string;
  debtType: string;
  currentBalanceCents: number;
  interestRate: number;
  minimumPaymentCents: number;
  priority: number;
  monthsToPayoff: number;
}

/**
 * DashboardDTO: Consolidated view of financial status.
 * Aggregates fortnight summary, debts, net worth, and projections.
 */
export interface DashboardDTO {
  // Current fortnight summary
  currentFortnight: {
    id: string;
    periodStart: string;
    periodEnd: string;
    totalIncomeCents: number;
    totalExpensesCents: number;
    bucketBreakdowns: BucketBreakdown[];
    fireExtinguisherAmountCents: number;
  } | null;

  // Debt overview
  debts: DebtSummary[];
  consumerDebtCents: number;
  mortgageBalanceCents: number;
  totalDebtCents: number;
  debtFreeInMonths: number;

  // Financial health
  totalIncomeCents: number;
  totalExpensesCents: number;
  netWorthCents: number;

  // Projections
  projectedSavingsIn6Months: number;
}
