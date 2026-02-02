import type { BarefootBucket } from '../../../domain/model/barefoot-bucket.js';

export type CsvDelimiter = ',' | ';' | '\t' | '|';

export type CsvDateFormat =
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY-MM-DD'
  | 'DD.MM.YYYY'
  | 'AUTO';

export type CsvColumnSelector =
  | { type: 'index'; index: number }
  | { type: 'header'; name: string };

export interface CsvMappingConfig {
  delimiter?: CsvDelimiter;
  hasHeader?: boolean;
  dateColumn: CsvColumnSelector;
  amountColumn: CsvColumnSelector;
  descriptionColumn: CsvColumnSelector;
  balanceColumn?: CsvColumnSelector;
  dateFormat?: CsvDateFormat;
  decimalSeparator?: '.' | ',';
  thousandsSeparator?: ',' | '.' | ' ' | '';
}

export interface CsvMappingInput {
  delimiter?: CsvDelimiter;
  hasHeader?: boolean;
  dateColumn: string | number;
  amountColumn: string | number;
  descriptionColumn: string | number;
  balanceColumn?: string | number;
  dateFormat?: CsvDateFormat;
  decimalSeparator?: '.' | ',';
  thousandsSeparator?: ',' | '.' | ' ' | '';
}

export interface ParsedCsvRow {
  rowIndex: number;
  raw: string[];
  dateRaw: string;
  amountRaw: string;
  descriptionRaw: string;
  balanceRaw?: string;
}

export interface CsvPreviewRow {
  rowIndex: number;
  raw: string[];
  date: string | null;
  description: string;
  amountCents: number | null;
  kind: 'income' | 'expense' | null;
  occurredAt: string | null;
  balanceCents: number | null;
  sourceBucket: BarefootBucket;
  errors: string[];
  warnings: string[];
}

export interface CsvPreviewResult {
  importer: string;
  timezone: string;
  rows: CsvPreviewRow[];
}
