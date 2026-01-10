import { Router } from 'express';
import { createDebtSchema, updateDebtBodySchema } from '../../../application/dtos/schemas/debt.schema.js';
import { upsertMortgageSchema } from '../../../application/dtos/schemas/mortgage.schema.js';
import { skipDebtPaymentBodySchema } from '../../../application/dtos/schemas/skip-debt-payment.schema.js';
import { DebtController } from '../controllers/debt.controller.js';
import { validationMiddleware } from '../middlewares/validation.middleware.js';

/**
 * buildDebtRouter: Creates Express router for debt endpoints.
 * Routes:
 * GET /debts - List debts
 * GET /debts/payoff-plan - Get debt payoff timeline using Barefoot snowball method
 * POST /debts - Create a debt
 * PUT /debts/:id - Update a debt
 */
export function buildDebtRouter(controller: DebtController): Router {
  const router = Router();

  router.get(
    '/',
    controller.asyncHandler((req, res) => controller.listDebts(req, res))
  );

  router.get(
    '/payoff-plan',
    controller.asyncHandler((req, res) => controller.getPayoffPlan(req, res))
  );

  router.post(
    '/',
    validationMiddleware(createDebtSchema),
    controller.asyncHandler((req, res) => controller.createDebt(req, res))
  );

  // Mortgage endpoints (must come before /:id routes)
  router.get(
    '/mortgage/overpayment-plan',
    controller.asyncHandler((req, res) => controller.getMortgageOverpaymentPlan(req, res))
  );

  router.get(
    '/mortgage',
    controller.asyncHandler((req, res) => controller.getMortgage(req, res))
  );

  router.put(
    '/mortgage',
    validationMiddleware(upsertMortgageSchema),
    controller.asyncHandler((req, res) => controller.upsertMortgage(req, res))
  );

  router.post(
    '/:id/skip-payment',
    validationMiddleware(skipDebtPaymentBodySchema),
    controller.asyncHandler((req, res) => controller.skipPayment(req, res))
  );

  router.put(
    '/:id',
    validationMiddleware(updateDebtBodySchema),
    controller.asyncHandler((req, res) => controller.updateDebt(req, res))
  );

  return router;
}
