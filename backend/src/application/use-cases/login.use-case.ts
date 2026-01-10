import type { UserRepository } from '../../domain/repositories/user.repository.interface.js';
import type { JwtProvider } from '../../infrastructure/auth/JwtProvider.js';
import type { PasswordService } from '../../infrastructure/auth/PasswordService.js';
import type { LoginInput } from '../dtos/schemas/auth.schema.js';
import { UseCase } from './base.use-case.js';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
    name: string;
  };
}

export class LoginUseCase extends UseCase<LoginInput, LoginResponse> {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtProvider: JwtProvider
  ) {
    super();
  }

  async execute(input: LoginInput): Promise<LoginResponse> {
    const user = await this.userRepo.getUserByEmail(input.email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }
    const ok = await this.passwordService.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new Error('INVALID_CREDENTIALS');
    }
    const accessToken = this.jwtProvider.generateAccessToken(user.id);
    const refreshToken = this.jwtProvider.generateRefreshToken(user.id);
    return { 
      accessToken, 
      refreshToken,
      user: {
        email: user.email,
        name: user.name,
      },
    };
  }
}
