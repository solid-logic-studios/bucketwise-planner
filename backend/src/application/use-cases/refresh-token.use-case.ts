import type { JwtProvider } from '../../infrastructure/auth/JwtProvider.js';
import { UseCase } from './base.use-case.js';

interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
}

export class RefreshTokenUseCase extends UseCase<RefreshRequest, RefreshResponse> {
  constructor(private readonly jwtProvider: JwtProvider) {
    super();
  }

  async execute(input: RefreshRequest): Promise<RefreshResponse> {
    const payload = this.jwtProvider.verifyRefreshToken(input.refreshToken);
    const accessToken = this.jwtProvider.generateAccessToken(payload.userId);
    return { accessToken };
  }
}
