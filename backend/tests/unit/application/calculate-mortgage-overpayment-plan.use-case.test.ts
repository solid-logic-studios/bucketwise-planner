import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateMortgageOverpaymentPlanUseCase } from '../../../src/application/use-cases/calculate-mortgage-overpayment-plan.use-case.js';
import { Debt } from '../../../src/domain/model/debt.entity.js';
import { Money } from '../../../src/domain/model/money.js';
import type { DebtRepository } from '../../../src/domain/repositories/debt.repository.interface.js';

/**
 * Mock DebtRepository for testing
 */
class MockDebtRepository implements DebtRepository {
  private debts: Map<string, Debt[]> = new Map();

  async add(_userId: string, debt: Debt): Promise<void> {
    const userDebts = this.debts.get(_userId) || [];
    userDebts.push(debt);
    this.debts.set(_userId, userDebts);
  }

  async update(_userId: string, debt: Debt): Promise<void> {
    const userDebts = this.debts.get(_userId) || [];
    const idx = userDebts.findIndex(d => d.id === debt.id);
    if (idx >= 0) userDebts[idx] = debt;
  }

  async findById(_userId: string, id: string): Promise<Debt | null> {
    const userDebts = this.debts.get(_userId) || [];
    return userDebts.find(d => d.id === id) || null;
  }

  async getAll(_userId: string): Promise<Debt[]> {
    return this.debts.get(_userId) || [];
  }

  async delete(_userId: string, id: string): Promise<void> {
    const userDebts = this.debts.get(_userId) || [];
    const idx = userDebts.findIndex(d => d.id === id);
    if (idx >= 0) userDebts.splice(idx, 1);
  }

  async findByPriority(_userId: string): Promise<Debt[]> {
    const userDebts = this.debts.get(_userId) || [];
    return [...userDebts].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.currentBalance.cents - b.currentBalance.cents;
    });
  }

  async findByType(_userId: string, debtType: 'credit-card' | 'mortgage'): Promise<Debt[]> {
    const userDebts = this.debts.get(_userId) || [];
    return userDebts.filter(d => d.debtType === debtType);
  }

  setUserDebts(_userId: string, debts: Debt[]): void {
    this.debts.set(_userId, debts);
  }
}

describe('CalculateMortgageOverpaymentPlanUseCase', () => {
  let repo: MockDebtRepository;
  let useCase: CalculateMortgageOverpaymentPlanUseCase;
  const userId = 'test-user';

  beforeEach(() => {
    repo = new MockDebtRepository();
    useCase = new CalculateMortgageOverpaymentPlanUseCase(repo);
  });

  it('should return empty plan if no mortgage exists', async () => {
    const result = await useCase.execute({ userId, fortnightlyFeCents: 92000 });
    expect(result.baseline).toEqual([]);
    expect(result.withFe).toEqual([]);
    expect(result.payoffDateBaselineISO).toBeNull();
    expect(result.payoffDateWithFeISO).toBeNull();
    expect(result.timeSavedFortnights).toBe(0);
    expect(result.interestSavedCents).toBe(0);
  });

  it('should generate timeline when mortgage exists with no other debts', async () => {
    // Create a simple mortgage: $450k balance, 5.5% rate, $2000 min
    const mortgage = new Debt(
      'mortgage-1',
      'Home Loan',
      'mortgage',
      new Money(50000000), // $500k original
      new Money(45000000), // $450k current
      0.055, // 5.5% APR
      new Money(200000), // $2000 fortnight minimum
      'FORTNIGHTLY',
      5
    );
    repo.setUserDebts(userId, [mortgage]);

    const result = await useCase.execute({ userId, fortnightlyFeCents: 92000 });

    // Baseline should have a timeline (minimum-only payments)
    expect(result.baseline.length).toBeGreaterThan(0);
    expect(result.baseline[0]!.periodIndex).toBe(0);
    expect(result.baseline[0]!.remainingCents).toBeLessThan(45000000);
    expect(result.baseline[result.baseline.length - 1]!.remainingCents).toBe(0);

    // Payoff date should be valid (future date)
    expect(result.payoffDateBaselineISO).toBeTruthy();
    const baselineDate = new Date(result.payoffDateBaselineISO!);
    expect(baselineDate.getTime()).toBeGreaterThan(Date.now());
  });

  it('should show time saved when FE applies after credit cards are paid', async () => {
    // Create credit card (priority 1, quick payoff with FE)
    const creditCard = new Debt(
      'cc-1',
      'Visa',
      'credit-card',
      new Money(300000),
      new Money(300000),
      0.1999, // 19.99% APR
      new Money(10000), // $100 minimum
      'FORTNIGHTLY',
      1
    );

    // Create mortgage
    const mortgage = new Debt(
      'mortgage-1',
      'Home Loan',
      'mortgage',
      new Money(50000000),
      new Money(45000000),
      0.055, // 5.5% APR
      new Money(200000), // $2000 minimum
      'FORTNIGHTLY',
      5
    );

    repo.setUserDebts(userId, [creditCard, mortgage]);

    const result = await useCase.execute({ userId, fortnightlyFeCents: 92000 });

    // With FE should pay off faster than baseline
    expect(result.withFe.length).toBeLessThan(result.baseline.length);
    expect(result.timeSavedFortnights).toBeGreaterThan(0);
    expect(result.interestSavedCents).toBeGreaterThan(0);

    // Payoff dates should differ
    expect(result.payoffDateWithFeISO).not.toEqual(result.payoffDateBaselineISO);
    const baselineDate = new Date(result.payoffDateBaselineISO!).getTime();
    const withFeDate = new Date(result.payoffDateWithFeISO!).getTime();
    expect(withFeDate).toBeLessThan(baselineDate);
  });

  it('should handle zero FE amount gracefully', async () => {
    const mortgage = new Debt(
      'mortgage-1',
      'Home Loan',
      'mortgage',
      new Money(50000000),
      new Money(45000000),
      0.055,
      new Money(200000),
      'FORTNIGHTLY',
      5
    );
    repo.setUserDebts(userId, [mortgage]);

    const result = await useCase.execute({ userId, fortnightlyFeCents: 0 });

    // Baseline and withFe should be identical when FE is 0
    expect(result.baseline.length).toBe(result.withFe.length);
    expect(result.timeSavedFortnights).toBe(0);
  });

  it('should generate correct timeline dates', async () => {
    const mortgage = new Debt(
      'mortgage-1',
      'Home Loan',
      'mortgage',
      new Money(50000000),
      new Money(45000000),
      0.055,
      new Money(200000),
      'FORTNIGHTLY',
      5
    );
    repo.setUserDebts(userId, [mortgage]);

    const result = await useCase.execute({ userId, fortnightlyFeCents: 0 });

    // Verify dates are 14 days apart (fortnightly)
    if (result.baseline.length >= 2) {
      const date0 = new Date(result.baseline[0]!.dateISO);
      const date1 = new Date(result.baseline[1]!.dateISO);
      const daysDiff = (date1.getTime() - date0.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(14, 0);
    }

    // Final remaining should be 0
    const final = result.baseline[result.baseline.length - 1]!;
    expect(final.remainingCents).toBe(0);
  });

  it('should calculate interest savings correctly', async () => {
    const mortgage = new Debt(
      'mortgage-1',
      'Home Loan',
      'mortgage',
      new Money(50000000),
      new Money(45000000),
      0.055,
      new Money(200000),
      'FORTNIGHTLY',
      5
    );
    repo.setUserDebts(userId, [mortgage]);

    const result = await useCase.execute({ userId, fortnightlyFeCents: 200000 });

    // Interest saved should be positive (paying more towards principal reduces interest)
    expect(result.interestSavedCents).toBeGreaterThan(0);

    // Time saved should be positive too
    expect(result.timeSavedFortnights).toBeGreaterThan(0);
  });
});
