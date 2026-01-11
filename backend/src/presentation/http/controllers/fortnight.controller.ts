import type { Request, Response } from 'express';
import { createFortnightSchema } from '../../../application/dtos/schemas/create-fortnight.schema.js';
import { CreateFortnightUseCase } from '../../../application/use-cases/create-fortnight.use-case.js';
import { GetFortnightUseCase } from '../../../application/use-cases/get-fortnight.use-case.js';
import { ListForthnightsUseCase } from '../../../application/use-cases/list-fortnights.use-case.js';
import { ListSkippedDebtPaymentsUseCase } from '../../../application/use-cases/list-skipped-debt-payments.use-case.js';
import { ListTransactionsUseCase } from '../../../application/use-cases/list-transactions.use-case.js';
import { ValidationError } from '../../../domain/exceptions/validation-error.js';
import { toSingleString } from '../utils/request-helpers.js';
import { BaseController } from './base.controller.js';

/**
 * FortnightController: Handles fortnight lifecycle operations.
 * Creates new fortnight snapshots with allocations and retrieves fortnight details.
 */
export class FortnightController extends BaseController {
  constructor(
    private createFortnightUseCase: CreateFortnightUseCase,
    private getFortnightUseCase: GetFortnightUseCase,
    private listForthnightsUseCase: ListForthnightsUseCase,
    private listTransactionsUseCase: ListTransactionsUseCase,
    private listSkippedDebtPaymentsUseCase: ListSkippedDebtPaymentsUseCase
  ) {
    super();
  }

  /**
   * POST /fortnights
   * Create a new fortnight period with allocations.
   */
  async createFortnight(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const validated = createFortnightSchema.parse(req.body);

    const result = await this.createFortnightUseCase.execute({
      userId,
      periodStart: validated.periodStart,
      periodEnd: validated.periodEnd,
      allocations: validated.allocations,
    });

    this.sendCreated(res, { fortnightId: result.fortnightId });
  }

  /**
   * GET /fortnights
   * List all fortnights sorted by date (newest first).
   */
  async listFortnights(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const result = await this.listForthnightsUseCase.execute({ userId });
    this.sendSuccess(res, result);
  }

  /**
   * GET /fortnights/:id
   * Get detailed fortnight summary with bucket breakdowns.
   */
  async getFortnight(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const id = toSingleString(req.params.id);

    if (!id) {
      throw new ValidationError('Fortnight ID is required');
    }

    const result = await this.getFortnightUseCase.execute({
      userId,
      fortnightId: id,
    });

    this.sendSuccess(res, result);
  }

  /**
   * GET /fortnights/:id/skipped-debt-payments
   * List skipped debt payments for the given fortnight.
   */
  async listSkippedDebtPayments(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const id = toSingleString(req.params.id);

    if (!id) {
      throw new ValidationError('Fortnight ID is required');
    }

    const result = await this.listSkippedDebtPaymentsUseCase.execute({ userId, fortnightId: id });

    this.sendSuccess(res, result);
  }

  /**
   * GET /transactions
   * List transactions with optional filters.
   * Query params: ?bucket=DailyExpenses&fortnightId=fortnight-1&startDate=2026-01-03&endDate=2026-01-17&kind=expense&limit=50&offset=0
   */
  async listTransactions(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const bucket = req.query.bucket as string | undefined;
    const fortnightId = req.query.fortnightId as string | undefined;
    const kind = req.query.kind as string | undefined;
    const startDateStr = req.query.startDate as string | undefined;
    const endDateStr = req.query.endDate as string | undefined;
    const limitStr = req.query.limit as string | undefined;
    const offsetStr = req.query.offset as string | undefined;

    // Parse dates if provided
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Parse pagination params
    const limit = limitStr ? Math.max(1, parseInt(limitStr, 10)) : 50;
    const offset = offsetStr ? Math.max(0, parseInt(offsetStr, 10)) : 0;

    const result = await this.listTransactionsUseCase.execute({
      userId,
      ...(bucket && { bucket }),
      ...(fortnightId && { fortnightId }),
      ...(kind && { kind }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      limit,
      offset,
    });

    this.sendSuccess(res, result);
  }
}

