/**
 * DomainError: Base abstract error class for all domain-level exceptions.
 * Domain errors represent violations of business rules and invariants.
 * These are expected errors that can occur during normal operation.
 * 
 * @abstract
 * @example
 * ```typescript
 * class InsufficientFundsError extends DomainError {
 *   constructor(available: Money, requested: Money) {
 *     super(`Cannot transfer ${requested.cents} cents. Only ${available.cents} available.`);
 *   }
 * }
 * ```
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}
