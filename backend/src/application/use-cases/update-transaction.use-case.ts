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
  bucket: string;
  kind: 'income' | 'expense' | 'transfer';
  description: string;
  amountCents: number;
  occurredAt: Date;
  tags?: string[];
}

/**
 * UpdateTransactionUseCase: Update an existing transaction.
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

    // Create updated transaction
    const updatedTransaction = new Transaction(
      request.id,
      request.bucket as any,
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
      bucket: updatedTransaction.bucket,
      kind: updatedTransaction.kind,
      description: updatedTransaction.description,
      amountCents: updatedTransaction.amount.cents,
      occurredAt: updatedTransaction.occurredAt.toISOString(),
      tags: updatedTransaction.tags,
    };
  }
}
