import type { Pool } from 'pg';
import type { BarefootBucket } from '../../../domain/model/barefoot-bucket.js';
import { Money } from '../../../domain/model/money.js';
import { Transaction } from '../../../domain/model/transaction.entity.js';
import type { TransactionKind } from '../../../domain/model/transaction.type.js';
import type { TransactionRepository } from '../../../domain/repositories/transaction.repository.interface.js';

/**
 * Map database row to Transaction domain entity.
 * Handles both legacy (bucket) and new (source_bucket, destination_bucket) columns.
 * For backward compatibility, if source_bucket is null, falls back to bucket column.
 */
function mapRowToTransaction(row: any): Transaction {
  // Use source_bucket if available, otherwise fall back to bucket for backward compatibility
  const sourceBucket = (row.source_bucket || row.bucket) as BarefootBucket;
  const destinationBucket = (row.destination_bucket as BarefootBucket | null) || null;

  return new Transaction(
    row.id,
    sourceBucket,
    destinationBucket,
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
        id, user_id, bucket, source_bucket, destination_bucket, kind, amount_cents, description, occurred_at, tags, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `;
    await this.pool.query(query, [
      transaction.id,
      userId,
      transaction.sourceBucket, // Also set legacy bucket column for backward compatibility
      transaction.sourceBucket, // source_bucket
      transaction.destinationBucket, // destination_bucket (null for non-transfers)
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

  /**
   * Find transactions by source bucket (primary bucket affected).
   * For regular transactions, this is the only bucket.
   * For transfers, this is the bucket being transferred FROM.
   */
  async findByBucket(userId: string, bucket: string): Promise<Transaction[]> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE (source_bucket = $1 OR bucket = $1) AND user_id = $2',
      [bucket, userId]
    );
    return result.rows.map(mapRowToTransaction);
  }

  /**
   * Find all transfers originating from a source bucket.
   */
  async findTransfersBySourceBucket(userId: string, sourceBucket: string): Promise<Transaction[]> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 AND kind = $2 AND source_bucket = $3 ORDER BY occurred_at DESC',
      [userId, 'transfer', sourceBucket]
    );
    return result.rows.map(mapRowToTransaction);
  }

  /**
   * Find all transfers going to a destination bucket.
   */
  async findTransfersByDestinationBucket(userId: string, destinationBucket: string): Promise<Transaction[]> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 AND kind = $2 AND destination_bucket = $3 ORDER BY occurred_at DESC',
      [userId, 'transfer', destinationBucket]
    );
    return result.rows.map(mapRowToTransaction);
  }

  /**
   * Find all transfers between two specific buckets (bidirectional).
   */
  async findTransfersBetween(userId: string, bucketA: string, bucketB: string): Promise<Transaction[]> {
    const result = await this.pool.query(
      `SELECT * FROM transactions 
       WHERE user_id = $1 AND kind = $2 AND (
         (source_bucket = $3 AND destination_bucket = $4) OR 
         (source_bucket = $4 AND destination_bucket = $3)
       )
       ORDER BY occurred_at DESC`,
      [userId, 'transfer', bucketA, bucketB]
    );
    return result.rows.map(mapRowToTransaction);
  }

  /**
   * Find transactions within a date range using half-open interval semantics.
   * @param userId User ID
   * @param startDate Inclusive start (>=)
   * @param endDate Exclusive end (<) - transactions on this date/time are NOT included
   * @returns Transactions ordered by occurred_at DESC
   */
  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 AND occurred_at >= $2 AND occurred_at < $3 ORDER BY occurred_at DESC',
      [userId, startDate, endDate]
    );
    return result.rows.map(mapRowToTransaction);
  }

  async update(userId: string, transaction: Transaction): Promise<void> {
    const query = `
      UPDATE transactions
      SET bucket = $3,
          source_bucket = $4,
          destination_bucket = $5,
          kind = $6,
          amount_cents = $7,
          description = $8,
          occurred_at = $9,
          tags = $10,
          updated_at = NOW()
      WHERE id = $1 AND user_id = $2
    `;
    const res = await this.pool.query(query, [
      transaction.id,
      userId,
      transaction.sourceBucket, // Legacy bucket column
      transaction.sourceBucket, // source_bucket
      transaction.destinationBucket, // destination_bucket (null for non-transfers)
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

