import { ValidationError } from '../../domain/exceptions/validation-error.js';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository.interface.js';
import type { BarefootBucket } from '../../domain/model/barefoot-bucket.js';
import { UseCase } from './base.use-case.js';
import { RecordTransactionUseCase } from './record-transaction.use-case.js';

interface CommitCsvRow {
  rowIndex: number;
  occurredAt: string;
  kind: 'income' | 'expense';
  amountCents: number;
  description: string;
  sourceBucket: BarefootBucket;
  tags: string[];
}

export interface CommitTransactionCsvImportRequest {
  userId: string;
  rows: CommitCsvRow[];
  skipDuplicates: boolean;
}

export interface CommitTransactionCsvImportResult {
  created: number;
  skipped: number;
  failed: Array<{ rowIndex: number; message: string }>;
}

export class CommitTransactionCsvImportUseCase extends UseCase<
  CommitTransactionCsvImportRequest,
  CommitTransactionCsvImportResult
> {
  constructor(
    private readonly recordTransactionUseCase: RecordTransactionUseCase,
    private readonly transactionRepository: TransactionRepository
  ) {
    super();
  }

  async execute(request: CommitTransactionCsvImportRequest): Promise<CommitTransactionCsvImportResult> {
    if (!request.rows.length) {
      throw new ValidationError('No rows provided for import');
    }

    const existingSignatures = request.skipDuplicates
      ? await this.loadExistingSignatures(request.userId, request.rows)
      : new Set<string>();

    let created = 0;
    let skipped = 0;
    const failed: Array<{ rowIndex: number; message: string }> = [];

    for (const row of request.rows) {
      const signature = this.buildSignature(row);
      if (request.skipDuplicates && existingSignatures.has(signature)) {
        skipped += 1;
        continue;
      }

      try {
        await this.recordTransactionUseCase.execute({
          userId: request.userId,
          sourceBucket: row.sourceBucket,
          destinationBucket: null,
          kind: row.kind,
          description: row.description,
          amountCents: row.amountCents,
          occurredAt: new Date(row.occurredAt),
          tags: row.tags,
          debtId: undefined,
        });
        created += 1;
      } catch (error) {
        failed.push({
          rowIndex: row.rowIndex,
          message: error instanceof Error ? error.message : 'Failed to import row',
        });
      }
    }

    return { created, skipped, failed };
  }

  private async loadExistingSignatures(userId: string, rows: CommitCsvRow[]): Promise<Set<string>> {
    const dateValues = rows
      .map((row) => new Date(row.occurredAt))
      .filter((date) => !Number.isNaN(date.getTime()));

    if (dateValues.length === 0) {
      return new Set<string>();
    }

    const minDate = new Date(Math.min(...dateValues.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dateValues.map((d) => d.getTime())));
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + 1);

    const existing = await this.transactionRepository.findByDateRange(userId, minDate, endDate);
    return new Set(
      existing.map((tx) =>
        `${tx.occurredAt.toISOString()}|${tx.amount.cents}|${tx.description.trim().toLowerCase()}`
      )
    );
  }

  private buildSignature(row: CommitCsvRow): string {
    return `${row.occurredAt}|${row.amountCents}|${row.description.trim().toLowerCase()}`;
  }
}
