import type { Request, Response } from 'express';
import type { z } from 'zod';
import { recordTransactionSchema } from '../../../application/dtos/schemas/record-transaction.schema.js';
import { updateTransactionSchema } from '../../../application/dtos/schemas/update-transaction.schema.js';
import type { TransactionDTO } from '../../../application/dtos/transaction.dto.js';
import { DeleteTransactionUseCase } from '../../../application/use-cases/delete-transaction.use-case.js';
import { RecordTransactionUseCase } from '../../../application/use-cases/record-transaction.use-case.js';
import { UpdateTransactionUseCase } from '../../../application/use-cases/update-transaction.use-case.js';
import { toSingleString } from '../utils/request-helpers.js';
import { BaseController } from './base.controller.js';

/**
 * TransactionController: HTTP endpoint handlers for transaction operations.
 * Handles requests to record, update, and delete financial transactions.
 * Extends BaseController for consistent error handling and response formatting.
 * 
 * @extends BaseController
 * @example
 * ```typescript
 * const controller = new TransactionController(recordUseCase, updateUseCase, deleteUseCase);
 * router.post('/transactions', controller.asyncHandler(
 *   (req, res) => controller.recordTransaction(req, res)
 * ));
 * ```
 */
export class TransactionController extends BaseController {
  /**
   * Initialize with use case dependencies.
   * @param recordTransactionUseCase - Use case for recording transactions
   * @param updateTransactionUseCase - Use case for updating transactions
   * @param deleteTransactionUseCase - Use case for deleting transactions
   */
  constructor(
    private recordTransactionUseCase: RecordTransactionUseCase,
    private updateTransactionUseCase: UpdateTransactionUseCase,
    private deleteTransactionUseCase: DeleteTransactionUseCase
  ) {
    super();
  }

  /**
   * POST /transactions
   * Record a new income, expense, or transfer transaction.
   * 
   * @param req - Express request with validated body
   * @param res - Express response object
   * @throws ValidationError if input is invalid
   * @throws DomainError if business rule is violated (e.g., transfer source === destination)
   */
  async recordTransaction(req: Request, res: Response): Promise<void> {
    // Validate input using Zod schema (validated.sourceBucket is already BarefootBucket type)
    const userId = (req as any).user.id;
    const validated = recordTransactionSchema.parse(req.body);

    // Execute use case with validated types
    const result = await this.recordTransactionUseCase.execute({
      userId,
      sourceBucket: validated.sourceBucket,
      destinationBucket: validated.destinationBucket || null,
      kind: validated.kind,
      description: validated.description,
      amountCents: validated.amountCents,
      occurredAt: validated.occurredAt,
      tags: validated.tags || [],
      debtId: validated.debtId,
    });

    // Format and send response
    const response: TransactionDTO = {
      id: result.transactionId,
      bucket: validated.sourceBucket,
      sourceBucket: validated.sourceBucket,
      destinationBucket: validated.destinationBucket || null,
      kind: validated.kind,
      description: validated.description,
      amountCents: validated.amountCents,
      occurredAt: validated.occurredAt.toISOString(),
      tags: validated.tags || [],
    };

    this.sendCreated(res, response);
  }

  /**
   * PUT /transactions/:id
   * Update an existing transaction (income, expense, or transfer).
   * 
   * @param req - Express request with transaction ID in params and updated data in body
   * @param res - Express response object
   * @throws ValidationError if input is invalid
   * @throws DomainError if transaction not found or business rule violated
   */
  async updateTransaction(req: Request, res: Response): Promise<void> {
    // Body is already validated by route handler (Zod parsed it with proper BarefootBucket types)
    const userId = (req as any).user.id;
    const validated = req.body as z.infer<typeof updateTransactionSchema>;

    // Execute use case with validated types
    const result = await this.updateTransactionUseCase.execute({
      userId,
      id: validated.id,
      sourceBucket: validated.sourceBucket,
      destinationBucket: validated.destinationBucket || null,
      kind: validated.kind,
      description: validated.description,
      amountCents: validated.amountCents,
      occurredAt: validated.occurredAt instanceof Date ? validated.occurredAt : new Date(validated.occurredAt),
      ...(validated.tags && { tags: validated.tags }),
    });
    this.sendSuccess(res, result);
  }

  /**
   * DELETE /transactions/:id
   * Delete an existing transaction.
   * 
   * @param req - Express request with transaction ID in params
   * @param res - Express response object
   * @throws DomainError if transaction not found
   */
  async deleteTransaction(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const id = toSingleString(req.params.id);
    
    if (!id) {
      res.status(400).json({ success: false, error: { message: 'Transaction ID is required', code: 'MISSING_ID' } });
      return;
    }

    // Execute use case
    const result = await this.deleteTransactionUseCase.execute({ userId, id });

    this.sendSuccess(res, result);
  }
}
