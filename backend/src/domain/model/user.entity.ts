export class User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    if (!params.id) throw new Error('USER_ID_REQUIRED');
    if (!User.isValidEmail(params.email)) throw new Error('INVALID_EMAIL');
    if (!params.name || !params.name.trim()) throw new Error('NAME_REQUIRED');
    if (!params.passwordHash) throw new Error('PASSWORD_HASH_REQUIRED');

    this.id = params.id;
    this.email = params.email.toLowerCase();
    this.name = params.name.trim();
    this.passwordHash = params.passwordHash;
    this.createdAt = params.createdAt ?? new Date();
    this.updatedAt = params.updatedAt ?? new Date();
  }

  static isValidEmail(email: string): boolean {
    // Simple RFC 5322-ish regex; sufficient for validation step
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
