import { Router } from 'express';
import { recordTransactionSchema } from '../../../application/dtos/schemas/record-transaction.schema.js';
import { updateTransactionSchema } from '../../../application/dtos/schemas/update-transaction.schema.js';
import { TransactionController } from '../controllers/transaction.controller.js';
import { validationMiddleware } from '../middlewares/validation.middleware.js';

/**
 * buildTransactionRouter: Creates Express router for transaction endpoints.
 * Wires controller methods with validation middleware and async error handling.
 *
 * Routes:
 * POST /transactions - Record a new transaction
 * PUT /transactions/:id - Update an existing transaction
 * DELETE /transactions/:id - Delete an existing transaction
 */
export function buildTransactionRouter(
  controller: TransactionController
): Router {
  const router = Router();

  router.post(
    '/',
    validationMiddleware(recordTransactionSchema),
    controller.asyncHandler((req, res) => controller.recordTransaction(req, res))
  );

  router.put(
    '/:id',
    controller.asyncHandler(async (req, res) => {
      // Manually validate since ID comes from params, not body
      try {
        const validated = updateTransactionSchema.parse({
          id: req.params.id,
          ...req.body,
        });
        req.body = validated; // Store validated data back in body
      } catch (error) {
        throw error; // Re-throw validation errors for asyncHandler to catch
      }
      return controller.updateTransaction(req, res);
    })
  );

  router.delete(
    '/:id',
    controller.asyncHandler((req, res) => controller.deleteTransaction(req, res))
  );

  return router;
}
