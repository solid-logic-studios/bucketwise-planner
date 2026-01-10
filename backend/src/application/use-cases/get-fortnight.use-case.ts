import { ValidationError } from '../../domain/exceptions/validation-error.js';
import { Money } from '../../domain/model/money.js';
import type { FortnightSnapshotRepository } from '../../domain/repositories/fortnight-snapshot.repository.interface.js';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository.interface.js';
import type { BucketBreakdown, FortnightDetailDTO } from '../dtos/fortnight-detail.dto.js';
import { UseCase } from './base.use-case.js';

/**
 * GetFortnightRequest: Input for retrieving fortnight details. (internal)
 */
interface GetFortnightRequest {
  userId: string;
  fortnightId: string;
}

/**
 * GetFortnightUseCase: Retrieve complete fortnight details with per-bucket breakdowns.
 * Computes allocated amounts, spent amounts, and remaining budget for each bucket.
 * Dynamically loads transactions within the fortnight period to provide current data.
 * Calculates Fire Extinguisher allocation for debt payoff projection.
 * 
 * @extends BaseUseCase
 * @example
 * ```typescript
 * const useCase = new GetFortnightUseCase(fortnightRepo, transactionRepo);
 * const result = await useCase.execute({ fortnightId: 'fortnight-1' });
 * console.log(result.fireExtinguisherAmountCents); // Shows monthly debt payment
 * ```
 */
export class GetFortnightUseCase extends UseCase<GetFortnightRequest, FortnightDetailDTO> {
  constructor(
    private fortnightSnapshotRepository: FortnightSnapshotRepository,
    private transactionRepository: TransactionRepository,
  ) {
    super();
  }

  async execute(request: GetFortnightRequest): Promise<FortnightDetailDTO> {
    const snapshot = await this.fortnightSnapshotRepository.findById(request.userId, request.fortnightId);

    if (!snapshot) {
      throw new ValidationError(`Fortnight with ID ${request.fortnightId} not found`);
    }

    // Load transactions dynamically from the period (not from stale snapshot)
    const allTransactions = await this.transactionRepository.getAll(request.userId);
    const periodTransactions = allTransactions.filter(tx => {
      const txDate = tx.occurredAt;
      return txDate >= snapshot.periodStart && txDate <= snapshot.periodEnd;
    });

    // Calculate income and expenses from live transaction data
    const totalIncome = periodTransactions
      .filter(tx => tx.kind === 'income')
      .reduce((sum, tx) => sum.add(tx.amount), new Money(0));

    const totalExpenses = periodTransactions
      .filter(tx => tx.kind === 'expense')
      .reduce((sum, tx) => sum.add(tx.amount), new Money(0));

    // Compute per-bucket breakdowns
    const bucketBreakdowns: BucketBreakdown[] = snapshot.allocations.map(allocation => {
      const allocatedCents = Math.round(totalIncome.cents * allocation.percentage);
      const spent = periodTransactions
        .filter(tx => tx.bucket === allocation.bucket && tx.kind === 'expense')
        .reduce((sum, tx) => sum.add(tx.amount), new Money(0));
      const remainingCents = allocatedCents - spent.cents;

      return {
        bucket: allocation.bucket,
        allocatedPercent: allocation.percentage,
        allocatedCents,
        spentCents: spent.cents,
        remainingCents,
      };
    });

    // Calculate Fire Extinguisher monthly amount (for debt payoff)
    const fireExtinguisherAllocation = snapshot.allocations.find(
      a => a.bucket === 'Fire Extinguisher'
    );
    const fireExtinguisherAmountCents = fireExtinguisherAllocation
      ? Math.round(totalIncome.cents * fireExtinguisherAllocation.percentage)
      : 0;

    return {
      id: snapshot.id,
      periodStart: snapshot.periodStart.toISOString(),
      periodEnd: snapshot.periodEnd.toISOString(),
      totalIncomeCents: totalIncome.cents,
      totalExpensesCents: totalExpenses.cents,
      bucketBreakdowns,
      fireExtinguisherAmountCents,
    };
  }
}

