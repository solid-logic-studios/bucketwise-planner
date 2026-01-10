import type { Pool } from 'pg';
import { UseCase } from './base.use-case.js';

interface ExportDataResponse {
  transactions: unknown[];
  fortnightSnapshots: unknown[];
  debts: unknown[];
  budgetProfiles: unknown[];
  skippedDebtPayments: unknown[];
}

/**
 * ExportDataUseCase: Dumps all PostgreSQL-backed data tables to JSON.
 * Note: Only available when STORAGE_METHOD=postgres. In-memory storage cannot be exported.
 */
export class ExportDataUseCase extends UseCase<void, ExportDataResponse> {
  constructor(private readonly pool: Pool | null) {
    super();
  }

  async execute(): Promise<ExportDataResponse> {
    if (!this.pool) {
      throw new Error('EXPORT_UNAVAILABLE_IN_MEMORY');
    }

    const client = await this.pool.connect();
    try {
      const transactions = await client.query('SELECT * FROM transactions ORDER BY occurred_at ASC');
      const fortnightSnapshots = await client.query('SELECT * FROM fortnight_snapshots ORDER BY period_start ASC');
      const debts = await client.query('SELECT * FROM debts ORDER BY priority ASC, created_at ASC');
      const budgetProfiles = await client.query('SELECT * FROM budget_profiles');
      const skippedDebtPayments = await client.query('SELECT * FROM skipped_debt_payments ORDER BY payment_date ASC');

      return {
        transactions: transactions.rows,
        fortnightSnapshots: fortnightSnapshots.rows,
        debts: debts.rows,
        budgetProfiles: budgetProfiles.rows,
        skippedDebtPayments: skippedDebtPayments.rows,
      };
    } finally {
      client.release();
    }
  }
}
