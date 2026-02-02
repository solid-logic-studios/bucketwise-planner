import type { Request, Response } from 'express';
import type { GetDashboardUseCase } from '../../../application/use-cases/get-dashboard.use-case.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';
import { BaseController } from './base.controller.js';

/**
 * DashboardController: Handles aggregated financial dashboard requests.
 * Provides single endpoint for consolidated view of fortnight, debts, and projections.
 * 
 * @extends BaseController
 * @example
 * ```typescript
 * const controller = new DashboardController(getDashboardUseCase);
 * app.get('/dashboard', controller.getDashboard.bind(controller));
 * ```
 */
export class DashboardController extends BaseController {
  constructor(private getDashboardUseCase: GetDashboardUseCase) {
    super();
  }

  /**
   * GET /dashboard?currentFortnightId=xxx
   * Returns aggregated dashboard with current fortnight breakdown, debts, and projections.
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.id;
    const { currentFortnightId } = req.query;

    const request = {
      userId,
      ...(currentFortnightId && { currentFortnightId: currentFortnightId as string }),
    };

    const dashboard = await this.getDashboardUseCase.execute(request);

    this.sendSuccess(res, dashboard);
  }
}
