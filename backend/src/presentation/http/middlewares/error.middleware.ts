import type { NextFunction, Request, Response } from 'express';
import { ErrorMapper } from '../../../application/errors/error-mapper.js';
import { ResponseFormatter } from '../utils/response-formatter.js';

/**
 * GlobalErrorMiddleware: Catch-all error handler for Express.
 * Converts any error to an ApiResponse and sends it to the client.
 * Should be registered as the last middleware in Express.
 * 
 * Express error handlers are identified by having 4 parameters (err, req, res, next).
 * 
 * @example
 * ```typescript
 * app.use(globalErrorMiddleware);
 * ```
 */
export function globalErrorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const appError = ErrorMapper.mapError(error, isDevelopment);

  const response = ResponseFormatter.error(
    appError.code || 'ERROR',
    appError.message,
    appError.details
  );

  res.status(appError.statusCode).json(response);
}

/**
 * NotFoundMiddleware: Handle 404 responses for unmatched routes.
 * Should be registered after all route handlers.
 * 
 * @example
 * ```typescript
 * app.use(notFoundMiddleware);
 * app.use(globalErrorMiddleware); // After 404 handler
 * ```
 */
export function notFoundMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const response = ResponseFormatter.error(
    'NOT_FOUND',
    `Route ${req.method} ${req.path} not found`
  );

  res.status(404).json(response);
}
