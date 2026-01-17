import type { BarefootBucket } from '../../domain/model/barefoot-bucket.js';
import { Money } from '../../domain/model/money.js';
import { Transaction } from '../../domain/model/transaction.entity.js';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository.interface.js';
import type { TransactionDTO } from '../dtos/transaction.dto.js';
import { UseCase } from './base.use-case.js';

/**
 * UpdateTransactionRequest: Input for updating an existing transaction.
 */
interface UpdateTransactionRequest {
  userId: string;
  id: string;
  sourceBucket: BarefootBucket;
  destinationBucket: BarefootBucket | null | undefined;
  kind: 'income' | 'expense' | 'transfer';
  description: string;
  amountCents: number;
  occurredAt: Date;
  tags?: string[];
}

/**
 * UpdateTransactionUseCase: Update an existing transaction.
 * Validates transfer constraints: source !== destination.
 * Prevents changing kind to/from transfer without proper bucket configuration.
 * 
 * @extends BaseUseCase
 */
export class UpdateTransactionUseCase extends UseCase<
  UpdateTransactionRequest,
  TransactionDTO
> {
  constructor(private transactionRepository: TransactionRepository) {
    super();
  }

  async execute(request: UpdateTransactionRequest): Promise<TransactionDTO> {
    // Verify transaction exists
    const existing = await this.transactionRepository.findById(request.userId, request.id);
    if (!existing) {
      throw new Error(`Transaction ${request.id} not found`);
    }

    // Normalize destination bucket (null for non-transfers)
    const destinationBucket = request.kind === 'transfer' 
      ? (request.destinationBucket || null) 
      : null;

    // Create updated transaction with validation via constructor
    const updatedTransaction = new Transaction(
      request.id,
      request.sourceBucket,
      destinationBucket,
      request.kind,
      new Money(request.amountCents),
      request.description,
      request.occurredAt,
      request.tags || []
    );

    // Update in repository
    await this.transactionRepository.update(request.userId, updatedTransaction);

    // Return updated transaction as DTO
    return {
      id: updatedTransaction.id,
      bucket: updatedTransaction.sourceBucket,
      sourceBucket: updatedTransaction.sourceBucket,
      destinationBucket: updatedTransaction.destinationBucket,
      kind: updatedTransaction.kind,
      description: updatedTransaction.description,
      amountCents: updatedTransaction.amount.cents,
      occurredAt: updatedTransaction.occurredAt.toISOString(),
      tags: updatedTransaction.tags,
    };
  }
}

