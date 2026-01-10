import { Router } from 'express';
import type { DashboardController } from '../controllers/dashboard.controller.js';

/**
 * buildDashboardRouter: Create dashboard routes.
 * 
 * @param controller - DashboardController instance
 * @returns Express Router with dashboard endpoints
 * @example
 * ```typescript
 * const router = buildDashboardRouter(dashboardController);
 * app.use('/dashboard', router);
 * ```
 */
export function buildDashboardRouter(
  controller: DashboardController
): Router {
  const router = Router();

  router.get(
    '/',
    controller.asyncHandler((req, res) => controller.getDashboard(req, res))
  );

  return router;
}
