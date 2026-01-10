import bcrypt from 'bcryptjs';
import type { PasswordService } from './PasswordService.js';

/**
 * Uses bcryptjs (pure JS) to avoid native bindings.
 */
export class BcryptPasswordService implements PasswordService {
  constructor(private readonly rounds: number = 12) {}

  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.rounds);
    return bcrypt.hash(password, salt);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
