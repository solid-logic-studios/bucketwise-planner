import { randomUUID } from 'crypto';
import type { BarefootBucket } from '../../domain/model/barefoot-bucket.js';
import type { FixedExpense } from '../../domain/model/budget-profile.entity.js';
import { BudgetProfile } from '../../domain/model/budget-profile.entity.js';
import { Money } from '../../domain/model/money.js';
import type { BudgetProfileRepository } from '../../domain/repositories/budget-profile.repository.interface.js';
import { UseCase } from './base.use-case.js';
import type { ProfileDTO } from './get-profile.use-case.js';

export interface UpsertProfileInput {
  userId: string;
  fortnightlyIncomeCents: number;
  defaultFireExtinguisherPercent: number;
  fixedExpenses: Array<{
    id: string | undefined;
    name: string;
    bucket: BarefootBucket;
    amountCents: number;
  }>;
  timezone?: string;
}

export class UpsertProfileUseCase extends UseCase<UpsertProfileInput, ProfileDTO> {
  constructor(private readonly repo: BudgetProfileRepository) {
    super();
  }

  async execute(input: UpsertProfileInput): Promise<ProfileDTO> {
    const fixedExpenses: FixedExpense[] = input.fixedExpenses.map((fx) => ({
      id: fx.id || randomUUID(),
      name: fx.name,
      bucket: fx.bucket,
      amount: new Money(fx.amountCents),
    }));

    const profile = new BudgetProfile(
      'profile',
      new Money(input.fortnightlyIncomeCents),
      Math.round(input.defaultFireExtinguisherPercent * 100),
      fixedExpenses,
      input.timezone || 'UTC'
    );

    await this.repo.saveProfile(input.userId, profile);

    return {
      fortnightlyIncomeCents: profile.fortnightlyIncome.cents,
      defaultFireExtinguisherPercent: profile.defaultFireExtinguisherBps / 100,
      defaultFireExtinguisherAmountCents: profile.defaultFireExtinguisherAmount.cents,
      fixedExpenses: profile.fixedExpenses.map((fx) => ({
        id: fx.id,
        name: fx.name,
        bucket: fx.bucket,
        amountCents: fx.amount.cents,
      })),
      timezone: profile.timezone,
    };
  }
}
