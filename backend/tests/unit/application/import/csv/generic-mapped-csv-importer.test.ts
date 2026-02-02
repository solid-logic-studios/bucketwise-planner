import { describe, expect, it } from 'vitest';
import { GenericMappedCsvImporter } from '../../../../../src/application/import/csv/generic-mapped-csv-importer.js';

describe('GenericMappedCsvImporter', () => {
  it('parses rows by header mapping', () => {
    const importer = new GenericMappedCsvImporter();
    const content = 'Date,Amount,Description\n2026-01-01,-10.00,Coffee';
    const result = importer.parse(content, {
      timezone: 'UTC',
      defaultBucket: 'Daily Expenses',
      mapping: {
        hasHeader: true,
        dateColumn: { type: 'header', name: 'Date' },
        amountColumn: { type: 'header', name: 'Amount' },
        descriptionColumn: { type: 'header', name: 'Description' },
        dateFormat: 'YYYY-MM-DD',
      },
    });

    expect(result).toHaveLength(1);
    const row = result[0]!;
    expect(row.amountCents).toBe(1000);
    expect(row.kind).toBe('expense');
  });
});
