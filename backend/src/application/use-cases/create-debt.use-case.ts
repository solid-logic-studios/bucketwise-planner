import { randomUUID } from 'crypto';
import { Debt } from '../../domain/model/debt.entity.js';
import { Money } from '../../domain/model/money.js';
import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import type { CreateDebtInput } from '../dtos/schemas/debt.schema.js';
import { UseCase } from './base.use-case.js';

export interface CreateDebtResult {
  debtId: string;
}

type CreateDebtRequest = CreateDebtInput & { userId: string };

export class CreateDebtUseCase extends UseCase<CreateDebtRequest, CreateDebtResult> {
  constructor(private readonly repo: DebtRepository) {
    super();
  }

  async execute(input: CreateDebtRequest): Promise<CreateDebtResult> {
    const id = randomUUID();

    const priority = input.priority ?? (input.debtType === 'mortgage' ? 5 : 1);

    const debt = new Debt(
      id,
      input.name,
      input.debtType,
      new Money(input.originalAmountCents),
      new Money(input.currentBalanceCents),
      input.interestRate,
      new Money(input.minimumPaymentCents),
      input.minPaymentFrequency,
      priority
    );

    await this.repo.add(input.userId, debt);

    return { debtId: id };
  }
}
