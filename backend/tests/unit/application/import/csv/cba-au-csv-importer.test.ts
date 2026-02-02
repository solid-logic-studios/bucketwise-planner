import { describe, expect, it } from 'vitest';
import { CbaAuCsvImporter } from '../../../../../src/application/import/csv/cba-au-csv-importer.js';

describe('CbaAuCsvImporter', () => {
  it('parses CBA example row', () => {
    const importer = new CbaAuCsvImporter();
    const content = '31/01/2026,"+400.00","Fast Transfer From P A ATKINS & E L ATKI Overpay","+986.87"';
    const result = importer.parse(content, { timezone: 'UTC', defaultBucket: 'Daily Expenses' });

    expect(result).toHaveLength(1);
    const row = result[0]!;
    expect(row.amountCents).toBe(40000);
    expect(row.kind).toBe('income');
    expect(row.date).toBe('2026-01-31');
  });
});
