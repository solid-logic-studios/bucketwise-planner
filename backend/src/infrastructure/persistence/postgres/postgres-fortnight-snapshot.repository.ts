import type { Pool } from 'pg';
import { Allocation } from '../../../domain/model/allocation.entity.js';
import type { BarefootBucket } from '../../../domain/model/barefoot-bucket.js';
import { FortnightSnapshot } from '../../../domain/model/fortnight-snapshot.entity.js';
import { Money } from '../../../domain/model/money.js';
import { Transaction } from '../../../domain/model/transaction.entity.js';
import type { TransactionKind } from '../../../domain/model/transaction.type.js';
import type { FortnightSnapshotRepository } from '../../../domain/repositories/fortnight-snapshot.repository.interface.js';

interface SerializedAllocation {
  id: string;
  bucket: BarefootBucket;
  percent: number;
}

interface SerializedTransaction {
  id: string;
  sourceBucket: BarefootBucket;
  destinationBucket: BarefootBucket | null | undefined;
  kind: TransactionKind;
  amountCents: number;
  description: string;
  occurredAt: string;
  tags: string[];
}

function serializeAllocations(allocations: Allocation[]): SerializedAllocation[] {
  return allocations.map((a) => ({
    id: a.id,
    bucket: a.bucket,
    percent: a.percentage,
  }));
}

function serializeTransactions(transactions: Transaction[]): SerializedTransaction[] {
  return transactions.map((t) => ({
    id: t.id,
    sourceBucket: t.sourceBucket,
    destinationBucket: t.destinationBucket || undefined,
    kind: t.kind,
    amountCents: t.amount.cents,
    description: t.description,
    occurredAt: t.occurredAt.toISOString(),
    tags: t.tags,
  }));
}

function deserializeAllocations(rows: SerializedAllocation[]): Allocation[] {
  return rows.map((row) => new Allocation(row.id, row.bucket, row.percent));
}

function deserializeTransactions(rows: SerializedTransaction[]): Transaction[] {
  return rows.map(
    (row) =>
      new Transaction(
        row.id,
        row.sourceBucket,
        row.destinationBucket || null,
        row.kind,
        new Money(row.amountCents),
        row.description,
        new Date(row.occurredAt),
        row.tags
      )
  );
}

function mapRowToSnapshot(row: any): FortnightSnapshot {
  const allocations = deserializeAllocations((row.allocations as SerializedAllocation[]) ?? []);
  const transactions = deserializeTransactions((row.transactions as SerializedTransaction[]) ?? []);
  return new FortnightSnapshot(
    row.id,
    new Date(row.period_start),
    new Date(row.period_end),
    allocations,
    transactions
  );
}

export class PostgresFortnightSnapshotRepository
  implements FortnightSnapshotRepository
{
  constructor(private readonly pool: Pool) {}

  async add(userId: string, snapshot: FortnightSnapshot): Promise<void> {
    const query = `
      INSERT INTO fortnight_snapshots (
        id, user_id, period_start, period_end, allocations, transactions, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `;
    await this.pool.query(query, [
      snapshot.id,
      userId,
      snapshot.periodStart,
      snapshot.periodEnd,
      JSON.stringify(serializeAllocations(snapshot.allocations)),
      JSON.stringify(serializeTransactions(snapshot.transactions)),
    ]);
  }

  async findById(userId: string, id: string): Promise<FortnightSnapshot | null> {
    const result = await this.pool.query(
      'SELECT * FROM fortnight_snapshots WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) return null;
    return mapRowToSnapshot(result.rows[0]);
  }

  async findByPeriod(userId: string, periodStart: Date): Promise<FortnightSnapshot | null> {
    const result = await this.pool.query(
      'SELECT * FROM fortnight_snapshots WHERE period_start = $1 AND user_id = $2',
      [periodStart, userId]
    );
    if (result.rowCount === 0) return null;
    return mapRowToSnapshot(result.rows[0]);
  }

  async getAll(userId: string): Promise<FortnightSnapshot[]> {
    const result = await this.pool.query(
      'SELECT * FROM fortnight_snapshots WHERE user_id = $1 ORDER BY period_start ASC',
      [userId]
    );
    return result.rows.map(mapRowToSnapshot);
  }

  async update(userId: string, snapshot: FortnightSnapshot): Promise<void> {
    const res = await this.pool.query(
      `
        UPDATE fortnight_snapshots
        SET period_start = $3,
            period_end = $4,
            allocations = $5,
            transactions = $6,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `,
      [
        snapshot.id,
        userId,
        snapshot.periodStart,
        snapshot.periodEnd,
        JSON.stringify(serializeAllocations(snapshot.allocations)),
        JSON.stringify(serializeTransactions(snapshot.transactions)),
      ]
    );

    if (res.rowCount === 0) {
      throw new Error(`FortnightSnapshot ${snapshot.id} not found`);
    }
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.pool.query('DELETE FROM fortnight_snapshots WHERE id = $1 AND user_id = $2', [id, userId]);
  }
}
