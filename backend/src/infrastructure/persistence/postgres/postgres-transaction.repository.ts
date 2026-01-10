import type { Pool } from 'pg';
import type { BarefootBucket } from '../../../domain/model/barefoot-bucket.js';
import { Money } from '../../../domain/model/money.js';
import { Transaction } from '../../../domain/model/transaction.entity.js';
import type { TransactionKind } from '../../../domain/model/transaction.type.js';
import type { TransactionRepository } from '../../../domain/repositories/transaction.repository.interface.js';

function mapRowToTransaction(row: any): Transaction {
  return new Transaction(
    row.id,
    row.bucket as BarefootBucket,
    row.kind as TransactionKind,
    new Money(Number(row.amount_cents)),
    row.description,
    new Date(row.occurred_at),
    (row.tags as string[]) ?? []
  );
}

export class PostgresTransactionRepository
  implements TransactionRepository
{
  constructor(private readonly pool: Pool) {}

  async add(userId: string, transaction: Transaction): Promise<void> {
    const query = `
      INSERT INTO transactions (
        id, user_id, bucket, kind, amount_cents, description, occurred_at, tags, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `;
    await this.pool.query(query, [
      transaction.id,
      userId,
      transaction.bucket,
      transaction.kind,
      transaction.amount.cents,
      transaction.description,
      transaction.occurredAt,
      transaction.tags,
    ]);
  }

  async findById(userId: string, id: string): Promise<Transaction | null> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) return null;
    return mapRowToTransaction(result.rows[0]);
  }

  async findByFortnightId(userId: string, _fortnightId: string): Promise<Transaction[]> {
    // Fortnight relationship not yet modeled; placeholder for future join.
    return [];
  }

  async findByBucket(userId: string, bucket: string): Promise<Transaction[]> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE bucket = $1 AND user_id = $2',
      [bucket, userId]
    );
    return result.rows.map(mapRowToTransaction);
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 AND occurred_at >= $2 AND occurred_at <= $3 ORDER BY occurred_at DESC',
      [userId, startDate, endDate]
    );
    return result.rows.map(mapRowToTransaction);
  }

  async update(userId: string, transaction: Transaction): Promise<void> {
    const query = `
      UPDATE transactions
      SET bucket = $3,
          kind = $4,
          amount_cents = $5,
          description = $6,
          occurred_at = $7,
          tags = $8,
          updated_at = NOW()
      WHERE id = $1 AND user_id = $2
    `;
    const res = await this.pool.query(query, [
      transaction.id,
      userId,
      transaction.bucket,
      transaction.kind,
      transaction.amount.cents,
      transaction.description,
      transaction.occurredAt,
      transaction.tags,
    ]);
    if (res.rowCount === 0) {
      throw new Error(`Transaction ${transaction.id} not found`);
    }
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
  }

  async getAll(userId: string): Promise<Transaction[]> {
    const result = await this.pool.query('SELECT * FROM transactions WHERE user_id = $1', [userId]);
    return result.rows.map(mapRowToTransaction);
  }
}
