import { ValidationError } from '../exceptions/validation-error.js';
import { BaseEntity } from './base.entity.js';
import type { Money } from './money.js';

/**
 * DebtType: Enumeration of supported debt types.
 * Different types have different interest rate validations and priorities.
 */
export type DebtType = 'credit-card' | 'mortgage';

/**
 * PaymentFrequency: How often minimum payments are made.
 */
export type PaymentFrequency = 'FORTNIGHTLY' | 'MONTHLY';

/**
 * Debt: Entity representing a financial debt obligation.
 * Tracks balance, interest rate, minimum payment, and priority for payoff strategy.
 * Supports Barefoot snowball debt elimination method.
 * 
 * @example
 * ```typescript
 * const visa = new Debt(
 *   'debt-1',
 *   'Visa Credit Card',
 *   'credit-card',
 *   new Money(500000), // $5000 original
 *   new Money(450000), // $4500 current
 *   0.1999, // 19.99% APR
 *   new Money(10000), // $100 minimum
 *   1 // priority (lower = pays first)
 * );
 * ```
 */
export class Debt extends BaseEntity {
    /**
     * Human-readable name for this debt (e.g., "Visa Card", "Home Mortgage")
     */
    readonly name: string;

    /**
     * Type of debt (determines validation rules)
     */
    readonly debtType: DebtType;

    /**
     * Original debt amount when first incurred
     */
    readonly originalAmount: Money;

    /**
     * Current outstanding balance
     */
    readonly currentBalance: Money;

    /**
     * Annual interest rate (as decimal, e.g., 0.1999 for 19.99%)
     */
    readonly interestRate: number;

    /**
     * Minimum payment required (amount per frequency period)
     */
    readonly minimumPayment: Money;

    /**
     * Frequency of minimum payment (FORTNIGHTLY or MONTHLY)
     */
    readonly minPaymentFrequency: PaymentFrequency;

    /**
     * Priority for payoff (lower number = pays first in snowball method)
     * Credit cards default to 1, mortgages default to 10
     */
    readonly priority: number;

    constructor(
        id: string,
        name: string,
        debtType: DebtType,
        originalAmount: Money,
        currentBalance: Money,
        interestRate: number,
        minimumPayment: Money,
        minPaymentFrequency: PaymentFrequency,
        priority: number
    ) {
        super(id);
        this.validateName(name);
        this.validateInterestRate(interestRate, debtType);
        this.validatePriority(priority, debtType);
        this.validateBalances(originalAmount, currentBalance);

        this.name = name;
        this.debtType = debtType;
        this.originalAmount = originalAmount;
        this.currentBalance = currentBalance;
        this.interestRate = interestRate;
        this.minimumPayment = minimumPayment;
        this.minPaymentFrequency = minPaymentFrequency;
        this.priority = priority;
    }

    /**
     * Get the remaining balance on this debt.
     * Alias for currentBalance for semantic clarity.
     * @returns Current outstanding balance
     */
    remainingBalance(): Money {
        return this.currentBalance;
    }

    /**
     * Validate debt name is not empty.
     * @param name - The name to validate
     * @throws ValidationError if name is empty
     */
    private validateName(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new ValidationError('Debt name cannot be empty');
        }
    }

    /**
     * Validate interest rate is within acceptable range for debt type.
     * Credit cards: 0-36% (some store cards can be very high)
     * Mortgages: 0-10% (typical residential mortgage range)
     * @param rate - The interest rate to validate (as decimal)
     * @param debtType - The type of debt
     * @throws ValidationError if rate is outside acceptable range
     */
    private validateInterestRate(rate: number, debtType: DebtType): void {
        if (rate < 0) {
            throw new ValidationError('Interest rate cannot be negative');
        }

        if (debtType === 'credit-card' && rate > 0.36) {
            throw new ValidationError('Credit card interest rate cannot exceed 36%');
        }

        if (debtType === 'mortgage' && rate > 0.10) {
            throw new ValidationError('Mortgage interest rate cannot exceed 10%');
        }
    }

    /**
     * Validate priority is appropriate for debt type.
     * Mortgages must have priority >= 5 (to ensure credit cards pay first in Barefoot method).
     * @param priority - The priority to validate
     * @param debtType - The type of debt
     * @throws ValidationError if priority is invalid
     */
    private validatePriority(priority: number, debtType: DebtType): void {
        if (priority < 0) {
            throw new ValidationError('Priority cannot be negative');
        }

        if (debtType === 'mortgage' && priority < 5) {
            throw new ValidationError(
                'Mortgage priority must be >= 5 to ensure credit cards are paid first (Barefoot method)'
            );
        }
    }

    /**
     * Validate that current balance does not exceed original amount.
     * @param originalAmount - The original debt amount
     * @param currentBalance - The current balance
     * @throws ValidationError if current exceeds original
     */
    private validateBalances(originalAmount: Money, currentBalance: Money): void {
        if (currentBalance.cents > originalAmount.cents) {
            throw new ValidationError(
                'Current balance cannot exceed original debt amount'
            );
        }

        if (currentBalance.cents < 0) {
            throw new ValidationError('Current balance cannot be negative');
        }
    }
}
