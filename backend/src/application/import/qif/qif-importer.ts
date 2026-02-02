import type { BarefootBucket } from '../../../domain/model/barefoot-bucket.js';
import type { BankCsvImporter, CsvImporterOptions } from '../csv/bank-csv-importer.interface.js';
import type { CsvPreviewRow, ParsedCsvRow } from '../csv/csv-types.js';
import { CsvImporterBase } from '../csv/csv-importer-base.js';
import { CsvDateParser } from '../csv/csv-normalizer.js';
import { QifParser } from './qif-parser.js';
import type { QifImportOptions } from './qif-types.js';

export class QifImporter extends CsvImporterBase implements BankCsvImporter {
  readonly name = 'QIF';

  canHandle(_headers: string[] | null, sampleRows: string[][]): boolean {
    return sampleRows.some((row) => row.length > 0 && row[0]?.startsWith('!Type'));
  }

  parse(content: string, options: CsvImporterOptions & QifImportOptions): CsvPreviewRow[] {
    const result = QifParser.parse(content);
    const parsedRows: ParsedCsvRow[] = result.records.map((record, index) => ({
      rowIndex: index + 1,
      raw: [record.date ?? '', record.amount ?? '', record.payee ?? '', record.memo ?? ''],
      dateRaw: record.date ?? '',
      amountRaw: record.amount ?? '',
      descriptionRaw: this.buildDescription(record.payee, record.memo),
    }));

    if ((options.qifDateFormat ?? options.dateFormat) === 'YY/MM/DD') {
      return this.normalizeQifRows(parsedRows, options);
    }

    return this.normalizeRows(parsedRows, {
      timezone: options.timezone,
      dateFormat: this.resolveDateFormat(options.qifDateFormat ?? options.dateFormat),
      decimalSeparator: '.',
      thousandsSeparator: ',',
      defaultBucket: options.defaultBucket ?? ('Daily Expenses' as BarefootBucket),
    });
  }

  private resolveDateFormat(format?: string): 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD.MM.YYYY' {
    if (format === 'YY/MM/DD') return 'YYYY-MM-DD';
    if (format === 'DD/MM/YYYY' || format === 'MM/DD/YYYY' || format === 'YYYY-MM-DD' || format === 'DD.MM.YYYY') {
      return format;
    }
    return 'DD/MM/YYYY';
  }

  private normalizeQifRows(
    rows: ParsedCsvRow[],
    options: CsvImporterOptions & QifImportOptions
  ): CsvPreviewRow[] {
    return rows.map((row) => {
      const updated = { ...row };
      try {
        updated.dateRaw = CsvDateParser.parseTwoDigitYear(row.dateRaw, 'YY/MM/DD');
      } catch {
        updated.dateRaw = row.dateRaw;
      }
      return this.normalizeRow(updated, {
        timezone: options.timezone,
        dateFormat: 'YYYY-MM-DD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        defaultBucket: options.defaultBucket ?? ('Daily Expenses' as BarefootBucket),
      });
    });
  }

  private buildDescription(payee?: string, memo?: string): string {
    if (payee && memo) return `${payee} - ${memo}`;
    return payee || memo || '';
  }
}
