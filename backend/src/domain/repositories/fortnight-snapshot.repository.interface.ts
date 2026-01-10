import { FortnightSnapshot } from '../model/fortnight-snapshot.entity.js';
import type { Repository } from './repository.interface.js';

/**
 * FortnightSnapshotRepository defines the contract for fortnight snapshot persistence.
 */
export interface FortnightSnapshotRepository
  extends Repository<FortnightSnapshot, string> {
  /**
   * Find fortnight snapshot by period (start date)
   */
  findByPeriod(userId: string, periodStart: Date): Promise<FortnightSnapshot | null>;
}
