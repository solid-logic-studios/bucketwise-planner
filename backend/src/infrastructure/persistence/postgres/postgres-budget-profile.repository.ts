import { randomUUID } from 'crypto';
import type { Pool } from 'pg';
import type { BarefootBucket } from '../../../domain/model/barefoot-bucket.js';
import { BudgetProfile, type FixedExpense } from '../../../domain/model/budget-profile.entity.js';
import { Money } from '../../../domain/model/money.js';
import type { BudgetProfileRepository } from '../../../domain/repositories/budget-profile.repository.interface.js';

const PROFILE_ID = 'profile';

type ProfileRow = {
  id: string;
  fortnightly_income_cents: number;
  default_fire_extinguisher_cents?: number;
  default_fire_extinguisher_bps?: number;
  fixed_expenses: Array<{
    id: string;
    name: string;
    bucket: BarefootBucket;
    amountCents: number;
  }>;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export class PostgresBudgetProfileRepository
  implements BudgetProfileRepository
{
  constructor(private readonly pool: Pool) {}

  async getProfile(userId: string): Promise<BudgetProfile | null> {
    const result = await this.pool.query<ProfileRow>(
      'SELECT * FROM budget_profiles WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    if (result.rowCount === 0 || !result.rows[0]) {
      return null;
    }
    return this.mapRow(result.rows[0]);
  }

  async saveProfile(userId: string, profile: BudgetProfile): Promise<void> {
    const fixedExpenses = profile.fixedExpenses.map((fx) => ({
      id: fx.id || randomUUID(),
      name: fx.name,
      bucket: fx.bucket,
      amountCents: fx.amount.cents,
    }));

    const query = `
      INSERT INTO budget_profiles (
        id, user_id, fortnightly_income_cents, default_fire_extinguisher_cents, default_fire_extinguisher_bps, fixed_expenses, timezone, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        fortnightly_income_cents = EXCLUDED.fortnightly_income_cents,
        default_fire_extinguisher_cents = EXCLUDED.default_fire_extinguisher_cents,
        default_fire_extinguisher_bps = EXCLUDED.default_fire_extinguisher_bps,
        fixed_expenses = EXCLUDED.fixed_expenses,
        timezone = EXCLUDED.timezone,
        updated_at = NOW();
    `;

    await this.pool.query(query, [
      PROFILE_ID,
      userId,
      profile.fortnightlyIncome.cents,
      profile.defaultFireExtinguisherAmount.cents,
      profile.defaultFireExtinguisherBps,
      JSON.stringify(fixedExpenses),
      profile.timezone,
    ]);
  }

  private mapRow(row: ProfileRow): BudgetProfile {
    const fixedExpenses: FixedExpense[] = (row.fixed_expenses ?? []).map((fx) => ({
      id: fx.id || randomUUID(),
      name: fx.name,
      bucket: fx.bucket,
      amount: new Money(Number(fx.amountCents)),
    }));

    return new BudgetProfile(
      row.id,
      new Money(Number(row.fortnightly_income_cents)),
      this.resolveBps(row),
      fixedExpenses,
      row.timezone || 'UTC',
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  private resolveBps(row: ProfileRow): number {
    if (row.default_fire_extinguisher_bps !== undefined && row.default_fire_extinguisher_bps !== null) {
      return Number(row.default_fire_extinguisher_bps);
    }

    const income = Number(row.fortnightly_income_cents);
    if (!income || income <= 0 || row.default_fire_extinguisher_cents === undefined) {
      return 0;
    }

    return Math.round((Number(row.default_fire_extinguisher_cents) / income) * 10000);
  }
}
