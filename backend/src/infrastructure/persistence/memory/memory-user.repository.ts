import { randomUUID } from 'crypto';
import { User } from '../../../domain/model/user.entity.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface.js';

export class MemoryUserRepository implements UserRepository {
  private byId = new Map<string, User>();
  private byEmail = new Map<string, string>(); // email -> id

  async getUserByEmail(email: string): Promise<User | null> {
    const id = this.byEmail.get(email.toLowerCase());
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }

  async createUser(user: User): Promise<User> {
    const id = user.id || randomUUID();
    const normalized = new User({
      id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    if (this.byEmail.has(normalized.email)) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    this.byId.set(id, normalized);
    this.byEmail.set(normalized.email, id);
    return normalized;
  }

  async updateUser(user: User): Promise<User> {
    const existing = this.byId.get(user.id);
    if (!existing) {
      throw new Error('USER_NOT_FOUND');
    }
    const updated = new User({
      id: user.id,
      email: existing.email,
      name: user.name,
      passwordHash: existing.passwordHash,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.byId.set(user.id, updated);
    return updated;
  }
}
