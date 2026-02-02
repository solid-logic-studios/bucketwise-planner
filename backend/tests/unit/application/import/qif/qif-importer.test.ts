import { describe, expect, it } from 'vitest';
import { QifImporter } from '../../../../../src/application/import/qif/qif-importer.js';

describe('QifImporter', () => {
  it('parses QIF into preview rows', () => {
    const importer = new QifImporter();
    const content = '!Type:Bank\nD31/01/2026\nT-12.34\nPCoffee\n^';
    const rows = importer.parse(content, {
      timezone: 'UTC',
      defaultBucket: 'Daily Expenses',
      qifDateFormat: 'DD/MM/YYYY',
    });

    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.amountCents).toBe(1234);
    expect(row.kind).toBe('expense');
    expect(row.date).toBe('2026-01-31');
  });
});
