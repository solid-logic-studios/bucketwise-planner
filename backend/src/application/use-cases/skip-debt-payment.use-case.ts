import { randomUUID } from 'crypto';
import { ValidationError } from '../../domain/exceptions/validation-error.js';
import { Money } from '../../domain/model/money.js';
import { SkippedDebtPayment } from '../../domain/model/skipped-debt-payment.entity.js';
import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import type { SkippedDebtPaymentRepository } from '../../domain/repositories/skipped-debt-payment.repository.interface.js';
import type { SkipDebtPaymentInput } from '../dtos/schemas/skip-debt-payment.schema.js';
import { UseCase } from './base.use-case.js';

export interface SkipDebtPaymentResult {
  skippedPaymentId: string;
}

type SkipDebtPaymentRequest = SkipDebtPaymentInput & { userId: string };

export class SkipDebtPaymentUseCase extends UseCase<SkipDebtPaymentRequest, SkipDebtPaymentResult> {
  constructor(
    private readonly debtRepo: DebtRepository,
    private readonly skippedPaymentRepo: SkippedDebtPaymentRepository
  ) {
    super();
  }

  async execute(input: SkipDebtPaymentRequest): Promise<SkipDebtPaymentResult> {
    const userId = input.userId;
    const debt = await this.debtRepo.findById(userId, input.debtId);
    if (!debt) {
      throw new ValidationError('Debt not found');
    }

    const existing = await this.skippedPaymentRepo.findByDebtAndFortnight(userId, input.debtId, input.fortnightId);
    if (existing) {
      throw new ValidationError('Payment already skipped for this fortnight');
    }

    const id = randomUUID();
    const entity = new SkippedDebtPayment(
      id,
      input.debtId,
      input.fortnightId,
      input.paymentDate,
      new Money(input.amountCents),
      input.skipReason
    );

    await this.skippedPaymentRepo.add(userId, entity);

    return { skippedPaymentId: id };
  }
}
