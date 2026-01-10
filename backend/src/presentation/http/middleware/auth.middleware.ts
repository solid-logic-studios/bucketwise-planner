import type { NextFunction, Request, Response } from 'express';
import type { JwtProvider } from '../../../infrastructure/auth/JwtProvider.js';
import type { TokenBlacklist } from '../../../infrastructure/auth/TokenBlacklist.js';

/**
 * Auth middleware: protects routes by verifying JWT access tokens.
 * Sets req.user = { id, email } on success; returns 401 on failure.
 * Checks token blacklist for revoked tokens (logout).
 */
export function createAuthMiddleware(
  jwtProvider: JwtProvider,
  tokenBlacklist: TokenBlacklist
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: { message: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' },
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Check if token is blacklisted (user logged out)
        if (tokenBlacklist.has(token)) {
        res.status(401).json({
          success: false,
          error: { message: 'Token has been revoked', code: 'TOKEN_REVOKED' },
        });
        return;
      }

      // Verify token
      const payload = jwtProvider.verifyAccessToken(token);
      
      // Attach user to request
        (req as any).user = {
          id: payload.userId,
        };

      next();
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' },
      });
    }
  };
}
