/**
 * FortnightlyTimelineEntry: Single fortnight in debt payoff timeline.
 * Shows which debt is being targeted, how much is paid, and remaining balances.
 */
export interface FortnightlyTimelineEntry {
  fortnight: number;
  paymentDate: string; // ISO 8601 date string (YYYY-MM-DD format)
  
  // The debt currently being attacked (highest priority/lowest balance)
  debtBeingPaid: {
    id: string;
    name: string;
    debtType: string;
  } | null; // null if no debts remain
  
  // Amount paid specifically to the active debt this fortnight
  paymentToActiveDebtCents: number;
  
  // Remaining balance on the active debt after this fortnight's payment
  remainingBalanceOfActiveDebtCents: number;
  
  // Minimum payments on other debts (also paid this fortnight)
  minimumPaymentsOnOtherDebts: Array<{
    debtId: string;
    debtName: string;
    minimumPaymentCents: number;
    remainingBalanceCents: number;
  }>;
  
  // Total remaining debt across all debts
  totalDebtRemainingCents: number;
  
  // Debts that were completely paid off this fortnight
  debtsPaidOffThisMonth: Array<{
    id: string;
    name: string;
    debtType: string;
  }>;
  
  // Interest paid this fortnight (for reference)
  interestCents: number;
}

/**
 * DebtPayoffPlanDTO: Complete debt payoff projection with fortnight-by-fortnight timeline.
 * Shows Barefoot snowball strategy results in plain English.
 */
export interface DebtPayoffPlanDTO {
  totalFortnightsToPayoff: number;
  totalInterestCents: number;
  fortnightlyFireExtinguisherCents: number;
  timeline: FortnightlyTimelineEntry[];
}

