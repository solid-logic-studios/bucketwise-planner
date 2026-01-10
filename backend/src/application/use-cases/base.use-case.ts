import type { IUseCase } from './use-case.interface.js';

/**
 * UseCase<TInput, TOutput>: Abstract base class for all use cases.
 * Provides a common template for application-level orchestration.
 * Extends IUseCase interface to ensure all implementations follow contract.
 * 
 * @abstract
 * @implements {IUseCase<TInput, TOutput>}
 * @template TInput - Input type parameter
 * @template TOutput - Output type parameter
 * @example
 * ```typescript
 * export class MyUseCase extends UseCase<MyInput, MyOutput> {
 *   async execute(input: MyInput): Promise<MyOutput> {
 *     // Implementation here
 *   }
 * }
 * ```
 */
export abstract class UseCase<TInput, TOutput>
  implements IUseCase<TInput, TOutput>
{
  /**
   * Execute the use case with given input.
   * Must be implemented by subclasses.
   * @param input - The input for this use case
   * @returns Promise with the output
   */
  abstract execute(input: TInput): Promise<TOutput>;
}
