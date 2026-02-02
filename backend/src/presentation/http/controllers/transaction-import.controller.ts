import type { Request, Response } from 'express';
import { commitTransactionCsvImportSchema } from '../../../application/dtos/schemas/commit-transaction-csv-import.schema.js';
import { previewTransactionCsvImportSchema } from '../../../application/dtos/schemas/preview-transaction-csv-import.schema.js';
import type { CommitTransactionCsvImportUseCase } from '../../../application/use-cases/commit-transaction-csv-import.use-case.js';
import type { PreviewTransactionCsvImportUseCase } from '../../../application/use-cases/preview-transaction-csv-import.use-case.js';
import { ValidationError } from '../../../domain/exceptions/validation-error.js';
import type { CsvMappingInput } from '../../../application/import/csv/csv-types.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';
import { BaseController } from './base.controller.js';

export class TransactionImportController extends BaseController {
  constructor(
    private readonly previewCsvUseCase: PreviewTransactionCsvImportUseCase,
    private readonly commitCsvUseCase: CommitTransactionCsvImportUseCase
  ) {
    super();
  }

  async previewCsv(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.id;
    const file = req.file;


    if (!file) {
      throw new ValidationError('CSV file is required');
    }

    const mappingRaw = this.parseMapping(req.body?.mapping);
    const payload = previewTransactionCsvImportSchema.parse({
      formatPreset: req.body?.formatPreset ?? req.body?.formatpreset,
      ...(mappingRaw ? { mapping: mappingRaw as CsvMappingInput } : {}),
      defaultBucket: req.body?.defaultBucket ?? req.body?.defaultbucket,
      qifDateFormat: req.body?.qifDateFormat ?? req.body?.qifdateformat,
    });

    const request = {
      userId,
      content: file.buffer.toString('utf-8'),
      ...(payload.formatPreset ? { formatPreset: payload.formatPreset } : {}),
      ...(payload.mapping ? { mapping: payload.mapping as CsvMappingInput } : {}),
      ...(payload.defaultBucket ? { defaultBucket: payload.defaultBucket } : {}),
      ...(payload.qifDateFormat ? { qifDateFormat: payload.qifDateFormat } : {}),
    };

    const result = await this.previewCsvUseCase.execute(request);

    this.sendSuccess(res, result);
  }

  private parseMapping(raw: unknown): unknown | undefined {
    if (!raw) return undefined;
    if (typeof raw !== 'string') {
      throw new ValidationError('Invalid mapping JSON');
    }

    try {
      return JSON.parse(raw) as unknown;
    } catch {
      throw new ValidationError('Invalid mapping JSON');
    }
  }

  async commitCsv(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.id;
    const payload = commitTransactionCsvImportSchema.parse(req.body);

    const result = await this.commitCsvUseCase.execute({
      userId,
      rows: payload.rows.map((row) => ({ ...row, tags: row.tags ?? [] })),
      skipDuplicates: payload.skipDuplicates ?? false,
    });

    this.sendSuccess(res, result);
  }
}
