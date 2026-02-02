import { ValidationError } from '../../../domain/exceptions/validation-error.js';
import type { CsvMappingConfig, CsvMappingInput, CsvColumnSelector } from './csv-types.js';

export class CsvMappingFactory {
  static fromInput(input?: CsvMappingInput): CsvMappingConfig | undefined {
    if (!input) return undefined;

    const config: CsvMappingConfig = {
      dateColumn: this.toSelector(input.dateColumn, 'dateColumn'),
      amountColumn: this.toSelector(input.amountColumn, 'amountColumn'),
      descriptionColumn: this.toSelector(input.descriptionColumn, 'descriptionColumn'),
    };

    if (input.delimiter !== undefined) config.delimiter = input.delimiter;
    if (input.hasHeader !== undefined) config.hasHeader = input.hasHeader;
    if (input.balanceColumn !== undefined) {
      config.balanceColumn = this.toSelector(input.balanceColumn, 'balanceColumn');
    }
    if (input.dateFormat !== undefined) config.dateFormat = input.dateFormat;
    if (input.decimalSeparator !== undefined) config.decimalSeparator = input.decimalSeparator;
    if (input.thousandsSeparator !== undefined) config.thousandsSeparator = input.thousandsSeparator;

    return config;
  }

  private static toSelector(value: string | number, label: string): CsvColumnSelector {
    if (typeof value === 'number') {
      if (value < 0) {
        throw new ValidationError(`${label} index must be non-negative`);
      }
      return { type: 'index', index: value };
    }

    const trimmed = value.trim();
    if (!trimmed) {
      throw new ValidationError(`${label} is required`);
    }
    return { type: 'header', name: trimmed };
  }
}
