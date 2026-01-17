import { Transaction } from '../model/transaction.entity.js';
import type { Repository } from './repository.interface.js';

/**
 * TransactionRepository defines the contract for transaction persistence.
 * Implementations can use memory, PostgreSQL, SQLite, file-based storage, etc.
 */
export interface TransactionRepository
  extends Repository<Transaction, string> {
  /**
   * Find all transactions in a fortnight period
   */
  findByFortnightId(userId: string, fortnightId: string): Promise<Transaction[]>;

  /**
   * Find transactions by source bucket (primary bucket affected).
   * For regular transactions, this is the only bucket.
   * For transfers, this is the bucket being transferred FROM.
   */
  findByBucket(userId: string, bucket: string): Promise<Transaction[]>;

  /**
   * Find transactions within a date range (half-open interval: [start, end))
   */
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;

  /**
   * Find all transfers originating from a specific bucket (kind='transfer' AND source_bucket=bucket)
   */
  findTransfersBySourceBucket(userId: string, sourceBucket: string): Promise<Transaction[]>;

  /**
   * Find all transfers going to a specific bucket (kind='transfer' AND destination_bucket=bucket)
   */
  findTransfersByDestinationBucket(userId: string, destinationBucket: string): Promise<Transaction[]>;

  /**
   * Find all transfers between two specific buckets (bidirectional).
   * Returns transfers where (source=bucketA AND destination=bucketB) OR (source=bucketB AND destination=bucketA)
   */
  findTransfersBetween(userId: string, bucketA: string, bucketB: string): Promise<Transaction[]>;
}

