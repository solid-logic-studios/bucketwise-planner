import { ValidationError } from '../../domain/exceptions/validation-error.js';
import type { BarefootBucket } from '../../domain/model/barefoot-bucket.js';
import { Debt } from '../../domain/model/debt.entity.js';
import { Money } from '../../domain/model/money.js';
import { Transaction } from '../../domain/model/transaction.entity.js';
import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository.interface.js';
import { UseCase } from './base.use-case.js';

/**
 * RecordTransactionInput: Input data for recording a new transaction.
 * Represents the command to create a financial transaction record.
 */
interface RecordTransactionInput {
  /** User ID */
  userId: string;
  /** The bucket this transaction belongs to */
  bucket: BarefootBucket;
  /** Type of transaction */
  kind: 'income' | 'expense' | 'transfer';
  /** Description of what the transaction is for */
  description: string;
  /** Amount in cents (integer, no floating point) */
  amountCents: number;
  /** When the transaction occurred */
  occurredAt: Date;
  /** Optional tags for categorization */
  tags: string[] | undefined;
  /** Optional debt to apply payment against */
  debtId: string | undefined;
}

/**
 * RecordTransactionOutput: Result of successfully recording a transaction.
 */
interface RecordTransactionOutput {
  /** ID of the newly created transaction */
  transactionId: string;
  /** Whether the operation succeeded */
  success: boolean;
}

/**
 * RecordTransactionUseCase: Use case for recording income and expense transactions.
 * Validates input, creates a Transaction entity, and persists it.
 * Part of the Barefoot Investor budget tracking system.
 * 
 * @extends {UseCase<RecordTransactionInput, RecordTransactionOutput>}
 * @example
 * ```typescript
 * const useCase = new RecordTransactionUseCase(txRepository);
 * const result = await useCase.execute({
 *   bucket: 'Daily Expenses',
 *   kind: 'expense',
 *   description: 'Groceries',
 *   amountCents: 5000,
 *   occurredAt: new Date(),
 *   tags: ['food']
 * });
 * ```
 */

export class RecordTransactionUseCase extends UseCase<
  RecordTransactionInput,
  RecordTransactionOutput
> {
  /**
   * Initialize with repository dependency.
   * @param transactionRepository - Repository for persisting transactions
   * @param debtRepository - Repository for adjusting debt balances when applicable
   */
  constructor(
    private transactionRepository: TransactionRepository,
    private debtRepository: DebtRepository
  ) {
    super();
  }

  /**
   * Execute the use case: create and record a transaction.
   * @param input - The transaction data
   * @returns Promise with transaction ID and success status
   * @throws ValidationError if input violates domain rules
   */
  async execute(input: RecordTransactionInput): Promise<RecordTransactionOutput> {
    // Generate ID (in real app, use UUID or DB sequence)
    const id = crypto.randomUUID();

    const money = new Money(input.amountCents);
    const transaction = new Transaction(
      id,
      input.bucket,
      input.kind,
      money,
      input.description,
      input.occurredAt,
      input.tags
    );

    await this.transactionRepository.add(input.userId, transaction);

    // Optionally apply payment to a specific debt
    if (input.debtId) {
      const debt = await this.debtRepository.findById(input.userId, input.debtId);
      if (!debt) {
        throw new ValidationError('Debt not found for provided debtId');
      }

      const newBalanceCents = Math.max(0, debt.currentBalance.cents - input.amountCents);
      const updatedDebt = new Debt(
        debt.id,
        debt.name,
        debt.debtType,
        debt.originalAmount,
        new Money(newBalanceCents),
        debt.interestRate,
        debt.minimumPayment,
        debt.minPaymentFrequency,
        debt.priority
      );

      await this.debtRepository.update(input.userId, updatedDebt);
    }

    return {
      transactionId: id,
      success: true,
    };
  }
}
