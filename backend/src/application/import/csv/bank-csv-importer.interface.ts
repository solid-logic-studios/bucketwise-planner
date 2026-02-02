import type { BarefootBucket } from '../../../domain/model/barefoot-bucket.js';
import type { CsvMappingConfig, CsvPreviewRow } from './csv-types.js';

export interface CsvImporterOptions {
  timezone: string;
  mapping?: CsvMappingConfig;
  defaultBucket: BarefootBucket;
  dateFormat?: string;
  qifDateFormat?: string;
}

export interface BankCsvImporter {
  readonly name: string;
  canHandle(headers: string[] | null, sampleRows: string[][]): boolean;
  parse(content: string, options: CsvImporterOptions): CsvPreviewRow[];
}
