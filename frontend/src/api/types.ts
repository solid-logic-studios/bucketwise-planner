export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface TransactionDTO {
  id: string;
  bucket: string; // Backward compatibility: same as sourceBucket
  sourceBucket: string;
  destinationBucket: string | null;
  kind: string;
  amountCents: number;
  description: string;
  occurredAt: string;
  tags?: string[];
}

export interface BucketBreakdown {
  bucket: string;
  allocatedPercent: number;
  allocatedCents: number;
  spentCents: number;
  remainingCents: number;
}

export interface FortnightDetailDTO {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalIncomeCents: number;
  totalExpensesCents: number;
  bucketBreakdowns: BucketBreakdown[];
  fireExtinguisherAmountCents: number;
}

export interface ForthnightSummaryDTO {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalIncomeCents: number;
  totalExpensesCents: number;
}

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

export interface DebtDTO {
  id: string;
  name: string;
  debtType: string;
  originalAmountCents: number;
  currentBalanceCents: number;
  interestRate: number;
  minimumPaymentCents: number;
  minPaymentFrequency: 'FORTNIGHTLY' | 'MONTHLY';
  priority: number;
}

export interface DashboardDTO {
  currentFortnight?: FortnightDetailDTO | null;
  debts: DebtSummary[];
  consumerDebtCents: number;
  mortgageBalanceCents: number;
  totalDebtCents: number;
  debtFreeInMonths: number;
  totalIncomeCents: number;
  totalExpensesCents: number;
  netWorthCents: number;
  projectedSavingsIn6Months: number;
}

export interface DebtsPaidOffEntry {
  id: string;
  name: string;
  debtType: string;
}

export interface DebtsContinuingEntry {
  id: string;
  name: string;
  debtType: string;
  remainingBalanceCents: number;
}

export interface FortnightlyTimelineEntry {
  fortnight: number;
  paymentDate: string; // YYYY-MM-DD format
  debtBeingPaid: {
    id: string;
    name: string;
    debtType: string;
  } | null;
  paymentToActiveDebtCents: number;
  remainingBalanceOfActiveDebtCents: number;
  minimumPaymentsOnOtherDebts: Array<{
    debtId: string;
    debtName: string;
    minimumPaymentCents: number;
    remainingBalanceCents: number;
  }>;
  totalDebtRemainingCents: number;
  debtsPaidOffThisMonth: Array<{
    id: string;
    name: string;
    debtType: string;
  }>;
  interestCents: number;
}

export interface DebtPayoffPlanDTO {
  totalFortnightsToPayoff: number;
  totalInterestCents: number;
  fortnightlyFireExtinguisherCents: number;
  timeline: FortnightlyTimelineEntry[];
}

export interface FixedExpenseDTO {
  id: string;
  name: string;
  bucket: string;
  amountCents: number;
}

export interface ProfileDTO {
  fortnightlyIncomeCents: number;
  defaultFireExtinguisherPercent: number;
  defaultFireExtinguisherAmountCents: number;
  fixedExpenses: FixedExpenseDTO[];
  timezone: string;
}

export interface SkippedDebtPaymentDTO {
  id: string;
  debtId: string;
  fortnightId: string;
  paymentDate: string;
  amountCents: number;
  skipReason?: string;
  skippedAt: string;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type PageKey = 'dashboard' | 'charts' | 'transactions' | 'debts' | 'fortnight' | 'profile' | 'ownhome' | 'general';

export interface PageContext {
  page: PageKey;
  fortnightId?: string;
  debtId?: string;
  transactions?: TransactionDTO[];
  specificDebt?: DebtDTO;
  fortnightSnapshot?: FortnightDetailDTO;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface SendChatMessageRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  pageContext?: PageContext;
}

export interface ChatResponseDTO {
  response: string;
  messageId: string;
  timestamp: string;
  tokenUsage?: TokenUsage;
}

// Mortgage Types
export interface MortgageDTO {
  id: string;
  name: string;
  originalAmountCents: number;
  currentBalanceCents: number;
  interestRate: number;
  minimumPaymentCents: number;
  minPaymentFrequency: 'FORTNIGHTLY' | 'MONTHLY';
  priority: number;
}

export interface MortgageTimelinePoint {
  periodIndex: number;
  dateISO: string;
  remainingCents: number;
}

export interface MortgageOverpaymentPlanDTO {
  baseline: MortgageTimelinePoint[];
  withFe: MortgageTimelinePoint[];
  payoffDateBaselineISO: string | null;
  payoffDateWithFeISO: string | null;
  timeSavedFortnights: number;
  interestSavedCents: number;
}

export interface UpsertMortgageRequest {
  name: string;
  originalPrincipalCents: number;
  currentPrincipalCents: number;
  annualRateBps: number;
  minPaymentCents: number;
  minPaymentFrequency: 'FORTNIGHTLY' | 'MONTHLY';
  annualFeeCents: number;
  priority: number;
}
