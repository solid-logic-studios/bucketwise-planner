import type { Request, Response } from 'express';
import { createDebtSchema, updateDebtSchema } from '../../../application/dtos/schemas/debt.schema.js';
import { mortgageOverpaymentQuerySchema, upsertMortgageSchema } from '../../../application/dtos/schemas/mortgage.schema.js';
import { skipDebtPaymentSchema } from '../../../application/dtos/schemas/skip-debt-payment.schema.js';
import { CalculateMortgageOverpaymentPlanUseCase } from '../../../application/use-cases/calculate-mortgage-overpayment-plan.use-case.js';
import { CreateDebtUseCase } from '../../../application/use-cases/create-debt.use-case.js';
import { GetDebtPayoffPlanUseCase } from '../../../application/use-cases/get-debt-payoff-plan.use-case.js';
import { GetMortgageUseCase } from '../../../application/use-cases/get-mortgage.use-case.js';
import { ListDebtsUseCase } from '../../../application/use-cases/list-debts.use-case.js';
import { SkipDebtPaymentUseCase } from '../../../application/use-cases/skip-debt-payment.use-case.js';
import { UpdateDebtUseCase } from '../../../application/use-cases/update-debt.use-case.js';
import { UpsertMortgageUseCase } from '../../../application/use-cases/upsert-mortgage.use-case.js';
import { BaseController } from './base.controller.js';

/**
 * DebtController: Handles debt tracking and payoff projection endpoints.
 * Provides Barefoot snowball calculation and debt analysis.
 */
export class DebtController extends BaseController {
  constructor(
    private readonly getDebtPayoffPlanUseCase: GetDebtPayoffPlanUseCase,
    private readonly createDebtUseCase: CreateDebtUseCase,
    private readonly listDebtsUseCase: ListDebtsUseCase,
    private readonly updateDebtUseCase: UpdateDebtUseCase,
    private readonly skipDebtPaymentUseCase: SkipDebtPaymentUseCase,
    private readonly getMortgageUseCase?: GetMortgageUseCase,
    private readonly upsertMortgageUseCase?: UpsertMortgageUseCase,
    private readonly calculateMortgageOverpaymentPlanUseCase?: CalculateMortgageOverpaymentPlanUseCase
  ) {
    super();
  }

  /**
   * GET /debts/payoff-plan
   * Calculate complete debt payoff timeline using Fire Extinguisher allocation.
   * Query params: ?fortnightlyFireExtinguisherCents=92200&startDate=2026-01-03&currentFortnightId=<id>
   */
  async getPayoffPlan(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { fortnightlyFireExtinguisherCents, startDate, currentFortnightId } = req.query;

    // Default to 0 if not provided
    const fireExtinguisherCents = fortnightlyFireExtinguisherCents
      ? parseInt(fortnightlyFireExtinguisherCents as string, 10)
      : 0;

    // Parse start date if provided, otherwise undefined (use server default)
    const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
    const parsedFortnightId = currentFortnightId ? (currentFortnightId as string) : undefined;

    const result = await this.getDebtPayoffPlanUseCase.execute({
      userId,
      fortnightlyFireExtinguisherCents: fireExtinguisherCents,
      ...(parsedStartDate !== undefined && { startDate: parsedStartDate }),
      ...(parsedFortnightId !== undefined && { currentFortnightId: parsedFortnightId }),
    });

    this.sendSuccess(res, result);
  }

  async listDebts(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const debts = await this.listDebtsUseCase.execute({ userId });
    this.sendSuccess(res, debts);
  }

  async createDebt(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const validated = createDebtSchema.parse(req.body);
    const result = await this.createDebtUseCase.execute({ ...validated, userId });
    this.sendSuccess(res, result, 201);
  }

  async updateDebt(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const validated = updateDebtSchema.parse({ ...req.body, id: req.params.id });
    await this.updateDebtUseCase.execute({ ...validated, userId });
    this.sendSuccess(res, { success: true });
  }

  async skipPayment(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const validated = skipDebtPaymentSchema.parse({ ...req.body, debtId: req.params.id });
    const result = await this.skipDebtPaymentUseCase.execute({ ...validated, userId });
    this.sendSuccess(res, result, 201);
  }

  // Mortgage endpoints
  async getMortgage(req: Request, res: Response): Promise<void> {
    if (!this.getMortgageUseCase) throw new Error('Mortgage use case not wired');
    const userId = (req as any).user.id;
    const mortgage = await this.getMortgageUseCase.execute({ userId });
    this.sendSuccess(res, mortgage);
  }

  async upsertMortgage(req: Request, res: Response): Promise<void> {
    if (!this.upsertMortgageUseCase) throw new Error('Mortgage use case not wired');
    const userId = (req as any).user.id;
    const validated = upsertMortgageSchema.parse(req.body);
    const result = await this.upsertMortgageUseCase.execute({ ...validated, userId });
    this.sendSuccess(res, result, 201);
  }

  async getMortgageOverpaymentPlan(req: Request, res: Response): Promise<void> {
    if (!this.calculateMortgageOverpaymentPlanUseCase) throw new Error('Mortgage use case not wired');
    const userId = (req as any).user.id;
    const parsed = mortgageOverpaymentQuerySchema.parse({ fortnightlyFeCents: req.query.fortnightlyFeCents });
    const result = await this.calculateMortgageOverpaymentPlanUseCase.execute({ userId, ...parsed });
    this.sendSuccess(res, result);
  }
}
