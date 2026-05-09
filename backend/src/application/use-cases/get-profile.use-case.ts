import type { BudgetProfile } from '../../domain/model/budget-profile.entity.js';
import { DEFAULT_CURRENCY_CODE, type CurrencyCode } from '../../domain/model/currency-code.js';
import type { BudgetProfileRepository } from '../../domain/repositories/budget-profile.repository.interface.js';
import { UseCase } from './base.use-case.js';

export interface FixedExpenseDTO {
  id: string;
  name: string;
  bucket: string;
  amountCents: number;
}

export interface ProfileDTO {
  fortnightlyIncomeCents: number;
  defaultFireExtinguisherPercent: number;
  defaultFireExtinguisherAmountCents: number;
  fixedExpenses: FixedExpenseDTO[];
  timezone: string;
  currencyCode: CurrencyCode;
}

const DEFAULT_PROFILE: ProfileDTO = {
  fortnightlyIncomeCents: 0,
  defaultFireExtinguisherPercent: 0,
  defaultFireExtinguisherAmountCents: 0,
  fixedExpenses: [],
  timezone: 'UTC',
  currencyCode: DEFAULT_CURRENCY_CODE,
};

export interface GetProfileRequest {
  userId: string;
}

export class GetProfileUseCase extends UseCase<GetProfileRequest, ProfileDTO> {
  constructor(private readonly repo: BudgetProfileRepository) {
    super();
  }

  async execute(request: GetProfileRequest): Promise<ProfileDTO> {
    const profile = await this.repo.getProfile(request.userId);
    if (!profile) {
      return DEFAULT_PROFILE;
    }
    return this.mapProfile(profile);
  }

  private mapProfile(profile: BudgetProfile): ProfileDTO {
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
      currencyCode: profile.currencyCode,
    };
  }
}
