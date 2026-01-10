import type { SkippedDebtPayment } from '../model/skipped-debt-payment.entity.js';
import type { Repository } from './repository.interface.js';

/**
 * Repository contract for skipped debt payments.
 */
export interface SkippedDebtPaymentRepository
  extends Repository<SkippedDebtPayment>
{
  findByDebtAndFortnight(userId: string, debtId: string, fortnightId: string): Promise<SkippedDebtPayment | null>;
  findByFortnight(userId: string, fortnightId: string): Promise<SkippedDebtPayment[]>;
}
