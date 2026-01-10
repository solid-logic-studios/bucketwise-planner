import type { Debt } from '../../domain/model/debt.entity.js';
import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import { UseCase } from './base.use-case.js';

export interface DebtDTO {
  id: string;
  name: string;
  debtType: string;
  originalAmountCents: number;
  currentBalanceCents: number;
  interestRate: number;
  minimumPaymentCents: number;
   minPaymentFrequency: string;
  priority: number;
}

export interface ListDebtsRequest {
  userId: string;
}

export class ListDebtsUseCase extends UseCase<ListDebtsRequest, DebtDTO[]> {
  constructor(private readonly repo: DebtRepository) {
    super();
  }

  async execute(request: ListDebtsRequest): Promise<DebtDTO[]> {
    const debts = await this.repo.findByPriority(request.userId);
    return debts.map((debt) => this.mapDebt(debt));
  }

  private mapDebt(debt: Debt): DebtDTO {
    return {
      id: debt.id,
      name: debt.name,
      debtType: debt.debtType,
      originalAmountCents: debt.originalAmount.cents,
      currentBalanceCents: debt.currentBalance.cents,
      interestRate: debt.interestRate,
      minimumPaymentCents: debt.minimumPayment.cents,
       minPaymentFrequency: debt.minPaymentFrequency,
      priority: debt.priority,
    };
  }
}
