import { Money } from '../../domain/model/money.js';
import type { Transaction } from '../../domain/model/transaction.entity.js';
import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import type { FortnightSnapshotRepository } from '../../domain/repositories/fortnight-snapshot.repository.interface.js';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository.interface.js';
import { DebtPayoffCalculator } from '../../domain/services/debt-payoff-calculator.js';
import { SavingsProjector } from '../../domain/services/savings-projector.js';
import type { DashboardDTO, DebtSummary } from '../dtos/dashboard.dto.js';
import { UseCase } from './base.use-case.js';

/**
 * GetDashboardRequest: Input for dashboard (may be empty or contain filters).
 */
interface GetDashboardRequest {
  userId: string;
  currentFortnightId?: string;
}

/**
 * GetDashboardUseCase: Aggregate all financial data into single dashboard view.
 * Combines current fortnight, debts, projections, and net worth calculation.
 * 
 * @extends UseCase
 * @example
 * ```typescript
 * const useCase = new GetDashboardUseCase(fortnightRepo, debtRepo);
 * const dashboard = await useCase.execute({ currentFortnightId: 'fortnight-1' });
 * console.log(`Net worth: $${dashboard.netWorthCents / 100}`);
 * ```
 */
export class GetDashboardUseCase extends UseCase<
  GetDashboardRequest,
  DashboardDTO
> {
  private debtPayoffCalculator: DebtPayoffCalculator;
  private savingsProjector: SavingsProjector;

  constructor(
    private fortnightSnapshotRepository: FortnightSnapshotRepository,
    private debtRepository: DebtRepository,
    private transactionRepository?: TransactionRepository
  ) {
    super();
    this.debtPayoffCalculator = new DebtPayoffCalculator();
    this.savingsProjector = new SavingsProjector();
  }

  async execute(request: GetDashboardRequest): Promise<DashboardDTO> {
    // Get current fortnight (if provided)
    let currentFortnight = null;
    let fireExtinguisherCents = 0;

    if (request.currentFortnightId) {
      const snapshot = await this.fortnightSnapshotRepository.findById(
        request.userId,
        request.currentFortnightId
      );

      if (snapshot) {
        // Load transactions dynamically from the period (not from stale snapshot)
        let periodTransactions: Transaction[] = [];
        if (this.transactionRepository) {
          const allTransactions = await this.transactionRepository.getAll(request.userId);
          periodTransactions = allTransactions.filter(tx => {
            const txDate = tx.occurredAt;
            return txDate >= snapshot.periodStart && txDate < snapshot.periodEnd;
          });
        }

        // Calculate income and expenses from live transaction data
        const totalIncome = periodTransactions
          .filter(tx => tx.kind === 'income')
          .reduce((sum, tx) => sum.add(tx.amount), new Money(0));

        const totalExpenses = periodTransactions
          .filter(tx => tx.kind === 'expense')
          .reduce((sum, tx) => sum.add(tx.amount), new Money(0));

        // Calculate Fire Extinguisher allocation
        const fireExtinguisherAllocation = snapshot.allocations.find(
          a => a.bucket === 'Fire Extinguisher'
        );
        fireExtinguisherCents = fireExtinguisherAllocation
          ? Math.round(totalIncome.cents * fireExtinguisherAllocation.percentage)
          : 0;

        currentFortnight = {
          id: snapshot.id,
          periodStart: snapshot.periodStart.toISOString(),
          periodEnd: snapshot.periodEnd.toISOString(),
          totalIncomeCents: totalIncome.cents,
          totalExpensesCents: totalExpenses.cents,
          bucketBreakdowns: snapshot.allocations.map(allocation => {
            const allocatedCents = Math.round(totalIncome.cents * allocation.percentage);
            
            // Calculate spent: expenses + transfers out - transfers in
            const expensesFromBucket = periodTransactions
              .filter(tx => tx.sourceBucket === allocation.bucket && tx.kind === 'expense')
              .reduce((sum, tx) => sum.add(tx.amount), new Money(0));
            
            const transfersOut = periodTransactions
              .filter(tx => tx.sourceBucket === allocation.bucket && tx.kind === 'transfer')
              .reduce((sum, tx) => sum.add(tx.amount), new Money(0));
            
            const transfersIn = periodTransactions
              .filter(tx => tx.destinationBucket === allocation.bucket && tx.kind === 'transfer')
              .reduce((sum, tx) => sum.add(tx.amount), new Money(0));
            
            const spent = expensesFromBucket.add(transfersOut).subtract(transfersIn);
            
            const remainingCents = allocatedCents - spent.cents;

            return {
              bucket: allocation.bucket,
              allocatedPercent: allocation.percentage,
              allocatedCents,
              spentCents: spent.cents,
              remainingCents,
            };
          }),
          fireExtinguisherAmountCents: fireExtinguisherCents,
        };
      }
    }

    // Get all debts and calculate payoff timeline
    const debts = await this.debtRepository.findByPriority(request.userId);
    const totalDebtCents = debts.reduce(
      (sum, debt) => sum + debt.currentBalance.cents,
      0
    );

    // Split debt by type: consumer (credit cards, loans) vs mortgage
    const consumerDebtCents = debts
      .filter(d => d.debtType === 'credit-card')
      .reduce((sum, debt) => sum + debt.currentBalance.cents, 0);
    const mortgageBalanceCents = debts
      .filter(d => d.debtType === 'mortgage')
      .reduce((sum, debt) => sum + debt.currentBalance.cents, 0);

    let debtFreeInFortnights = 0;
    const debtSummaries: DebtSummary[] = [];

    if (debts.length > 0 && fireExtinguisherCents > 0) {
      const payoffPlan = this.debtPayoffCalculator.calculateSnowballFortnightly(
        debts,
        new Money(fireExtinguisherCents)
      );
      debtFreeInFortnights = payoffPlan.fortnights;

      // Map debts to summaries with individual payoff fortnights
      debtSummaries.push(
        ...debts.map(debt => {
          // Find when this debt gets paid off in timeline
          const payoffFortnight = payoffPlan.timeline.findIndex(fortnight =>
            fortnight.debtsPaid.some(pd => pd.id === debt.id)
          );

          return {
            id: debt.id,
            name: debt.name,
            debtType: debt.debtType,
            currentBalanceCents: debt.currentBalance.cents,
            interestRate: debt.interestRate,
            minimumPaymentCents: debt.minimumPayment.cents,
            priority: debt.priority,
            monthsToPayoff: payoffFortnight >= 0 ? payoffFortnight + 1 : debtFreeInFortnights,
          };
        })
      );
    } else {
      // No Fire Extinguisher allocation, just map debts without payoff calculation
      debtSummaries.push(
        ...debts.map(debt => ({
          id: debt.id,
          name: debt.name,
          debtType: debt.debtType,
          currentBalanceCents: debt.currentBalance.cents,
          interestRate: debt.interestRate,
          minimumPaymentCents: debt.minimumPayment.cents,
          priority: debt.priority,
          monthsToPayoff: 0, // Unknown without Fire Extinguisher
        }))
      );
    }

    // Calculate net worth (assets - liabilities)
    const totalIncomeCents = currentFortnight?.totalIncomeCents || 0;
    const totalExpensesCents = currentFortnight?.totalExpensesCents || 0;
    const netWorthCents = totalIncomeCents - totalDebtCents;

    // Project savings (6 months = 13 fortnights)
    let projectedSavingsIn6Months = 0;
    if (currentFortnight) {
      const surplus = totalIncomeCents - totalExpensesCents;
      projectedSavingsIn6Months = surplus * 13; // 13 fortnights ≈ 6 months
    }

    return {
      currentFortnight,
      debts: debtSummaries,
      consumerDebtCents,
      mortgageBalanceCents,
      totalDebtCents,
      debtFreeInMonths: debtFreeInFortnights,
      totalIncomeCents,
      totalExpensesCents,
      netWorthCents,
      projectedSavingsIn6Months,
    };
  }
}
