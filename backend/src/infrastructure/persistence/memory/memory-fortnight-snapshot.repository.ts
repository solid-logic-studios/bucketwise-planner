import { FortnightSnapshot } from '../../../domain/model/fortnight-snapshot.entity.js';
import type { FortnightSnapshotRepository } from '../../../domain/repositories/fortnight-snapshot.repository.interface.js';
import { InMemoryRepository } from './in-memory.repository.js';

/**
 * MemoryFortnightSnapshotRepository: in-memory implementation for local development.
 */
export class MemoryFortnightSnapshotRepository
  extends InMemoryRepository<FortnightSnapshot>
  implements FortnightSnapshotRepository
{

  async findByPeriod(userId: string, periodStart: Date): Promise<FortnightSnapshot | null> {
    const all = await this.getAll(userId);
    for (const snapshot of all) {
      if (
        snapshot.periodStart.getTime() === periodStart.getTime()
      ) {
        return snapshot;
      }
    }
    return null;
  }

  async getAll(userId: string): Promise<FortnightSnapshot[]> {
    const all = await super.getAll(userId);
    return all.sort(
      (a, b) => a.periodStart.getTime() - b.periodStart.getTime()
    );
  }
}
