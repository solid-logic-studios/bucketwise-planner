import { Router } from 'express';
import { createFortnightSchema } from '../../../application/dtos/schemas/create-fortnight.schema.js';
import { FortnightController } from '../controllers/fortnight.controller.js';
import { validationMiddleware } from '../middlewares/validation.middleware.js';

/**
 * buildFortnightRouter: Creates Express router for fortnight endpoints.
 * Routes:
 * POST /fortnights - Create a fortnight snapshot with allocations
 * GET /fortnights/:id - Get fortnight details with bucket breakdowns
 * GET /transactions - List transactions with optional filters
 */
export function buildFortnightRouter(
  controller: FortnightController
): Router {
  const router = Router();

  router.post(
    '/',
    validationMiddleware(createFortnightSchema),
    controller.asyncHandler((req, res) => controller.createFortnight(req, res))
  );

  router.get(
    '/',
    controller.asyncHandler((req, res) => controller.listFortnights(req, res))
  );

  router.get(
    '/:id/skipped-debt-payments',
    controller.asyncHandler((req, res) => controller.listSkippedDebtPayments(req, res))
  );

  router.get(
    '/:id',
    controller.asyncHandler((req, res) => controller.getFortnight(req, res))
  );

  return router;
}

/**
 * buildTransactionRouter: Creates Express router for transaction query endpoints.
 * Routes:
 * GET /transactions - List transactions with optional bucket/fortnightId filters
 */
export function buildTransactionRouter(
  controller: FortnightController
): Router {
  const router = Router();

  router.get(
    '/',
    controller.asyncHandler((req, res) => controller.listTransactions(req, res))
  );

  return router;
}

