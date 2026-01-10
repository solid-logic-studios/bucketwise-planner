/**
 * IValueObject<T>: Interface for immutable value objects.
 * Value objects are identified by their content (values), not their identity.
 * They should be immutable and comparable.
 * 
 * @template T - The type of the value object itself
 * @example
 * ```typescript
 * export class Money implements IValueObject<Money> {
 *   constructor(readonly cents: number) {}
 *   
 *   equals(other: Money): boolean {
 *     return this.cents === other.cents;
 *   }
 *   
 *   toString(): string {
 *     return `$${(this.cents / 100).toFixed(2)}`;
 *   }
 * }
 * ```
 */
export interface IValueObject<T> {
  /**
   * Check equality with another value object of the same type.
   * Two value objects are equal if their values are equal.
   */
  equals(other: T): boolean;

  /**
   * Convert to string representation for display/logging.
   */
  toString(): string;
}
