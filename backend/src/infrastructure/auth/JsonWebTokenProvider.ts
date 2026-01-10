import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JwtProvider, JwtPayload } from './JwtProvider.js';

function getEnv(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (!val) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

export class JsonWebTokenProvider implements JwtProvider {
  private accessSecret: string;
  private refreshSecret: string;

  constructor() {
    // Prefer dedicated secrets if set, fallback to JWT_SECRET
    this.accessSecret = process.env.JWT_ACCESS_SECRET || getEnv('JWT_SECRET');
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || this.accessSecret;
  }

  generateAccessToken(userId: string, expiresIn = '15m'): string {
    return jwt.sign({ userId }, this.accessSecret, { expiresIn } as SignOptions);
  }

  generateRefreshToken(userId: string, expiresIn = '7d'): string {
    return jwt.sign({ userId }, this.refreshSecret, { expiresIn } as SignOptions);
  }

  verifyAccessToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.accessSecret) as JwtPayload;
    return { userId: decoded.userId };
  }

  verifyRefreshToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.refreshSecret) as JwtPayload;
    return { userId: decoded.userId };
  }
}
