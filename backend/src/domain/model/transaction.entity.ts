import { ValidationError } from "../exceptions/validation-error.js";
import { type BarefootBucket } from "./barefoot-bucket.js";
import { BaseEntity } from "./base.entity.js";
import { Money } from "./money.js";
import { type TransactionKind } from "./transaction.type.js";

/**
 * Transaction: Entity representing a single financial transaction.
 * Records income, expenses, or transfers within buckets.
 * 
 * For regular transactions (income/expense):
 *   - sourceBucket: the bucket affected by the transaction
 *   - destinationBucket: null (no destination)
 * 
 * For transfers:
 *   - sourceBucket: bucket money transfers FROM
 *   - destinationBucket: bucket money transfers TO
 *   - sourceBucket must NOT equal destinationBucket
 * 
 * @example
 * ```typescript
 * // Expense
 * const expense = new Transaction(
 *   'tx-1',
 *   'Daily Expenses',
 *   null,
 *   'expense',
 *   new Money(2500),
 *   'Groceries',
 *   new Date(),
 *   ['food', 'essentials']
 * );
 * 
 * // Transfer between buckets
 * const transfer = new Transaction(
 *   'tx-2',
 *   'Splurge',
 *   'Fire Extinguisher',
 *   'transfer',
 *   new Money(5000),
 *   'Reallocate to debt payoff',
 *   new Date(),
 *   []
 * );
 * ```
 */
export class Transaction extends BaseEntity {
    /**
     * Source bucket: the bucket the transaction originates from.
     * For income/expense, this is the primary bucket.
     * For transfers, this is the bucket being transferred FROM.
     */
    readonly sourceBucket: BarefootBucket;

    /**
     * Destination bucket (only for transfers).
     * Null for income/expense transactions.
     * For transfers, the bucket being transferred TO.
     * Must never equal sourceBucket.
     */
    readonly destinationBucket: BarefootBucket | null;

    /**
     * Type of transaction: income, expense, or transfer
     */
    readonly kind: TransactionKind;

    /**
     * The monetary amount (positive integer cents)
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
        sourceBucket: BarefootBucket,
        destinationBucket: BarefootBucket | null,
        kind: TransactionKind,
        amount: Money,
        description: string,
        occurredAt: Date,
        tags: string[] = []
    ) {
        super(id);
        this.validateDescription(description);
        this.validateBucketsForKind(sourceBucket, destinationBucket, kind);
        
        this.sourceBucket = sourceBucket;
        this.destinationBucket = destinationBucket;
        this.kind = kind;
        this.amount = amount;
        this.description = description;
        this.occurredAt = occurredAt;
        this.tags = tags;
    }

    /**
     * Check if this transaction is a transfer between buckets.
     * @returns true if kind is 'transfer' and destinationBucket is set
     */
    isTransfer(): boolean {
        return this.kind === 'transfer' && this.destinationBucket !== null;
    }

    /**
     * Get the primary bucket for this transaction.
     * For transfers, returns source bucket.
     * For income/expense, returns source bucket.
     * Provided for backward compatibility with code expecting single 'bucket' field.
     * @returns the source bucket
     */
    get bucket(): BarefootBucket {
        return this.sourceBucket;
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

    /**
     * Validate bucket configuration based on transaction kind.
     * @param sourceBucket - The source bucket
     * @param destinationBucket - The destination bucket (if transfer)
     * @param kind - The transaction kind
     * @throws ValidationError if configuration is invalid
     */
    private validateBucketsForKind(
        sourceBucket: BarefootBucket,
        destinationBucket: BarefootBucket | null,
        kind: TransactionKind
    ): void {
        if (kind === 'transfer') {
            // Transfers must have both buckets specified
            if (destinationBucket === null || destinationBucket === undefined) {
                throw new ValidationError(
                    'Transfer transaction must specify a destination bucket'
                );
            }
            // Buckets must be different
            if (sourceBucket === destinationBucket) {
                throw new ValidationError(
                    'Transfer source and destination buckets must be different'
                );
            }
        } else {
            // Non-transfer transactions must not have destination bucket
            if (destinationBucket !== null && destinationBucket !== undefined) {
                throw new ValidationError(
                    `${kind} transactions must not have a destination bucket`
                );
            }
        }
    }
}