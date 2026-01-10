import type { Request, Response } from 'express';
import { BaseController } from './base.controller.js';
import { signupSchema, loginSchema } from '../../../application/dtos/schemas/auth.schema.js';
import { SignupUseCase } from '../../../application/use-cases/signup.use-case.js';
import { LoginUseCase } from '../../../application/use-cases/login.use-case.js';
import { LogoutUseCase } from '../../../application/use-cases/logout.use-case.js';
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token.use-case.js';

export class AuthController extends BaseController {
  constructor(
    private readonly signupUC: SignupUseCase,
    private readonly loginUC: LoginUseCase,
    private readonly logoutUC: LogoutUseCase,
    private readonly refreshUC: RefreshTokenUseCase
  ) {
    super();
  }

  async signup(req: Request, res: Response): Promise<void> {
    const parsed = signupSchema.parse(req.body);
    const result = await this.signupUC.execute(parsed);
    res.setHeader('x-refresh-token', result.refreshToken);
    this.sendCreated(res, result);
  }

  async login(req: Request, res: Response): Promise<void> {
    const parsed = loginSchema.parse(req.body);
    const result = await this.loginUC.execute(parsed);
    res.setHeader('x-refresh-token', result.refreshToken);
    this.sendSuccess(res, result);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const auth = (req.headers['authorization'] || '') as string;
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const result = await this.logoutUC.execute({ accessToken: token });
    this.sendSuccess(res, result);
  }

  async refresh(req: Request, res: Response): Promise<void> {
    // Prefer header to avoid requiring cookie-parser; clients can still store cookie if desired
    const refreshToken = (req.headers['x-refresh-token'] || '') as string;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: { code: 'MISSING_REFRESH_TOKEN', message: 'x-refresh-token header required' } });
      return;
    }
    const result = await this.refreshUC.execute({ refreshToken });
    this.sendSuccess(res, result);
  }
}
