import { ValidationError } from "../exceptions/validation-error.js";
import { type BarefootBucket } from "./barefoot-bucket.js";
import { BaseEntity } from "./base.entity.js";
import { Money } from "./money.js";
import { type TransactionKind } from "./transaction.type.js";

/**
 * Transaction: Entity representing a single financial transaction.
 * Records income, expenses, or transfers within a specific bucket.
 * 
 * @example
 * ```typescript
 * const expense = new Transaction(
 *   'tx-1',
 *   'Daily Expenses',
 *   'expense',
 *   new Money(2500),
 *   'Groceries',
 *   new Date(),
 *   ['food', 'essentials']
 * );
 * ```
 */
export class Transaction extends BaseEntity {
    /**
     * The bucket this transaction belongs to
     */
    readonly bucket: BarefootBucket;

    /**
     * Type of transaction: income, expense, or transfer
     */
    readonly kind: TransactionKind;

    /**
     * The monetary amount (positive for income, negative for expense)
     */
    readonly amount: Money;

    /**
     * Human-readable description of the transaction
     */
    readonly description: string;

    /**
     * Date when transaction occurred
     */
    readonly occurredAt: Date;

    /**
     * Optional tags for categorization and searching
     */
    readonly tags: string[];

    constructor(
        id: string,
        bucket: BarefootBucket,
        kind: TransactionKind,
        amount: Money,
        description: string,
        occurredAt: Date,
        tags: string[] = []
    ) {
        super(id);
        this.validateDescription(description);
        
        this.bucket = bucket;
        this.kind = kind;
        this.amount = amount;
        this.description = description;
        this.occurredAt = occurredAt;
        this.tags = tags;
    }

    /**
     * Validate that description is not empty.
     * @param description - The description to validate
     * @throws ValidationError if description is empty
     */
    private validateDescription(description: string): void {
        if (!description || description.trim().length === 0) {
            throw new ValidationError('Transaction description cannot be empty');
        }
    }
}