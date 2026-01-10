import type { SkippedDebtPayment } from '../../domain/model/skipped-debt-payment.entity.js';
import type { SkippedDebtPaymentRepository } from '../../domain/repositories/skipped-debt-payment.repository.interface.js';
import { UseCase } from './base.use-case.js';

interface ListSkippedDebtPaymentsRequest {
  userId: string;
  fortnightId: string;
}

interface SkippedDebtPaymentDTO {
  id: string;
  debtId: string;
  fortnightId: string;
  paymentDate: string;
  amountCents: number;
  skipReason: string | undefined;
  skippedAt: string;
}

interface ListSkippedDebtPaymentsResponse {
  skippedPayments: SkippedDebtPaymentDTO[];
}

export class ListSkippedDebtPaymentsUseCase extends UseCase<
  ListSkippedDebtPaymentsRequest,
  ListSkippedDebtPaymentsResponse
> {
  constructor(private readonly skippedDebtPaymentRepo: SkippedDebtPaymentRepository) {
    super();
  }

  async execute(request: ListSkippedDebtPaymentsRequest): Promise<ListSkippedDebtPaymentsResponse> {
    const payments = await this.skippedDebtPaymentRepo.findByFortnight(request.userId, request.fortnightId);

    return {
      skippedPayments: payments.map((payment: SkippedDebtPayment) => ({
        id: payment.id,
        debtId: payment.debtId,
        fortnightId: payment.fortnightId,
        paymentDate: payment.paymentDate.toISOString(),
        amountCents: payment.amount.cents,
        skipReason: payment.skipReason,
        skippedAt: payment.skippedAt.toISOString(),
      })),
    };
  }
}
