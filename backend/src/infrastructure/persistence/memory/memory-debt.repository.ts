import { Debt, type DebtType } from '../../../domain/model/debt.entity.js';
import type { DebtRepository } from '../../../domain/repositories/debt.repository.interface.js';
import { InMemoryRepository } from './in-memory.repository.js';

/**
 * MemoryDebtRepository: In-memory implementation of DebtRepository.
 * Extends generic InMemoryRepository with debt-specific query methods.
 * Useful for testing and local development without database dependency.
 * 
 * @extends InMemoryRepository<Debt>
 * @implements DebtRepository
 * @example
 * ```typescript
 * const repo = new MemoryDebtRepository();
 * await repo.save(visa);
 * const ordered = await repo.findByPriority(); // Returns debts by priority
 * ```
 */
export class MemoryDebtRepository 
    extends InMemoryRepository<Debt> 
    implements DebtRepository 
{
    /**
     * Find all debts sorted by priority ascending, then by balance ascending.
     * This ordering supports Barefoot snowball method: lowest priority (credit cards)
     * pay first, and within same priority, smallest balance pays first.
     * @returns Promise resolving to debts sorted by priority, then balance
     */
    async findByPriority(userId: string): Promise<Debt[]> {
        const all = await this.getAll(userId);
        
        return all.sort((a: Debt, b: Debt) => {
            // Sort by priority first (ascending)
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            // Within same priority, sort by balance (ascending - smallest first)
            return a.currentBalance.cents - b.currentBalance.cents;
        });
    }

    /**
     * Find all debts of a specific type.
     * @param debtType - The type of debt to filter by
     * @returns Promise resolving to debts matching the type
     */
    async findByType(userId: string, debtType: DebtType): Promise<Debt[]> {
        const all = await this.getAll(userId);
        return all.filter((debt: Debt) => debt.debtType === debtType);
    }
}
