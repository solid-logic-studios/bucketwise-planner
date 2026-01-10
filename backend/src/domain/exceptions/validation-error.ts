import { DomainError } from './domain-error.js';

/**
 * ValidationError: Thrown when a domain rule constraint is violated.
 * Used for input validation, boundary checking, and invariant violations.
 * 
 * @example
 * ```typescript
 * if (percentage < 0 || percentage > 1) {
 *   throw new ValidationError('Percentage must be between 0 and 1');
 * }
 * ```
 */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
