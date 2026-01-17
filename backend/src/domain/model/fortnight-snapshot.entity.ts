import { Allocation } from "./allocation.entity.js";
import type { BarefootBucket } from "./barefoot-bucket.js";
import { BaseEntity } from "./base.entity.js";
import { Money } from "./money.js";
import { Transaction } from "./transaction.entity.js";

/**
 * FortnightSnapshot: Entity representing a complete fortnight (2-week) budget period.
 * Captures all transactions and allocations for a specific period.
 * Provides methods to analyze spending and income for that period.
 * 
 * @example
 * ```typescript
 * const snapshot = new FortnightSnapshot(
 *   'fortnight-1',
 *   new Date('2026-01-01'),
 *   new Date('2026-01-14'),
 *   [allocations...],
 *   [transactions...]
 * );
 * 
 * const income = snapshot.totalIncome();
 * const dailyExpenses = snapshot.bucketSpend('Daily Expenses');
 * ```
 */
export class FortnightSnapshot extends BaseEntity {
    /**
     * Start date of this fortnight period
     */
    readonly periodStart: Date;

    /**
     * End date of this fortnight period
     */
    readonly periodEnd: Date;

    /**
     * Budget allocations for each bucket during this period
     */
    readonly allocations: Allocation[];

    /**
     * All transactions that occurred during this period
     */
    readonly transactions: Transaction[];

    constructor(
        id: string,
        periodStart: Date,
        periodEnd: Date,
        allocations: Allocation[],
        transactions: Transaction[],
    ) {
        super(id);
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.allocations = allocations;
        this.transactions = transactions;
    }

    /**
     * Calculate total income for this period.
     * @returns Money instance with sum of all income transactions
     */
    totalIncome(): Money {
        return this.transactions
            .filter(tx => tx.kind === 'income')
            .reduce((sum, tx) => sum.add(tx.amount), new Money(0));
    }

    /**
     * Calculate total expenses for this period.
     * @returns Money instance with sum of all expense transactions
     */
    totalExpenses(): Money {
        return this.transactions
            .filter(tx => tx.kind === 'expense')
            .reduce((sum, tx) => sum.add(tx.amount), new Money(0));
    }

    /**
     * Calculate total spending in a specific bucket.
     * Includes expenses from bucket and transfers out, minus transfers in.
     * @param bucket - The bucket to calculate net spending for
     * @returns Money instance with net spending in that bucket
     */
    bucketSpend(bucket: BarefootBucket): Money {
        const expenses = this.transactions
            .filter(tx => tx.sourceBucket === bucket && tx.kind === 'expense')
            .reduce((sum, tx) => sum.add(tx.amount), new Money(0));
        
        const transfersOut = this.transactions
            .filter(tx => tx.sourceBucket === bucket && tx.kind === 'transfer')
            .reduce((sum, tx) => sum.add(tx.amount), new Money(0));
        
        const transfersIn = this.transactions
            .filter(tx => tx.destinationBucket === bucket && tx.kind === 'transfer')
            .reduce((sum, tx) => sum.add(tx.amount), new Money(0));
        
        return expenses.add(transfersOut).subtract(transfersIn);
    }
}