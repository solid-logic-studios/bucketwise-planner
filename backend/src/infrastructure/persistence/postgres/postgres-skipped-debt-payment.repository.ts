import type { Pool } from 'pg';
import { Money } from '../../../domain/model/money.js';
import { SkippedDebtPayment } from '../../../domain/model/skipped-debt-payment.entity.js';
import type { SkippedDebtPaymentRepository } from '../../../domain/repositories/skipped-debt-payment.repository.interface.js';

type SkippedDebtPaymentRow = {
  id: string;
  debt_id: string;
  fortnight_id: string;
  payment_date: string | Date;
  amount_cents: number | string;
  skip_reason: string | null;
  skipped_at: string | Date | null;
  created_at?: string | Date | null;
};

function mapRow(row: SkippedDebtPaymentRow): SkippedDebtPayment {
  return new SkippedDebtPayment(
    row.id,
    row.debt_id,
    row.fortnight_id,
    new Date(row.payment_date),
    new Money(Number(row.amount_cents)),
    row.skip_reason ?? undefined,
    row.skipped_at ? new Date(row.skipped_at) : new Date(row.created_at ?? Date.now())
  );
}

export class PostgresSkippedDebtPaymentRepository
  implements SkippedDebtPaymentRepository
{
  constructor(private readonly pool: Pool) {}

  async add(userId: string, entity: SkippedDebtPayment): Promise<void> {
    const query = `
      INSERT INTO skipped_debt_payments (
        id, user_id, debt_id, fortnight_id, payment_date, amount_cents, skip_reason, skipped_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `;
    await this.pool.query(query, [
      entity.id,
      userId,
      entity.debtId,
      entity.fortnightId,
      entity.paymentDate,
      entity.amount.cents,
      entity.skipReason ?? null,
      entity.skippedAt,
    ]);
  }

  async findById(userId: string, id: string): Promise<SkippedDebtPayment | null> {
    const res = await this.pool.query(
      'SELECT * FROM skipped_debt_payments WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (res.rowCount === 0) return null;
    return mapRow(res.rows[0]);
  }

  async findByDebtAndFortnight(userId: string, debtId: string, fortnightId: string): Promise<SkippedDebtPayment | null> {
    const res = await this.pool.query(
      'SELECT * FROM skipped_debt_payments WHERE user_id = $1 AND debt_id = $2 AND fortnight_id = $3 LIMIT 1',
      [userId, debtId, fortnightId]
    );
    if (res.rowCount === 0) return null;
    return mapRow(res.rows[0]);
  }

  async findByFortnight(userId: string, fortnightId: string): Promise<SkippedDebtPayment[]> {
    const res = await this.pool.query(
      'SELECT * FROM skipped_debt_payments WHERE user_id = $1 AND fortnight_id = $2 ORDER BY payment_date DESC',
      [userId, fortnightId]
    );
    return res.rows.map(mapRow);
  }

  async update(userId: string, entity: SkippedDebtPayment): Promise<void> {
    const res = await this.pool.query(
      `UPDATE skipped_debt_payments
         SET payment_date = $3,
             amount_cents = $4,
             skip_reason = $5,
             skipped_at = $6,
             updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [entity.id, userId, entity.paymentDate, entity.amount.cents, entity.skipReason ?? null, entity.skippedAt]
    );
    if (res.rowCount === 0) {
      throw new Error(`SkippedDebtPayment ${entity.id} not found`);
    }
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.pool.query('DELETE FROM skipped_debt_payments WHERE id = $1 AND user_id = $2', [id, userId]);
  }

  async getAll(userId: string): Promise<SkippedDebtPayment[]> {
    const res = await this.pool.query('SELECT * FROM skipped_debt_payments WHERE user_id = $1', [userId]);
    return res.rows.map(mapRow);
  }
}
