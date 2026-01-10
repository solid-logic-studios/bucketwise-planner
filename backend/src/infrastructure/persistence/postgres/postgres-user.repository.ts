import type { Pool } from 'pg';
import type { User } from '../../../domain/model/user.entity.js';
import { User as UserEntity } from '../../../domain/model/user.entity.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface.js';

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async getUserByEmail(email: string): Promise<User | null> {
    const res = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );
    const row = res.rows[0];
    if (!row) return null;
    return new UserEntity({
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async getUserById(id: string): Promise<User | null> {
    const res = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    const row = res.rows[0];
    if (!row) return null;
    return new UserEntity({
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async createUser(user: User): Promise<User> {
    const res = await this.pool.query<UserRow>(
      `INSERT INTO users (id, email, name, password_hash) VALUES ($1, LOWER($2), $3, $4)
       RETURNING id, email, name, password_hash, created_at, updated_at`,
      [user.id, user.email, user.name, user.passwordHash]
    );
    const row = res.rows[0]!;
    return new UserEntity({
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async updateUser(user: User): Promise<User> {
    const res = await this.pool.query<UserRow>(
      `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, email, name, password_hash, created_at, updated_at`,
      [user.name, user.id]
    );
    const row = res.rows[0];
    if (!row) throw new Error('USER_NOT_FOUND');
    return new UserEntity({
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
