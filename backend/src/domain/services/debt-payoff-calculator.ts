import type { Debt } from '../model/debt.entity.js';
import { Money } from '../model/money.js';
import { BaseDomainService } from './base.domain-service.js';

/**
 * MonthlySnapshot: Represents debt state for a single month in payoff timeline.
 */
interface MonthlySnapshot {
  month: number;
  debtsPaid: Debt[];
  debtsContinuing: Debt[];
  interestThisMonth: Money;
  principalPaidThisMonth: Money;
  totalPaidThisMonth: Money;
}

/**
 * FortnightlySnapshot: Represents debt state for a single fortnight in payoff timeline.
 */
interface FortnightlySnapshot {
  fortnight: number;
  debtsPaid: Debt[];
  debtsContinuing: Debt[];
  // Map of debt ID to remaining balance after this fortnight's payment
  remainingBalances: Map<string, number>;
  interestThisPeriod: Money;
  principalPaidThisPeriod: Money;
  totalPaidThisPeriod: Money;
}

/**
 * SnowballResult: Complete payoff analysis for snowball method.
 */
interface SnowballResult {
  months: number;
  totalInterest: Money;
  timeline: MonthlySnapshot[];
}

/**
 * FortnightlySnowballResult: Complete payoff analysis for fortnightly snowball method.
 */
interface FortnightlySnowballResult {
  fortnights: number;
  totalInterest: Money;
  timeline: FortnightlySnapshot[];
}

/**
 * DebtPayoffCalculator: Domain service for calculating debt payoff projections.
 * Implements Barefoot snowball strategy: pay minimums on all debts,
 * then throw all extra payment at the smallest debt first.
 * When smallest debt is eliminated, cascade payment to next smallest.
 * 
 * @extends BaseDomainService
 * @example
 * ```typescript
 * const calculator = new DebtPayoffCalculator();
 * const plan = calculator.calculateSnowball(
 *   [visa, mastercard, mortgage],
 *   new Money(50000) // $500/month Fire Extinguisher
 * );
 * console.log(`Debt-free in ${plan.months} months`);
 * ```
 */
export class DebtPayoffCalculator extends BaseDomainService {
  private static readonly MAX_MONTHS = 600; // 50 years safety limit

  /**
   * Calculate debt payoff using Barefoot snowball method.
   * Sorts by priority, then balance. Applies extra payment to smallest first.
   * Models monthly-compounded interest.
   * 
   * @param debts - Array of debts to pay off
   * @param extraPayment - Monthly extra payment (Fire Extinguisher allocation)
   * @returns Complete payoff analysis with timeline
   */
  calculateSnowball(debts: Debt[], extraPayment: Money): SnowballResult {
    if (debts.length === 0) {
      return {
        months: 0,
        totalInterest: new Money(0),
        timeline: [],
      };
    }

    // Clone debts and sort by priority (asc), then balance (asc)
    const sortedDebts = this.sortDebtsBySnowballOrder(debts);
    
    // Track current balances (mutable for simulation)
    const balances = new Map<string, number>(
      sortedDebts.map(d => [d.id, d.currentBalance.cents])
    );

    const timeline: MonthlySnapshot[] = [];
    let totalInterestCents = 0;
    let monthCount = 0;

    while (balances.size > 0 && monthCount < DebtPayoffCalculator.MAX_MONTHS) {
      monthCount++;

      // Apply interest to all remaining debts
      const interestThisMonth = this.applyMonthlyInterest(sortedDebts, balances);
      totalInterestCents += interestThisMonth.cents;

      // Pay minimums on all debts
      const remainingPayment = this.payMinimums(sortedDebts, balances, extraPayment, 'MONTH');

      // Apply any remaining payment to smallest debt
      const { principalPaid, totalPaid } = this.applyExtraPayment(
        sortedDebts,
        balances,
        remainingPayment
      );

      // Remove fully paid debts
      const paidOffThisMonth = this.removePaidDebts(sortedDebts, balances);

      // Record snapshot
      const continuing = sortedDebts.filter(d => balances.has(d.id));
      timeline.push({
        month: monthCount,
        debtsPaid: paidOffThisMonth,
        debtsContinuing: continuing,
        interestThisMonth,
        principalPaidThisMonth: principalPaid,
        totalPaidThisMonth: totalPaid,
      });
    }

    return {
      months: monthCount,
      totalInterest: new Money(totalInterestCents),
      timeline,
    };
  }

  /**
   * Calculate debt payoff using Barefoot snowball method with fortnightly payments.
   * Sorts by priority, then balance. Applies extra payment to smallest first.
   * Models fortnightly-compounded interest.
   * 
   * @param debts - Array of debts to pay off
   * @param extraPayment - Fortnightly extra payment (Fire Extinguisher allocation)
   * @returns Complete payoff analysis with fortnightly timeline
   */
  calculateSnowballFortnightly(debts: Debt[], extraPayment: Money): FortnightlySnowballResult {
    if (debts.length === 0) {
      return {
        fortnights: 0,
        totalInterest: new Money(0),
        timeline: [],
      };
    }

    // Clone debts and sort by priority (asc), then balance (asc)
    const sortedDebts = this.sortDebtsBySnowballOrder(debts);
    
    // Track current balances (mutable for simulation)
    const balances = new Map<string, number>(
      sortedDebts.map(d => [d.id, d.currentBalance.cents])
    );

    const timeline: FortnightlySnapshot[] = [];
    let totalInterestCents = 0;
    let fortnightCount = 0;
    const MAX_FORTNIGHTS = 1300; // ~50 years

    while (balances.size > 0 && fortnightCount < MAX_FORTNIGHTS) {
      fortnightCount++;

      // Apply interest to all remaining debts (fortnightly compounding)
      const interestThisPeriod = this.applyFortnightlyInterest(sortedDebts, balances);
      totalInterestCents += interestThisPeriod.cents;

      // Pay minimums on all debts
      const remainingPayment = this.payMinimums(sortedDebts, balances, extraPayment, 'FORTNIGHT');

      // Apply any remaining payment to smallest debt
      const { principalPaid, totalPaid } = this.applyExtraPayment(
        sortedDebts,
        balances,
        remainingPayment
      );

      // Remove fully paid debts
      const paidOffThisPeriod = this.removePaidDebts(sortedDebts, balances);

      // Record snapshot with current balances
      const continuing = sortedDebts.filter(d => balances.has(d.id));
      // Clone the balances map so the snapshot has its own copy
      const balancesSnapshot = new Map(balances);
      
      timeline.push({
        fortnight: fortnightCount,
        debtsPaid: paidOffThisPeriod,
        debtsContinuing: continuing,
        remainingBalances: balancesSnapshot,
        interestThisPeriod,
        principalPaidThisPeriod: principalPaid,
        totalPaidThisPeriod: totalPaid,
      });
    }

    return {
      fortnights: fortnightCount,
      totalInterest: new Money(totalInterestCents),
      timeline,
    };
  }

  /**
   * Calculate months to payoff using avalanche method.
   * Highest-interest debt is paid first for mathematical optimization.
   * 
   * @param debts - Array of debts with amount, minimum payment, and interest rate
   * @param extraPayment - Additional monthly payment toward highest-interest debt
   * @returns Object with months to payoff and total interest paid
   */
  calculateAvalanche(
    _debts: Array<{ amount: Money; monthlyMinimum: Money; interestRate: number }>,
    _extraPayment: Money
  ): { months: number; totalInterest: Money } {
    // Placeholder: implement avalanche calculation
    // Sort by interest rate descending, apply extra to highest rate
    return { months: 0, totalInterest: new Money(0) };
  }

  /**
   * Sort debts by Barefoot snowball order: priority ascending, then balance ascending.
   * @param debts - Unsorted debts
   * @returns Sorted copy of debts
   */
  private sortDebtsBySnowballOrder(debts: Debt[]): Debt[] {
    return [...debts].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.currentBalance.cents - b.currentBalance.cents;
    });
  }

  /**
   * Apply monthly interest to all outstanding debts.
   * Uses monthly compounding: monthlyRate = annualRate / 12.
   * @param debts - All debts
   * @param balances - Current balance map (mutated)
   * @returns Total interest applied this month
   */
  private applyMonthlyInterest(debts: Debt[], balances: Map<string, number>): Money {
    let totalInterestCents = 0;

    for (const debt of debts) {
      if (!balances.has(debt.id)) continue;

      const balance = balances.get(debt.id)!;
      const monthlyRate = debt.interestRate / 12;
      const interestCents = Math.round(balance * monthlyRate);

      balances.set(debt.id, balance + interestCents);
      totalInterestCents += interestCents;
    }

    return new Money(totalInterestCents);
  }

  /**
   * Apply fortnightly interest to all outstanding debts.
   * Uses fortnightly compounding: fortnightlyRate = annualRate / 26.
   * @param debts - All debts
   * @param balances - Current balance map (mutated)
   * @returns Total interest applied this fortnight
   */
  private applyFortnightlyInterest(debts: Debt[], balances: Map<string, number>): Money {
    let totalInterestCents = 0;

    for (const debt of debts) {
      if (!balances.has(debt.id)) continue;

      const balance = balances.get(debt.id)!;
      const fortnightlyRate = debt.interestRate / 26; // 26 fortnights per year
      const interestCents = Math.round(balance * fortnightlyRate);

      balances.set(debt.id, balance + interestCents);
      totalInterestCents += interestCents;
    }

    return new Money(totalInterestCents);
  }

  /**
   * Pay minimum payments on all debts, converting monthly to fortnightly as needed.
   * @param debts - All debts
   * @param balances - Current balance map (mutated)
   * @param availablePayment - Total payment available (extra + minimums)
   * @returns Remaining payment after minimums
   */
  private payMinimums(
    debts: Debt[],
    balances: Map<string, number>,
    availablePayment: Money,
    period: 'FORTNIGHT' | 'MONTH'
  ): Money {
    const totalMinimumCents = debts.reduce((sum, debt) => {
      if (!balances.has(debt.id)) return sum;
      return sum + this.convertMinimumForPeriod(debt, period);
    }, 0);

    // Budget for this period is extra payment plus all minimums (we assume minimums are funded)
    let remainingCents = availablePayment.cents + totalMinimumCents;

    for (const debt of debts) {
      if (!balances.has(debt.id)) continue;

      const balance = balances.get(debt.id)!;
      const minimumCents = this.convertMinimumForPeriod(debt, period);
      const paymentCents = Math.min(minimumCents, balance, remainingCents);

      balances.set(debt.id, balance - paymentCents);
      remainingCents -= paymentCents;
    }

    return new Money(Math.max(0, remainingCents));
  }

  private convertMinimumForPeriod(debt: Debt, period: 'FORTNIGHT' | 'MONTH'): number {
    if (period === 'FORTNIGHT') {
      if (debt.minPaymentFrequency === 'MONTHLY') {
        // Exact monthly -> fortnightly conversion: monthly * (12/26)
        return Math.round(debt.minimumPayment.cents * (12 / 26));
      }
      return debt.minimumPayment.cents;
    }

    // period === 'MONTH'
    if (debt.minPaymentFrequency === 'FORTNIGHTLY') {
      // Exact fortnightly -> monthly conversion: fortnightly * (26/12)
      return Math.round(debt.minimumPayment.cents * (26 / 12));
    }
    return debt.minimumPayment.cents;
  }

  /**
   * Apply extra payment to the first debt with remaining balance (snowball target).
   * @param debts - Sorted debts
   * @param balances - Current balance map (mutated)
   * @param extraPayment - Remaining payment after minimums
   * @returns Principal and total paid this month
   */
  private applyExtraPayment(
    debts: Debt[],
    balances: Map<string, number>,
    extraPayment: Money
  ): { principalPaid: Money; totalPaid: Money } {
    if (extraPayment.cents <= 0) {
      return { principalPaid: new Money(0), totalPaid: new Money(0) };
    }

    // Find first debt with balance (already sorted by snowball order)
    for (const debt of debts) {
      if (!balances.has(debt.id)) continue;

      const balance = balances.get(debt.id)!;
      if (balance <= 0) continue;

      const paymentCents = Math.min(extraPayment.cents, balance);
      balances.set(debt.id, balance - paymentCents);

      return {
        principalPaid: new Money(paymentCents),
        totalPaid: extraPayment,
      };
    }

    return { principalPaid: new Money(0), totalPaid: new Money(0) };
  }

  /**
   * Remove debts that are fully paid (balance <= 0).
   * @param debts - All debts
   * @param balances - Current balance map (mutated)
   * @returns Debts paid off this month
   */
  private removePaidDebts(debts: Debt[], balances: Map<string, number>): Debt[] {
    const paidOff: Debt[] = [];

    for (const debt of debts) {
      const balance = balances.get(debt.id);
      if (balance !== undefined && balance <= 0) {
        balances.delete(debt.id);
        paidOff.push(debt);
      }
    }

    return paidOff;
  }
}
