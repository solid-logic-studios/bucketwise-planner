import { v4 as uuidv4 } from 'uuid';
import { Debt } from '../../domain/model/debt.entity.js';
import { Money } from '../../domain/model/money.js';
import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import type { UpsertMortgageInput } from '../dtos/schemas/mortgage.schema.js';
import { UseCase } from './base.use-case.js';

export interface UpsertMortgageRequest extends UpsertMortgageInput { userId: string }
export interface UpsertMortgageResponse { id: string }

export class UpsertMortgageUseCase extends UseCase<UpsertMortgageRequest, UpsertMortgageResponse> {
  constructor(private readonly debtRepo: DebtRepository) { super(); }

  async execute(input: UpsertMortgageRequest): Promise<UpsertMortgageResponse> {
    const existing = await this.debtRepo.findByType(input.userId, 'mortgage');

    const entity = new Debt(
      existing[0]?.id ?? uuidv4(),
      input.name,
      'mortgage',
      new Money(input.originalPrincipalCents),
      new Money(input.currentPrincipalCents),
      input.annualRateBps / 10000,
      new Money(input.minPaymentCents),
      input.minPaymentFrequency,
      input.priority
    );

    if (existing[0]) {
      await this.debtRepo.update(input.userId, entity);
      return { id: entity.id };
    } else {
      await this.debtRepo.add(input.userId, entity);
      return { id: entity.id };
    }
  }
}
