import { Debt } from '../../domain/model/debt.entity.js';
import { Money } from '../../domain/model/money.js';
import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import type { UpdateDebtInput } from '../dtos/schemas/debt.schema.js';
import { UseCase } from './base.use-case.js';

type UpdateDebtRequest = UpdateDebtInput & { userId: string };

export class UpdateDebtUseCase extends UseCase<UpdateDebtRequest, void> {
  constructor(private readonly repo: DebtRepository) {
    super();
  }

  async execute(input: UpdateDebtRequest): Promise<void> {
    const userId = input.userId;
    const existing = await this.repo.findById(userId, input.id);
    if (!existing) {
      throw new Error('Debt not found');
    }

    const priority = input.priority ?? (input.debtType === 'mortgage' ? 5 : 1);

    const updated = new Debt(
      input.id,
      input.name,
      input.debtType,
      new Money(input.originalAmountCents),
      new Money(input.currentBalanceCents),
      input.interestRate,
      new Money(input.minimumPaymentCents),
      input.minPaymentFrequency,
      priority
    );

    await this.repo.update(userId, updated);
  }
}
