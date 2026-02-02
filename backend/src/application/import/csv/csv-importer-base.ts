import type { BarefootBucket } from '../../../domain/model/barefoot-bucket.js';
import { TimezoneService } from '../../../domain/services/timezone.service.js';
import type { CsvPreviewRow, ParsedCsvRow } from './csv-types.js';
import { CsvDateParser, CsvNumberParser } from './csv-normalizer.js';

export interface CsvRowNormalizationOptions {
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD.MM.YYYY';
  decimalSeparator?: '.' | ',';
  thousandsSeparator?: ',' | '.' | ' ' | '';
  defaultBucket: BarefootBucket;
}

export abstract class CsvImporterBase {
  protected normalizeRows(
    rows: ParsedCsvRow[],
    options: CsvRowNormalizationOptions
  ): CsvPreviewRow[] {
    return rows.map((row) => this.normalizeRow(row, options));
  }

  protected normalizeRow(
    row: ParsedCsvRow,
    options: CsvRowNormalizationOptions
  ): CsvPreviewRow {
    const errors: string[] = [];
    const warnings: string[] = [];
    let dateValue: string | null = null;
    let amountCents: number | null = null;
    let kind: 'income' | 'expense' | null = null;
    let occurredAt: string | null = null;
    let balanceCents: number | null = null;

    try {
      dateValue = CsvDateParser.parse(row.dateRaw, options.dateFormat);
      const { startUtc } = TimezoneService.getLocalDayBoundsUtc(dateValue, options.timezone);
      occurredAt = startUtc.toISOString();
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Date is invalid');
    }

    try {
      const amount = CsvNumberParser.parseAmount(
        row.amountRaw,
        options.decimalSeparator,
        options.thousandsSeparator
      );
      if (amount === 0) {
        warnings.push('Amount is zero');
      }
      const absoluteCents = Math.round(Math.abs(amount) * 100);
      amountCents = absoluteCents;
      kind = amount >= 0 ? 'income' : 'expense';
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Amount is invalid');
    }

    if (row.balanceRaw !== undefined) {
      try {
        const balance = CsvNumberParser.parseAmount(
          row.balanceRaw,
          options.decimalSeparator,
          options.thousandsSeparator
        );
        balanceCents = Math.round(balance * 100);
      } catch (error) {
        warnings.push(error instanceof Error ? error.message : 'Balance is invalid');
      }
    }

    const description = row.descriptionRaw.trim();
    if (!description) {
      errors.push('Description is missing');
    }

    return {
      rowIndex: row.rowIndex,
      raw: row.raw,
      date: dateValue,
      description,
      amountCents,
      kind,
      occurredAt,
      balanceCents,
      sourceBucket: options.defaultBucket,
      errors,
      warnings,
    };
  }
}
