import type { UnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';

/**
 * MemoryUnitOfWork: minimal implementation for local in-memory operations.
 * Since everything is in-memory, commit/rollback are no-ops.
 * In a real DB (Postgres/SQLite), this would manage transactions.
 */
export class MemoryUnitOfWork implements UnitOfWork {
  private active = true;

  async commit(): Promise<void> {
    // No-op for in-memory storage
  }

  async rollback(): Promise<void> {
    // No-op for in-memory storage
  }

  isActive(): boolean {
    return this.active;
  }
}
