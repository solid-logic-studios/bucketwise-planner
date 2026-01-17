import type { Transaction } from '../../domain/model/transaction.entity.js';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository.interface.js';
import type { TransactionDTO } from '../dtos/transaction.dto.js';
import { UseCase } from './base.use-case.js';

/**
 * ListTransactionsRequest: Input for querying transactions.
 * At least one filter must be provided.
 */
interface ListTransactionsRequest {
  userId: string;
  bucket?: string;
  fortnightId?: string;
  startDate?: Date;
  endDate?: Date;
  kind?: string;
  limit?: number;
  offset?: number;
}

/**
 * ListTransactionsResponse: Paginated list of transactions.
 */
interface ListTransactionsResponse {
  transactions: TransactionDTO[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * ListTransactionsUseCase: Query transactions by bucket or fortnight.
 * Supports filtering for budget tracking and analysis.
 * 
 * @extends BaseUseCase
 * @example
 * ```typescript
 * const useCase = new ListTransactionsUseCase(transactionRepo);
 * const result = await useCase.execute({ bucket: 'Daily Expenses' });
 * console.log(`Found ${result.total} transactions`);
 * ```
 */
export class ListTransactionsUseCase extends UseCase<
  ListTransactionsRequest,
  ListTransactionsResponse
> {
  constructor(private transactionRepository: TransactionRepository) {
    super();
  }

  async execute(request: ListTransactionsRequest): Promise<ListTransactionsResponse> {
    let transactions: Transaction[];

    // Priority: date range > fortnight > bucket
    if (request.startDate && request.endDate) {
      transactions = await this.transactionRepository.findByDateRange(
        request.userId,
        request.startDate,
        request.endDate
      );
    } else if (request.fortnightId) {
      transactions = await this.transactionRepository.findByFortnightId(
        request.userId,
        request.fortnightId
      );
    } else if (request.bucket) {
      transactions = await this.transactionRepository.findByBucket(request.userId, request.bucket);
    } else {
      // If no filters, return empty array (findAll not in interface)
      transactions = [];
    }

    // Apply additional filters
    if (request.kind) {
      transactions = transactions.filter((tx) => tx.kind === request.kind);
    }
    if (request.bucket && (request.startDate || request.fortnightId)) {
      // Filter by bucket: match source bucket OR destination bucket
      transactions = transactions.filter((tx) => 
        tx.sourceBucket === request.bucket || tx.destinationBucket === request.bucket
      );
    }

    // Store total before pagination
    const total = transactions.length;

    // Apply pagination
    const limit = Math.max(1, request.limit ?? 50);
    const offset = Math.max(0, request.offset ?? 0);
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    // Map domain entities to DTOs
    const transactionDTOs: TransactionDTO[] = paginatedTransactions.map((tx: Transaction) => ({
      id: tx.id,
      bucket: tx.sourceBucket,
      sourceBucket: tx.sourceBucket,
      destinationBucket: tx.destinationBucket,
      kind: tx.kind,
      description: tx.description,
      amountCents: tx.amount.cents,
      occurredAt: tx.occurredAt.toISOString(),
      tags: tx.tags,
    }));

    return {
      transactions: transactionDTOs,
      total,
      limit,
      offset,
    };
  }
}
