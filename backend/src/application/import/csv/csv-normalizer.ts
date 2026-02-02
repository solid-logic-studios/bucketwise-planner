import { ValidationError } from '../../../domain/exceptions/validation-error.js';

export class CsvNumberParser {
  static parseAmount(
    raw: string,
    decimalSeparator: '.' | ',' = '.',
    thousandsSeparator: ',' | '.' | ' ' | '' = ','
  ): number {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new ValidationError('Amount is missing');
    }

    const normalized = trimmed
      .replace(this.buildThousandsRegex(thousandsSeparator), '')
      .replace(decimalSeparator, '.');

    const value = Number(normalized);
    if (Number.isNaN(value)) {
      throw new ValidationError(`Amount is invalid: ${raw}`);
    }

    return value;
  }

  private static buildThousandsRegex(separator: ',' | '.' | ' ' | ''): RegExp {
    if (!separator) {
      // Match nothing (avoid control chars in regex literal)
      return /$^/;
    }
    const escaped = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'g');
  }
}

export class CsvDateParser {
  static parse(
    raw: string,
    format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD.MM.YYYY'
  ): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new ValidationError('Date is missing');
    }

    const tokens = this.extractTokens(trimmed, format);
    const [year, month, day] = tokens;

    if (!year || !month || !day) {
      throw new ValidationError(`Date is invalid: ${raw}`);
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new ValidationError(`Date is invalid: ${raw}`);
    }

    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  static parseTwoDigitYear(raw: string, _format: 'YY/MM/DD'): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new ValidationError('Date is missing');
    }
    const parts = trimmed.split('/');
    if (parts.length < 3) {
      throw new ValidationError(`Date is invalid: ${raw}`);
    }
    const year = this.expandTwoDigitYear(Number(parts[0]));
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new ValidationError(`Date is invalid: ${raw}`);
    }
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  private static expandTwoDigitYear(year: number): number {
    const base = year < 70 ? 2000 : 1900;
    return base + year;
  }

  private static extractTokens(raw: string, format: string): [number, number, number] {
    switch (format) {
      case 'DD/MM/YYYY': {
        const parts = raw.split('/');
        return [Number(parts[2]), Number(parts[1]), Number(parts[0])];
      }
      case 'MM/DD/YYYY': {
        const parts = raw.split('/');
        return [Number(parts[2]), Number(parts[0]), Number(parts[1])];
      }
      case 'YYYY-MM-DD': {
        const parts = raw.split('-');
        return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
      }
      case 'DD.MM.YYYY': {
        const parts = raw.split('.');
        return [Number(parts[2]), Number(parts[1]), Number(parts[0])];
      }
      default:
        throw new ValidationError(`Unsupported date format: ${format}`);
    }
  }
}
