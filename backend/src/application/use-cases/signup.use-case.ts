import { randomUUID } from 'crypto';
import { User } from '../../domain/model/user.entity.js';
import type { UserRepository } from '../../domain/repositories/user.repository.interface.js';
import type { JwtProvider } from '../../infrastructure/auth/JwtProvider.js';
import type { PasswordService } from '../../infrastructure/auth/PasswordService.js';
import type { SignupInput } from '../dtos/schemas/auth.schema.js';
import { UseCase } from './base.use-case.js';

interface SignupResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
    name: string;
  };
}

export class SignupUseCase extends UseCase<SignupInput, SignupResponse> {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtProvider: JwtProvider
  ) {
    super();
  }

  async execute(input: SignupInput): Promise<SignupResponse> {
    const existing = await this.userRepo.getUserByEmail(input.email);
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const user = new User({ id: randomUUID(), email: input.email, name: input.name, passwordHash });
    const created = await this.userRepo.createUser(user);
    const accessToken = this.jwtProvider.generateAccessToken(created.id);
    const refreshToken = this.jwtProvider.generateRefreshToken(created.id);
    return { 
      accessToken, 
      refreshToken,
      user: {
        email: created.email,
        name: created.name,
      },
    };
  }
}
