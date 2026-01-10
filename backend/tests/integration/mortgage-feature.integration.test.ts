import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateMortgageOverpaymentPlanUseCase } from '../../src/application/use-cases/calculate-mortgage-overpayment-plan.use-case.js';
import { GetMortgageUseCase } from '../../src/application/use-cases/get-mortgage.use-case.js';
import { UpsertMortgageUseCase } from '../../src/application/use-cases/upsert-mortgage.use-case.js';
import { Debt } from '../../src/domain/model/debt.entity.js';
import { Money } from '../../src/domain/model/money.js';
import { MemoryDebtRepository } from '../../src/infrastructure/persistence/memory/memory-debt.repository.js';

describe('Mortgage Feature Integration Tests', () => {
  let debtRepo: MemoryDebtRepository;
  let getMortgageUC: GetMortgageUseCase;
  let upsertMortgageUC: UpsertMortgageUseCase;
  let calculateOverpaymentUC: CalculateMortgageOverpaymentPlanUseCase;

  const userId = 'integration-test-user';

  beforeEach(() => {
    debtRepo = new MemoryDebtRepository();
    getMortgageUC = new GetMortgageUseCase(debtRepo);
    upsertMortgageUC = new UpsertMortgageUseCase(debtRepo);
    calculateOverpaymentUC = new CalculateMortgageOverpaymentPlanUseCase(debtRepo);
  });

  describe('Full mortgage workflow', () => {
    it('should create and retrieve mortgage', async () => {
      // Initially no mortgage
      let result = await getMortgageUC.execute({ userId });
      expect(result).toBeNull();

      // Upsert mortgage
      const mortgageId = await upsertMortgageUC.execute({
        userId,
        name: 'Home Loan',
        originalPrincipalCents: 50000000,
        currentPrincipalCents: 45000000,
        annualRateBps: 550,
        minPaymentCents: 200000,
        minPaymentFrequency: 'FORTNIGHTLY',
        annualFeeCents: 39500,
        priority: 5,
      });

      expect(mortgageId.id).toBeTruthy();

      // Retrieve mortgage
      result = await getMortgageUC.execute({ userId });
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Home Loan');
      expect(result?.currentBalanceCents).toBe(45000000);
      expect(result?.interestRate).toBeCloseTo(0.055, 3);
    });

    it('should calculate overpayment plan for mortgage with credit cards', async () => {
      // Add credit card
      const creditCard = new Debt(
        uuidv4(),
        'Visa Card',
        'credit-card',
        new Money(300000),
        new Money(300000),
        0.1999,
        new Money(10000),
        'FORTNIGHTLY',
        1
      );
      await debtRepo.add(userId, creditCard);

      // Add mortgage
      await upsertMortgageUC.execute({
        userId,
        name: 'Home Loan',
        originalPrincipalCents: 50000000,
        currentPrincipalCents: 45000000,
        annualRateBps: 550,
        minPaymentCents: 200000,
        minPaymentFrequency: 'FORTNIGHTLY',
        annualFeeCents: 0,
        priority: 5,
      });

      // Calculate overpayment plan
      const plan = await calculateOverpaymentUC.execute({
        userId,
        fortnightlyFeCents: 92000,
      });

      // Plan should show benefits
      expect(plan.baseline.length).toBeGreaterThan(0);
      expect(plan.withFe.length).toBeGreaterThan(0);
      expect(plan.withFe.length).toBeLessThan(plan.baseline.length);
      expect(plan.timeSavedFortnights).toBeGreaterThan(0);
      expect(plan.interestSavedCents).toBeGreaterThan(0);

      // Dates should be valid and different
      expect(plan.payoffDateBaselineISO).toBeTruthy();
      expect(plan.payoffDateWithFeISO).toBeTruthy();
      expect(plan.payoffDateWithFeISO).not.toEqual(plan.payoffDateBaselineISO);

      const baselineDate = new Date(plan.payoffDateBaselineISO!);
      const withFeDate = new Date(plan.payoffDateWithFeISO!);
      expect(withFeDate.getTime()).toBeLessThan(baselineDate.getTime());
    });

    it('should update existing mortgage', async () => {
      // Create initial mortgage
      await upsertMortgageUC.execute({
        userId,
        name: 'Home Loan',
        originalPrincipalCents: 50000000,
        currentPrincipalCents: 45000000,
        annualRateBps: 550,
        minPaymentCents: 200000,
        minPaymentFrequency: 'FORTNIGHTLY',
        annualFeeCents: 0,
        priority: 5,
      });

      // Update with new balance and rate
      await upsertMortgageUC.execute({
        userId,
        name: 'Home Loan - Refinanced',
        originalPrincipalCents: 50000000,
        currentPrincipalCents: 44000000,
        annualRateBps: 450,
        minPaymentCents: 190000,
        minPaymentFrequency: 'FORTNIGHTLY',
        annualFeeCents: 0,
        priority: 5,
      });

      // Retrieve and verify update
      const result = await getMortgageUC.execute({ userId });
      expect(result?.name).toBe('Home Loan - Refinanced');
      expect(result?.currentBalanceCents).toBe(44000000);
      expect(result?.interestRate).toBeCloseTo(0.045, 3);
    });

    it('should handle multiple runs of overpayment calculation', async () => {
      // Add mortgage
      await upsertMortgageUC.execute({
        userId,
        name: 'Home Loan',
        originalPrincipalCents: 50000000,
        currentPrincipalCents: 45000000,
        annualRateBps: 550,
        minPaymentCents: 200000,
        minPaymentFrequency: 'FORTNIGHTLY',
        annualFeeCents: 0,
        priority: 5,
      });

      // Run with different FE amounts
      const plan1 = await calculateOverpaymentUC.execute({
        userId,
        fortnightlyFeCents: 50000,
      });
      const plan2 = await calculateOverpaymentUC.execute({
        userId,
        fortnightlyFeCents: 150000,
      });

      // Higher FE should result in faster payoff
      expect(plan2.withFe.length).toBeLessThan(plan1.withFe.length);
      expect(plan2.timeSavedFortnights).toBeGreaterThan(plan1.timeSavedFortnights);
      expect(plan2.interestSavedCents).toBeGreaterThan(plan1.interestSavedCents);
    });
  });
});
