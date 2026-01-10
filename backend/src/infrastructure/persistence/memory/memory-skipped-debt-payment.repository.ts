import { SkippedDebtPayment } from '../../../domain/model/skipped-debt-payment.entity.js';
import type { SkippedDebtPaymentRepository } from '../../../domain/repositories/skipped-debt-payment.repository.interface.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class MemorySkippedDebtPaymentRepository
  extends InMemoryRepository<SkippedDebtPayment>
  implements SkippedDebtPaymentRepository
{
  async findByDebtAndFortnight(userId: string, debtId: string, fortnightId: string): Promise<SkippedDebtPayment | null> {
    const all = await this.getAll(userId);
    return all.find((p) => p.debtId === debtId && p.fortnightId === fortnightId) ?? null;
  }

  async findByFortnight(userId: string, fortnightId: string): Promise<SkippedDebtPayment[]> {
    const all = await this.getAll(userId);
    return all.filter((p) => p.fortnightId === fortnightId);
  }
}
