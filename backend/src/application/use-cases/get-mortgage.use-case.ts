import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import { UseCase } from './base.use-case.js';

export interface GetMortgageRequest { userId: string }
export interface GetMortgageResponse {
  id: string;
  name: string;
  originalAmountCents: number;
  currentBalanceCents: number;
  interestRate: number;
  minimumPaymentCents: number;
   minPaymentFrequency: string;
  priority: number;
}

export class GetMortgageUseCase extends UseCase<GetMortgageRequest, GetMortgageResponse | null> {
  constructor(private readonly debtRepo: DebtRepository) { super(); }

  async execute(input: GetMortgageRequest): Promise<GetMortgageResponse | null> {
    const debts = await this.debtRepo.findByType(input.userId, 'mortgage');
    const m = debts[0];
    if (!m) return null;
    return {
      id: m.id,
      name: m.name,
      originalAmountCents: m.originalAmount.cents,
      currentBalanceCents: m.currentBalance.cents,
      interestRate: m.interestRate,
      minimumPaymentCents: m.minimumPayment.cents,
       minPaymentFrequency: m.minPaymentFrequency,
      priority: m.priority,
    };
  }
}
