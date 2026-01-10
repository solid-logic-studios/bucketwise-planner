import type { BudgetProfile } from '../model/budget-profile.entity.js';

export interface BudgetProfileRepository {
  getProfile(userId: string): Promise<BudgetProfile | null>;
  saveProfile(userId: string, profile: BudgetProfile): Promise<void>;
}
