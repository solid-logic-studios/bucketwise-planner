import type { FortnightSnapshot } from '../../domain/model/fortnight-snapshot.entity.js';
import type { FortnightSnapshotRepository } from '../../domain/repositories/fortnight-snapshot.repository.interface.js';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository.interface.js';
import { UseCase } from './base.use-case.js';

export interface ForthnightSummaryDTO {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalIncomeCents: number;
  totalExpensesCents: number;
}

export interface ListForthnightsRequest {
  userId: string;
}

export class ListForthnightsUseCase extends UseCase<ListForthnightsRequest, ForthnightSummaryDTO[]> {
  constructor(
    private readonly snapshotRepo: FortnightSnapshotRepository,
    private readonly transactionRepo: TransactionRepository
  ) {
    super();
  }

  async execute(request: ListForthnightsRequest): Promise<ForthnightSummaryDTO[]> {
    const fortnights = await this.snapshotRepo.getAll(request.userId);
    
    // Sort by period start descending (newest first)
    fortnights.sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime());

    // Calculate totals from actual transactions for each fortnight
    const summaries = await Promise.all(
      fortnights.map((snapshot) => this.mapSnapshotWithTransactions(request.userId, snapshot))
    );

    return summaries;
  }

  private async mapSnapshotWithTransactions(
    userId: string,
    snapshot: FortnightSnapshot
  ): Promise<ForthnightSummaryDTO> {
    // Query actual transactions within this fortnight's period
    const transactions = await this.transactionRepo.findByDateRange(
      userId,
      snapshot.periodStart,
      snapshot.periodEnd
    );

    // Calculate totals from actual transactions
    const totalIncomeCents = transactions
      .filter(tx => tx.kind === 'income')
      .reduce((sum, tx) => sum + tx.amount.cents, 0);

    const totalExpensesCents = transactions
      .filter(tx => tx.kind === 'expense')
      .reduce((sum, tx) => sum + tx.amount.cents, 0);

    return {
      id: snapshot.id,
      periodStart: snapshot.periodStart.toISOString(),
      periodEnd: snapshot.periodEnd.toISOString(),
      totalIncomeCents,
      totalExpensesCents,
    };
  }
}
