import { UseCase } from './base.use-case.js';
import { TokenBlacklist } from '../../infrastructure/auth/TokenBlacklist.js';

interface LogoutRequest {
  accessToken: string;
}

interface LogoutResponse {
  success: boolean;
}

export class LogoutUseCase extends UseCase<LogoutRequest, LogoutResponse> {
  constructor(private readonly blacklist: TokenBlacklist) {
    super();
  }

  async execute(input: LogoutRequest): Promise<LogoutResponse> {
    this.blacklist.add(input.accessToken);
    return { success: true };
  }
}
