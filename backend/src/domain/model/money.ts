import { ValidationError } from '../exceptions/validation-error.js';
import type { IValueObject } from '../value-objects/value-object.interface.js';

/**
 * Money: Immutable value object representing monetary amounts in cents.
 * Prevents floating-point arithmetic issues by always working with integer cents.
 * Implements IValueObject for value-based equality.
 * 
 * @implements {IValueObject<Money>}
 * @example
 * ```typescript
 * const amount = new Money(5000); // 50.00 AUD
 * const increased = amount.add(new Money(1000)); // 60.00 AUD
 * const doubled = amount.multiply(2); // 100.00 AUD
 * ```
 */
export class Money implements IValueObject<Money> {
  readonly cents: number;
  readonly currency: string;

  constructor(cents: number, currency = 'AUD') {
    if (!Number.isInteger(cents)) {
      throw new ValidationError('Money expects an integer number of cents');
    }
    this.cents = cents;
    this.currency = currency;
  }

  /**
   * Add another Money amount to this one.
   * @param other - The Money to add
   * @returns New Money instance with sum
   */
  add(other: Money): Money {
    this.validateCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  /**
   * Negate this Money amount (change sign).
   * @returns New Money instance with opposite sign
   */
  negate(): Money {
    return new Money(-this.cents, this.currency);
  }

  /**
   * Subtract another Money amount from this one.
   * @param other - The Money to subtract
   * @returns New Money instance with difference
   */
  subtract(other: Money): Money {
    this.validateCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }

  /**
   * Multiply this Money by a factor.
   * @param factor - The multiplication factor
   * @returns New Money instance with product
   * @throws ValidationError if factor results in non-integer cents
   */
  multiply(factor: number): Money {
    if (!Number.isInteger(factor * 100)) {
      throw new ValidationError(
        'Multiplication factor must result in integer cents'
      );
    }
    return new Money(Math.floor(this.cents * factor), this.currency);
  }

  /**
   * Divide this Money by a divisor.
   * @param divisor - The divisor
   * @returns New Money instance with quotient (rounded down)
   * @throws ValidationError if divisor is zero
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new ValidationError('Cannot divide by zero');
    }
    return new Money(Math.floor(this.cents / divisor), this.currency);
  }

  /**
   * Check if this Money is equal to another (value-based comparison).
   * @param other - The Money to compare with
   * @returns true if amounts and currencies are equal
   */
  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }

  /**
   * Check if this Money is greater than another.
   * @param other - The Money to compare with
   * @returns true if this amount is greater
   */
  isGreaterThan(other: Money): boolean {
    this.validateCurrency(other);
    return this.cents > other.cents;
  }

  /**
   * Check if this Money is less than another.
   * @param other - The Money to compare with
   * @returns true if this amount is less
   */
  isLessThan(other: Money): boolean {
    this.validateCurrency(other);
    return this.cents < other.cents;
  }

  /**
   * Check if this Money is greater than or equal to another.
   * @param other - The Money to compare with
   * @returns true if this amount is greater or equal
   */
  isGreaterThanOrEqual(other: Money): boolean {
    return this.isGreaterThan(other) || this.equals(other);
  }

  /**
   * Check if this Money is less than or equal to another.
   * @param other - The Money to compare with
   * @returns true if this amount is less or equal
   */
  isLessThanOrEqual(other: Money): boolean {
    return this.isLessThan(other) || this.equals(other);
  }

  /**
   * Get human-readable string representation.
   * @returns Formatted currency string (e.g., "$50.00")
   */
  toString(): string {
    const dollars = Math.abs(this.cents) / 100;
    const sign = this.cents < 0 ? '-' : '';
    return `${sign}$${dollars.toFixed(2)} ${this.currency}`;
  }

  /**
   * Validate that another Money instance uses the same currency.
   * @param other - The Money to validate
   * @throws ValidationError if currencies don't match
   */
  private validateCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new ValidationError(
        `Cannot operate on different currencies: ${this.currency} vs ${other.currency}`
      );
    }
  }
}