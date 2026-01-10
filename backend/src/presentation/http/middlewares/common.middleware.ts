import type { NextFunction, Request, Response } from 'express';

/**
 * RequestLoggingMiddleware: Logs all incoming HTTP requests.
 * Useful for debugging and monitoring API usage.
 * Logs: method, path, timestamp, IP address.
 * 
 * @example
 * ```typescript
 * app.use(requestLoggingMiddleware);
 * ```
 */
export function requestLoggingMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const ip = req.ip || 'unknown';
  const method = req.method;
  const path = req.path;

  console.log(`[${new Date().toISOString()}] ${method} ${path} from ${ip}`);

  // Log response time (approximate)
  setImmediate(() => {
    const duration = Date.now() - start;
    console.log(`  → Processed in ${duration}ms`);
  });

  next();
}

/**
 * CorsPrefixMiddleware: Handle CORS preflight requests (simplified).
 * For production, use 'cors' package instead.
 * 
 * @example
 * ```typescript
 * app.use(corsPrefixMiddleware);
 * ```
 */
export function corsPrefixMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Allow requests from any origin (adjust for production)
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}

/**
 * ContentTypeMiddleware: Ensure all responses are JSON.
 * Sets Content-Type header for consistency.
 * 
 * @example
 * ```typescript
 * app.use(contentTypeMiddleware);
 * ```
 */
export function contentTypeMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
}
