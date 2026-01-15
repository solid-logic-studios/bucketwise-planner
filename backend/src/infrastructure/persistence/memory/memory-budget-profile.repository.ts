import { randomUUID } from 'crypto';
import { BudgetProfile } from '../../../domain/model/budget-profile.entity.js';
import { Money } from '../../../domain/model/money.js';
import type { BudgetProfileRepository } from '../../../domain/repositories/budget-profile.repository.interface.js';

const DEFAULT_ID = 'profile';

export class MemoryBudgetProfileRepository implements BudgetProfileRepository {
  private profiles: Map<string, BudgetProfile> = new Map();

  async getProfile(userId: string): Promise<BudgetProfile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async saveProfile(userId: string, profile: BudgetProfile): Promise<void> {
    this.profiles.set(
      userId,
      new BudgetProfile(
        profile.id || DEFAULT_ID,
        new Money(profile.fortnightlyIncome.cents),
        profile.defaultFireExtinguisherBps,
        profile.fixedExpenses.map((fx) => ({
          ...fx,
          id: fx.id || randomUUID(),
          amount: new Money(fx.amount.cents),
        })),
        profile.timezone || 'UTC',
        profile.createdAt,
        new Date()
      )
    );
  }
}
