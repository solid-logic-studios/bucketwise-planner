import type { BankCsvImporter, CsvImporterOptions } from './bank-csv-importer.interface.js';
import { CsvParser } from './csv-parser.js';
import type { CsvPreviewRow, ParsedCsvRow } from './csv-types.js';
import { CsvImporterBase } from './csv-importer-base.js';

export class CbaAuCsvImporter extends CsvImporterBase implements BankCsvImporter {
  readonly name = 'Commonwealth Bank AU';

  canHandle(_headers: string[] | null, sampleRows: string[][]): boolean {
    if (sampleRows.length === 0) return false;
    const row = sampleRows[0];
    if (!row) return false;
    if (row.length < 4) return false;
    const dateValue = row[0] || '';
    const amountValue = row[1] || '';
    return /\d{1,2}\/\d{1,2}\/\d{4}/.test(dateValue) && /[+-]?\d/.test(amountValue);
  }

  parse(content: string, options: CsvImporterOptions): CsvPreviewRow[] {
    const rows = CsvParser.parse(content, ',').rows;
    const parsedRows: ParsedCsvRow[] = rows
      .filter((row) => row.some((value) => value.trim() !== ''))
      .map((row, index) => {
        const balanceRaw = row[3];
        return {
          rowIndex: index + 1,
          raw: row,
          dateRaw: row[0] ?? '',
          amountRaw: row[1] ?? '',
          descriptionRaw: row[2] ?? '',
          ...(balanceRaw !== undefined ? { balanceRaw } : {}),
        };
      });

    return this.normalizeRows(parsedRows, {
      timezone: options.timezone,
      dateFormat: 'DD/MM/YYYY',
      decimalSeparator: '.',
      thousandsSeparator: ',',
      defaultBucket: options.defaultBucket,
    });
  }
}
