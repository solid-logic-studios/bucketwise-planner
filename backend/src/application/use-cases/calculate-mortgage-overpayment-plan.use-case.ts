import { Money } from '../../domain/model/money.js';
import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import { DebtPayoffCalculator } from '../../domain/services/debt-payoff-calculator.js';
import type { MortgageOverpaymentQuery } from '../dtos/schemas/mortgage.schema.js';
import { UseCase } from './base.use-case.js';

export interface CalculateMortgageOverpaymentPlanRequest extends MortgageOverpaymentQuery {
  userId: string;
}

export interface MortgageTimelinePoint {
  periodIndex: number; // 0-based
  dateISO: string;     // YYYY-MM-DD
  remainingCents: number;
}

export interface CalculateMortgageOverpaymentPlanResponse {
  baseline: MortgageTimelinePoint[];
  withFe: MortgageTimelinePoint[];
  payoffDateBaselineISO: string | null;
  payoffDateWithFeISO: string | null;
  timeSavedFortnights: number;
  interestSavedCents: number;
}

export class CalculateMortgageOverpaymentPlanUseCase extends UseCase<CalculateMortgageOverpaymentPlanRequest, CalculateMortgageOverpaymentPlanResponse> {
  private static readonly MAX_FORTNIGHTS = 1300; // ~50 years safety

  constructor(private readonly debtRepo: DebtRepository) {
    super();
  }

  async execute(input: CalculateMortgageOverpaymentPlanRequest): Promise<CalculateMortgageOverpaymentPlanResponse> {
    const { userId, fortnightlyFeCents } = input;

    // 1) Load mortgage
    const mortgages = await this.debtRepo.findByType(userId, 'mortgage');
    const mortgage = mortgages[0];
    if (!mortgage) {
      return {
        baseline: [],
        withFe: [],
        payoffDateBaselineISO: null,
        payoffDateWithFeISO: null,
        timeSavedFortnights: 0,
        interestSavedCents: 0,
      };
    }

    // 2) Determine when FE becomes available by paying off all non-mortgage debts using snowball (fortnightly)
    // NOTE: The snowball calculation assumes FE is EXTRA payment on top of minimums being covered.
    // For the mortgage simulator, we need to know when credit cards are eliminated.
    const allDebts = await this.debtRepo.findByPriority(userId);
    const nonMortgageDebts = allDebts.filter(d => d.debtType !== 'mortgage');

    let feStartAfterFortnights = 0;
    if (nonMortgageDebts.length > 0 && fortnightlyFeCents > 0) {
      const calc = new DebtPayoffCalculator();
      const snowball = calc.calculateSnowballFortnightly(nonMortgageDebts, new Money(fortnightlyFeCents));
      feStartAfterFortnights = snowball.fortnights; // FE available after these fortnights
      // Safety: if snowball hits MAX_FORTNIGHTS, FE never becomes available (insufficient payment)
      if (feStartAfterFortnights >= 1300) {
        feStartAfterFortnights = Number.MAX_SAFE_INTEGER; // Never available
      }
    }

    // 3) Simulate mortgage amortization with fortnightly compounding
    const fortnightlyRate = mortgage.interestRate / 26; // APR divided across 26 fortnights

    // Convert minimum payment to a fortnightly amount if needed
    const baselineFortnightlyMin = this.toFortnightlyPaymentCents(mortgage.minimumPayment.cents, 'FORTNIGHTLY');

    const baselineSim = this.simulateMortgage(
      mortgage.currentBalance.cents,
      fortnightlyRate,
      baselineFortnightlyMin,
      0,
      0
    );

    const withFeSim = this.simulateMortgage(
      mortgage.currentBalance.cents,
      fortnightlyRate,
      baselineFortnightlyMin,
      fortnightlyFeCents,
      feStartAfterFortnights
    );

    const payoffDateBaselineISO = baselineSim.timeline.length > 0 ? baselineSim.timeline[baselineSim.timeline.length - 1]!.dateISO : null;
    const payoffDateWithFeISO = withFeSim.timeline.length > 0 ? withFeSim.timeline[withFeSim.timeline.length - 1]!.dateISO : null;

    return {
      baseline: baselineSim.timeline,
      withFe: withFeSim.timeline,
      payoffDateBaselineISO,
      payoffDateWithFeISO,
      timeSavedFortnights: Math.max(0, baselineSim.timeline.length - withFeSim.timeline.length),
      interestSavedCents: Math.max(0, baselineSim.totalInterestCents - withFeSim.totalInterestCents),
    };
  }

  private toFortnightlyPaymentCents(minPaymentCents: number, frequency: 'FORTNIGHTLY' | 'MONTHLY'): number {
    if (frequency === 'FORTNIGHTLY') return minPaymentCents;
    // Approximate conversion: annualize monthly then spread across 26 fortnights
    return Math.max(0, Math.round((minPaymentCents * 12) / 26));
  }

  private simulateMortgage(
    startingBalanceCents: number,
    fortnightlyRate: number,
    baselineFortnightlyMinCents: number,
    feFortnightlyCents: number,
    feStartAfterFortnights: number
  ): { timeline: MortgageTimelinePoint[]; totalInterestCents: number } {
    let balance = startingBalanceCents;
    let totalInterestCents = 0;
    const timeline: MortgageTimelinePoint[] = [];
    const startDate = new Date();

    for (let i = 0; i < CalculateMortgageOverpaymentPlanUseCase.MAX_FORTNIGHTS && balance > 0; i++) {
      // Apply interest
      const interestCents = Math.round(balance * fortnightlyRate);
      balance += interestCents;
      totalInterestCents += interestCents;

      // Determine payment this period
      const extra = i >= feStartAfterFortnights ? feFortnightlyCents : 0;
      const payment = Math.max(0, baselineFortnightlyMinCents + extra);
      const actualPay = Math.min(payment, balance);
      balance -= actualPay;

      // Compute period date (YYYY-MM-DD)
      const d = new Date(startDate.getTime());
      d.setDate(d.getDate() + i * 14);
      const dateISO = d.toISOString().slice(0, 10);

      timeline.push({ periodIndex: i, dateISO, remainingCents: Math.max(0, Math.round(balance)) });

      // Safety: if payments are too small to reduce balance, break to avoid infinite loop
      if (actualPay <= interestCents && balance > 0) {
        // Payment isn't covering interest; can't amortize
        break;
      }
    }

    return { timeline, totalInterestCents };
  }
}
