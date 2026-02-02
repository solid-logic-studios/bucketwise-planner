import type { Pool } from 'pg';
import { Debt, type DebtType, type PaymentFrequency } from '../../../domain/model/debt.entity.js';
import { Money } from '../../../domain/model/money.js';
import type { DebtRepository } from '../../../domain/repositories/debt.repository.interface.js';

type DebtRow = {
  id: string;
  name: string;
  debt_type: string;
  original_amount_cents: number;
  current_balance_cents: number;
  interest_rate: number | string;
  minimum_payment_cents: number;
  min_payment_frequency: string;
  priority: number;
};

function parseInterestRate(value: number | string): number {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePaymentFrequency(value: string): PaymentFrequency {
  return value === 'MONTHLY' ? 'MONTHLY' : 'FORTNIGHTLY';
}

/**
 * PostgresDebtRepository: PostgreSQL implementation of DebtRepository.
 * Stores debts in a relational table with proper indexing on priority.
 * Serializes Money objects to integer cents for storage.
 * 
 * @implements DebtRepository
 * @example
 * ```typescript
 * const pool = createPgPool();
 * const repo = new PostgresDebtRepository(pool);
 * await repo.save(visa);
 * const ordered = await repo.findByPriority();
 * ```
 */
export class PostgresDebtRepository implements DebtRepository {
    constructor(private pool: Pool) {}

    /**
     * Add a new debt (insert only).
     * @param debt - The debt entity to persist
     */
    async add(userId: string, debt: Debt): Promise<void> {
        const query = `
            INSERT INTO debts (
                id, user_id, name, debt_type, original_amount_cents, 
                current_balance_cents, interest_rate, 
                minimum_payment_cents, min_payment_frequency, priority, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `;

        await this.pool.query(query, [
            debt.id,
            userId,
            debt.name,
            debt.debtType,
            debt.originalAmount.cents,
            debt.currentBalance.cents,
            debt.interestRate,
            debt.minimumPayment.cents,
            debt.minPaymentFrequency,
            debt.priority,
        ]);
    }

    /**
     * Update an existing debt.
     * @param debt - The debt entity to update
     */
    async update(userId: string, debt: Debt): Promise<void> {
        const query = `
            UPDATE debts SET
                name = $3,
                debt_type = $4,
                original_amount_cents = $5,
                current_balance_cents = $6,
                interest_rate = $7,
                minimum_payment_cents = $8,
                min_payment_frequency = $9,
                priority = $10,
                updated_at = NOW()
            WHERE id = $1 AND user_id = $2
        `;

        await this.pool.query(query, [
            debt.id,
            userId,
            debt.name,
            debt.debtType,
            debt.originalAmount.cents,
            debt.currentBalance.cents,
            debt.interestRate,
            debt.minimumPayment.cents,
            debt.minPaymentFrequency,
            debt.priority,
        ]);
    }

    /**
     * Find a debt by its ID.
     * @param id - The debt ID
     * @returns Promise resolving to debt or null if not found
     */
    async findById(userId: string, id: string): Promise<Debt | null> {
        const query = 'SELECT * FROM debts WHERE id = $1 AND user_id = $2';
        const result = await this.pool.query(query, [id, userId]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRowToDebt(result.rows[0]);
    }

    /**
     * Get all debts.
     * @returns Promise resolving to array of all debts
     */
    async getAll(userId: string): Promise<Debt[]> {
        const query = 'SELECT * FROM debts WHERE user_id = $1 ORDER BY priority ASC, current_balance_cents ASC';
        const result = await this.pool.query(query, [userId]);
        return result.rows.map(row => this.mapRowToDebt(row));
    }

    /**
     * Delete a debt by ID.
     * @param id - The debt ID to delete
     */
    async delete(userId: string, id: string): Promise<void> {
        const query = 'DELETE FROM debts WHERE id = $1 AND user_id = $2';
        await this.pool.query(query, [id, userId]);
    }

    /**
     * Find all debts sorted by priority ascending, then balance ascending.
     * Supports Barefoot snowball: lowest priority pays first, smallest balance within priority.
     * @returns Promise resolving to debts sorted by priority, then balance
     */
    async findByPriority(userId: string): Promise<Debt[]> {
        const query = `
            SELECT * FROM debts 
            WHERE user_id = $1
            ORDER BY priority ASC, current_balance_cents ASC
        `;
        const result = await this.pool.query(query, [userId]);
        return result.rows.map(row => this.mapRowToDebt(row));
    }

    /**
     * Find all debts of a specific type.
     * @param debtType - The type of debt to filter by
     * @returns Promise resolving to debts matching the type
     */
    async findByType(userId: string, debtType: DebtType): Promise<Debt[]> {
        const query = `
            SELECT * FROM debts 
            WHERE user_id = $1 AND debt_type = $2
            ORDER BY priority ASC, current_balance_cents ASC
        `;
        const result = await this.pool.query(query, [userId, debtType]);
        return result.rows.map(row => this.mapRowToDebt(row));
    }

    /**
     * Map a database row to a Debt entity.
     * Deserializes Money from cents and reconstructs the entity.
     * @param row - The database row
     * @returns Debt entity
     */
    private mapRowToDebt(row: DebtRow): Debt {
        return new Debt(
            row.id,
            row.name,
            row.debt_type as DebtType,
            new Money(row.original_amount_cents),
            new Money(row.current_balance_cents),
            parseInterestRate(row.interest_rate),
            new Money(row.minimum_payment_cents),
            parsePaymentFrequency(row.min_payment_frequency),
            row.priority
        );
    }
}
