/**
 * UnitOfWork pattern: groups multiple repository operations into a single transaction.
 * Useful for maintaining consistency across multiple aggregates.
 */
export interface UnitOfWork {
  /**
   * Commit all changes made in this unit of work
   */
  commit(): Promise<void>;

  /**
   * Rollback all changes
   */
  rollback(): Promise<void>;

  /**
   * Check if transaction is active
   */
  isActive(): boolean;
}
