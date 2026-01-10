import { ValidationError } from '../exceptions/validation-error.js';
import { BaseEntity } from './base.entity.js';
import { Money } from './money.js';

/**
 * SkippedDebtPayment: records an intentional skip of a scheduled debt payment
 * for a specific fortnight. Used for compliance reporting and timeline impacts.
 */
export class SkippedDebtPayment extends BaseEntity {
  readonly debtId: string;
  readonly fortnightId: string;
  readonly paymentDate: Date;
  readonly amount: Money;
  readonly skipReason: string | undefined;
  readonly skippedAt: Date;

  constructor(
    id: string,
    debtId: string,
    fortnightId: string,
    paymentDate: Date,
    amount: Money,
    skipReason?: string,
    skippedAt: Date = new Date()
  ) {
    super(id, skippedAt, skippedAt);

    this.ensureId(debtId, 'debtId');
    this.ensureId(fortnightId, 'fortnightId');
    this.ensureDate(paymentDate, 'paymentDate');
    this.ensureAmount(amount);
    this.ensureReasonLength(skipReason);

    this.debtId = debtId;
    this.fortnightId = fortnightId;
    this.paymentDate = paymentDate;
    this.amount = amount;
    const trimmedReason = skipReason?.trim();
    this.skipReason = trimmedReason || undefined;
    this.skippedAt = skippedAt;
  }

  private ensureId(value: string, field: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationError(`${field} is required`);
    }
  }

  private ensureDate(value: Date, field: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new ValidationError(`${field} must be a valid date`);
    }
  }

  private ensureAmount(amount: Money): void {
    if (amount.cents <= 0) {
      throw new ValidationError('Skipped payment amount must be greater than 0');
    }
  }

  private ensureReasonLength(reason?: string): void {
    if (reason && reason.length > 500) {
      throw new ValidationError('Skip reason cannot exceed 500 characters');
    }
  }
}
