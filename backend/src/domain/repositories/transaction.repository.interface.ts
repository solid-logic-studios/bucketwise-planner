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
   * Find transactions by bucket type
   */
  findByBucket(userId: string, bucket: string): Promise<Transaction[]>;

  /**
   * Find transactions within a date range (inclusive)
   */
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;

}
