import { Transaction } from '../../../domain/model/transaction.entity.js';
import type { TransactionRepository } from '../../../domain/repositories/transaction.repository.interface.js';
import { InMemoryRepository } from './in-memory.repository.js';

/**
 * MemoryTransactionRepository: in-memory implementation for local development.
 * Stores transactions in a Map; data is lost on restart (by design for local dev).
 */
export class MemoryTransactionRepository
  extends InMemoryRepository<Transaction>
  implements TransactionRepository
{
  async findByFortnightId(userId: string, _fortnightId: string): Promise<Transaction[]> {
    // TODO: implement once Fortnight aggregate is fully defined
    return [];
  }

  async findByBucket(userId: string, bucket: string): Promise<Transaction[]> {
    const all = await this.getAll(userId);
    return all.filter((t) => t.bucket === bucket);
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const all = await this.getAll(userId);
    return all
      .filter((t) => t.occurredAt >= startDate && t.occurredAt <= endDate)
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async findTransfersBySourceBucket(userId: string, bucket: string): Promise<Transaction[]> {
    const all = await this.getAll(userId);
    return all.filter((t) => t.isTransfer() && t.sourceBucket === bucket);
  }

  async findTransfersByDestinationBucket(userId: string, bucket: string): Promise<Transaction[]> {
    const all = await this.getAll(userId);
    return all.filter((t) => t.isTransfer() && t.destinationBucket === bucket);
  }

  async findTransfersBetween(userId: string, bucketA: string, bucketB: string): Promise<Transaction[]> {
    const all = await this.getAll(userId);
    return all.filter((t) => 
      t.isTransfer() && 
      ((t.sourceBucket === bucketA && t.destinationBucket === bucketB) ||
       (t.sourceBucket === bucketB && t.destinationBucket === bucketA))
    );
  }
}
