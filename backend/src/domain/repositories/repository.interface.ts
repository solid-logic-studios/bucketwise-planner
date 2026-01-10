import type { BaseEntity } from '../model/base.entity.js';

/**
 * Generic repository contract for aggregate persistence.
 * All methods require userId for multi-user data scoping.
 */
export interface Repository<T extends BaseEntity, ID = string> {
  add(userId: string, entity: T): Promise<void>;
  findById(userId: string, id: ID): Promise<T | null>;
  update(userId: string, entity: T): Promise<void>;
  delete(userId: string, id: ID): Promise<void>;
  getAll(userId: string): Promise<T[]>;
}
