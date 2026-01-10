import type { TransactionRepository } from '../../domain/repositories/transaction.repository.interface.js';
import { UseCase } from './base.use-case.js';

/**
 * DeleteTransactionRequest: Input for deleting a transaction.
 */
interface DeleteTransactionRequest {
  userId: string;
  id: string;
}

/**
 * DeleteTransactionUseCase: Delete an existing transaction.
 * 
 * @extends BaseUseCase
 */
export class DeleteTransactionUseCase extends UseCase<
  DeleteTransactionRequest,
  { success: boolean }
> {
  constructor(private transactionRepository: TransactionRepository) {
    super();
  }

  async execute(request: DeleteTransactionRequest): Promise<{ success: boolean }> {
    // Verify transaction exists
    const existing = await this.transactionRepository.findById(request.userId, request.id);
    if (!existing) {
      throw new Error(`Transaction ${request.id} not found`);
    }

    // Delete from repository
    await this.transactionRepository.delete(request.userId, request.id);

    return { success: true };
  }
}
