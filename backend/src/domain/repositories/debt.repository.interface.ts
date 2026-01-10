import type { Debt, DebtType } from '../model/debt.entity.js';
import type { Repository } from './repository.interface.js';

/**
 * DebtRepository: Repository interface for Debt aggregate persistence.
 * Extends generic Repository with debt-specific query methods.
 * Supports filtering by priority (for snowball ordering) and type (credit-card vs mortgage).
 * 
 * @extends Repository<Debt>
 * @example
 * ```typescript
 * const debtRepo: DebtRepository = new MemoryDebtRepository();
 * const creditCards = await debtRepo.findByType('credit-card');
 * const payoffOrder = await debtRepo.findByPriority(); // Returns sorted by priority
 * ```
 */
export interface DebtRepository extends Repository<Debt> {
    /**
     * Find all debts sorted by priority (ascending).
     * Lower priority pays first in Barefoot snowball method.
     * @returns Promise resolving to debts sorted by priority, then balance
     */
    findByPriority(userId: string): Promise<Debt[]>;

    /**
     * Find all debts of a specific type.
     * @param debtType - The type of debt to filter by
     * @returns Promise resolving to debts matching the type
     */
    findByType(userId: string, debtType: DebtType): Promise<Debt[]>;
}
