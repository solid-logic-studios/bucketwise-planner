import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ZodError } from 'zod';

/**
 * ValidationMiddleware: Validate request bodies using Zod schemas.
 * Attaches parsed data to req.body on success; throws on failure.
 * 
 * @param schema - Zod schema for validation
 * @example
 * ```typescript
 * router.post('/transactions', validationMiddleware(recordTransactionSchema), handler);
 * ```
 */
export function validationMiddleware(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(new Error('Unknown validation error'));
      }
    }
  };
}
