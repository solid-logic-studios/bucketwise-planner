import { Money } from '../../domain/model/money.js';
import type { Transaction } from '../../domain/model/transaction.entity.js';
import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import type { FortnightSnapshotRepository } from '../../domain/repositories/fortnight-snapshot.repository.interface.js';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository.interface.js';
import { DebtPayoffCalculator } from '../../domain/services/debt-payoff-calculator.js';
import type { DebtPayoffPlanDTO, FortnightlyTimelineEntry } from '../dtos/debt-payoff-plan.dto.js';
import { UseCase } from './base.use-case.js';

/**
 * GetDebtPayoffPlanRequest: Input for calculating debt payoff timeline.
 */
interface GetDebtPayoffPlanRequest {
  userId: string;
  fortnightlyFireExtinguisherCents: number;
  startDate?: Date; // First payment date (defaults to today)
  currentFortnightId?: string; // Optional: if provided, check if payments already made in current fortnight
}

/**
 * GetDebtPayoffPlanUseCase: Calculate complete debt payoff timeline using Barefoot snowball.
 * Loads all debts, applies Fire Extinguisher fortnightly payment, returns fortnight-by-fortnight projection.
 * If currentFortnightId is provided, checks if payments were already made in that fortnight and skips it.
 * 
 * @extends BaseUseCase
 * @example
 * ```typescript
 * const useCase = new GetDebtPayoffPlanUseCase(debtRepo, fortnightRepo, transactionRepo);
 * const result = await useCase.execute({ fortnightlyFireExtinguisherCents: 92200 }); // $922/fortnight
 * console.log(`Debt-free in ${result.totalFortnightsToPayoff} fortnights`);
 * ```
 */
export class GetDebtPayoffPlanUseCase extends UseCase<
  GetDebtPayoffPlanRequest,
  DebtPayoffPlanDTO
> {
  private calculator: DebtPayoffCalculator;

  constructor(
    private debtRepository: DebtRepository,
    private fortnightRepository?: FortnightSnapshotRepository,
    private transactionRepository?: TransactionRepository
  ) {
    super();
    this.calculator = new DebtPayoffCalculator();
  }

  async execute(request: GetDebtPayoffPlanRequest): Promise<DebtPayoffPlanDTO> {
    // Load all debts sorted by priority (snowball order)
    const debts = await this.debtRepository.findByPriority(request.userId);

    if (debts.length === 0) {
      return {
        totalFortnightsToPayoff: 0,
        totalInterestCents: 0,
        fortnightlyFireExtinguisherCents: request.fortnightlyFireExtinguisherCents,
        timeline: [],
      };
    }

    // Calculate snowball payoff plan with fortnightly payments
    const fireExtinguisherPayment = new Money(request.fortnightlyFireExtinguisherCents);
    const plan = this.calculator.calculateSnowballFortnightly(debts, fireExtinguisherPayment);

    // Determine start date for timeline
    let timelineStartDate = request.startDate || new Date();

    // If currentFortnightId provided, check if payments already made in current fortnight
    if (request.currentFortnightId && this.fortnightRepository && this.transactionRepository) {
      const currentFortnight = await this.fortnightRepository.findById(request.userId, request.currentFortnightId);
      if (currentFortnight) {
        // Find all debt-payment transactions in current fortnight
        const allTransactions = await this.transactionRepository.getAll(request.userId);
        const paymentsInCurrentFortnight = allTransactions.filter(
          (tx: Transaction) =>
            tx.tags.includes('debt-payment') &&
            tx.occurredAt >= currentFortnight.periodStart &&
            tx.occurredAt < currentFortnight.periodEnd
        );

        // If payments were made, next payment is 14 days after fortnight start
        if (paymentsInCurrentFortnight.length > 0) {
          timelineStartDate = new Date(currentFortnight.periodStart);
          timelineStartDate.setDate(timelineStartDate.getDate() + 14);
        }
      }
    }
    
    // Map domain timeline to DTO with user-friendly format
    const timelineDTO: FortnightlyTimelineEntry[] = plan.timeline.map(period => {
      // The active debt is the first one in the continuing list (being attacked this fortnight)
      const activeDebt = period.debtsContinuing.length > 0 ? period.debtsContinuing[0] : null;
      
      // Calculate total remaining debt across all continuing debts using the snapshot balances
      const totalRemaining = period.debtsContinuing.reduce(
        (sum, d) => sum + (period.remainingBalances.get(d.id) || 0),
        0
      );

      // Get the actual remaining balance from the snapshot
      const activeDebtBalance = activeDebt ? (period.remainingBalances.get(activeDebt.id) || 0) : 0;
      
      // Extract minimum payments on non-active debts
      const minimumPaymentsOnOtherDebts = period.debtsContinuing
        .filter(d => d.id !== activeDebt?.id) // Exclude the active debt
        .map(d => ({
          debtId: d.id,
          debtName: d.name,
          minimumPaymentCents: d.minPaymentFrequency === 'MONTHLY'
            ? Math.round(d.minimumPayment.cents * (12 / 26))
            : d.minimumPayment.cents,
          remainingBalanceCents: period.remainingBalances.get(d.id) || 0,
        }));
      
      // Calculate payment date: timeline start date + (fortnight - 1) * 14 days
      const paymentDate = new Date(timelineStartDate);
      paymentDate.setDate(paymentDate.getDate() + (period.fortnight - 1) * 14);
      const paymentDateStr = paymentDate.toISOString().split('T')[0] || paymentDate.toLocaleDateString('en-CA');

      return {
        fortnight: period.fortnight,
        paymentDate: paymentDateStr, // YYYY-MM-DD format
        debtBeingPaid: activeDebt ? {
          id: activeDebt.id,
          name: activeDebt.name,
          debtType: activeDebt.debtType,
        } : null,
        paymentToActiveDebtCents: activeDebt 
          ? Math.min(fireExtinguisherPayment.cents, activeDebtBalance)
          : 0,
        remainingBalanceOfActiveDebtCents: activeDebtBalance,
        minimumPaymentsOnOtherDebts,
        totalDebtRemainingCents: totalRemaining,
        debtsPaidOffThisMonth: period.debtsPaid.map(d => ({
          id: d.id,
          name: d.name,
          debtType: d.debtType,
        })),
        interestCents: period.interestThisPeriod.cents,
      };
    });

    return {
      totalFortnightsToPayoff: plan.fortnights,
      totalInterestCents: plan.totalInterest.cents,
      fortnightlyFireExtinguisherCents: request.fortnightlyFireExtinguisherCents,
      timeline: timelineDTO,
    };
  }
}
