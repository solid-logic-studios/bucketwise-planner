import type { BaseEntity } from '../../../domain/model/base.entity.js';
import type { Repository } from '../../../domain/repositories/repository.interface.js';

/**
 * Generic in-memory repository implementation for development/testing.
 * Stores data per-user using Map<userId, Map<id, entity>>.
 */
export abstract class InMemoryRepository<T extends BaseEntity, ID = string>
  implements Repository<T, ID>
{
  protected readonly store = new Map<string, Map<ID, T>>();

  private getUserStore(userId: string): Map<ID, T> {
    if (!this.store.has(userId)) {
      this.store.set(userId, new Map());
    }
    return this.store.get(userId)!;
  }

  async add(userId: string, entity: T): Promise<void> {
    const userStore = this.getUserStore(userId);
    userStore.set(entity.id as unknown as ID, entity);
  }

  async findById(userId: string, id: ID): Promise<T | null> {
    const userStore = this.getUserStore(userId);
    return userStore.get(id) ?? null;
  }

  async update(userId: string, entity: T): Promise<void> {
    const userStore = this.getUserStore(userId);
    const key = entity.id as unknown as ID;
    if (!userStore.has(key)) {
      throw new Error(`Entity ${String(key)} not found`);
    }
    userStore.set(key, entity);
  }

  async delete(userId: string, id: ID): Promise<void> {
    const userStore = this.getUserStore(userId);
    userStore.delete(id);
  }

  async getAll(userId: string): Promise<T[]> {
    const userStore = this.getUserStore(userId);
    return Array.from(userStore.values());
  }
}
