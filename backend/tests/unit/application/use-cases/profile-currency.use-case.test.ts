import { describe, expect, it } from 'vitest';
import { upsertProfileSchema } from '../../../../src/application/dtos/schemas/profile.schema.js';
import { GetProfileUseCase } from '../../../../src/application/use-cases/get-profile.use-case.js';
import { UpsertProfileUseCase } from '../../../../src/application/use-cases/upsert-profile.use-case.js';
import { MemoryBudgetProfileRepository } from '../../../../src/infrastructure/persistence/memory/memory-budget-profile.repository.js';

describe('Profile currency support', () => {
  it('returns AUD as default currency when no profile exists', async () => {
    const repo = new MemoryBudgetProfileRepository();
    const useCase = new GetProfileUseCase(repo);

    const profile = await useCase.execute({ userId: 'user-1' });

    expect(profile.currencyCode).toBe('AUD');
  });

  it('persists and returns configured currency code', async () => {
    const repo = new MemoryBudgetProfileRepository();
    const upsertUseCase = new UpsertProfileUseCase(repo);
    const getUseCase = new GetProfileUseCase(repo);

    await upsertUseCase.execute({
      userId: 'user-1',
      fortnightlyIncomeCents: 250000,
      defaultFireExtinguisherPercent: 20,
      fixedExpenses: [],
      timezone: 'UTC',
      currencyCode: 'USD',
    });

    const profile = await getUseCase.execute({ userId: 'user-1' });
    expect(profile.currencyCode).toBe('USD');
  });

  it('validates allowed profile currency codes', () => {
    expect(
      upsertProfileSchema.parse({
        fortnightlyIncomeCents: 100000,
        defaultFireExtinguisherPercent: 10,
        fixedExpenses: [],
        currencyCode: 'NZD',
      }).currencyCode
    ).toBe('NZD');

    expect(() =>
      upsertProfileSchema.parse({
        fortnightlyIncomeCents: 100000,
        defaultFireExtinguisherPercent: 10,
        fixedExpenses: [],
        currencyCode: 'EUR',
      })
    ).toThrow();
  });
});
