import { ValidationError } from '../../../domain/exceptions/validation-error.js';
import type { BankCsvImporter, CsvImporterOptions } from './bank-csv-importer.interface.js';
import { CsvParser } from './csv-parser.js';
import type { CsvMappingConfig, CsvPreviewRow, ParsedCsvRow } from './csv-types.js';
import { CsvImporterBase } from './csv-importer-base.js';

export class GenericMappedCsvImporter extends CsvImporterBase implements BankCsvImporter {
  readonly name = 'Mapped CSV';

  canHandle(_headers: string[] | null, _sampleRows: string[][]): boolean {
    return false;
  }

  parse(content: string, options: CsvImporterOptions): CsvPreviewRow[] {
    if (!options.mapping) {
      throw new ValidationError('Mapping configuration is required for mapped CSV');
    }

    const mapping = options.mapping;
    const delimiter = mapping.delimiter ?? ',';
    const { rows } = CsvParser.parse(content, delimiter);
    if (rows.length === 0) return [];

    const hasHeader = mapping.hasHeader ?? false;
    const headerRow = hasHeader ? rows[0] : null;
    const dataRows = hasHeader ? rows.slice(1) : rows;

    const resolveColumn = (selector: CsvMappingConfig['dateColumn']) => {
      if (selector.type === 'index') {
        return selector.index;
      }
      if (!headerRow) {
        throw new ValidationError(`Header row not found for column ${selector.name}`);
      }
      const index = headerRow.findIndex((value) => value.trim() === selector.name);
      if (index === -1) {
        throw new ValidationError(`Column ${selector.name} not found`);
      }
      return index;
    };

    const dateIndex = resolveColumn(mapping.dateColumn);
    const amountIndex = resolveColumn(mapping.amountColumn);
    const descriptionIndex = resolveColumn(mapping.descriptionColumn);
    const balanceIndex = mapping.balanceColumn ? resolveColumn(mapping.balanceColumn) : undefined;

    const parsedRows: ParsedCsvRow[] = dataRows
      .filter((row) => row.some((value) => value.trim() !== ''))
      .map((row, rowIndex) => {
        const balanceRaw = balanceIndex !== undefined ? row[balanceIndex] : undefined;
        return {
          rowIndex: (hasHeader ? rowIndex + 2 : rowIndex + 1),
          raw: row,
          dateRaw: row[dateIndex] ?? '',
          amountRaw: row[amountIndex] ?? '',
          descriptionRaw: row[descriptionIndex] ?? '',
          ...(balanceRaw !== undefined ? { balanceRaw } : {}),
        };
      });

    const dateFormat = mapping.dateFormat === 'AUTO' || !mapping.dateFormat
      ? 'YYYY-MM-DD'
      : mapping.dateFormat;

    return this.normalizeRows(parsedRows, {
      timezone: options.timezone,
      dateFormat,
      decimalSeparator: mapping.decimalSeparator ?? '.',
      thousandsSeparator: mapping.thousandsSeparator ?? ',',
      defaultBucket: options.defaultBucket,
    });
  }
}
