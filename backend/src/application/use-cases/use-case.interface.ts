/**
 * IUseCase<TInput, TOutput>: Interface for all application use cases.
 * Use cases are the entry points for application logic, orchestrating domain and infrastructure.
 * They should be stateless and implement a single business operation.
 * 
 * @template TInput - The input type for this use case
 * @template TOutput - The output/result type for this use case
 * @example
 * ```typescript
 * export class RecordTransactionUseCase implements IUseCase<RecordTransactionInput, RecordTransactionOutput> {
 *   constructor(private txRepo: TransactionRepository) {}
 *   
 *   async execute(input: RecordTransactionInput): Promise<RecordTransactionOutput> {
 *     const tx = new Transaction(...);
 *     await this.txRepo.add(tx);
 *     return { success: true, id: tx.id };
 *   }
 * }
 * ```
 */
export interface IUseCase<TInput, TOutput> {
  /**
   * Execute the use case with the given input.
   * @param input - The input data for this use case
   * @returns Promise resolving to the output
   * @throws DomainError if a business rule is violated
   * @throws Error if an unexpected system error occurs
   */
  execute(input: TInput): Promise<TOutput>;
}
