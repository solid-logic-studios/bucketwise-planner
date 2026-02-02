import { ValidationError } from '../../../domain/exceptions/validation-error.js';
import type { QifRawRecord } from './qif-types.js';

export interface QifParseResult {
  header: string | null;
  records: QifRawRecord[];
}

export class QifParser {
  static parse(content: string): QifParseResult {
    const lines = content.split(/\r?\n/);
    let header: string | null = null;
    const records: QifRawRecord[] = [];
    let current: QifRawRecord = {};

    for (const line of lines) {
      if (!line) continue;
      if (line.startsWith('!')) {
        header = line.trim();
        continue;
      }
      if (line === '^') {
        if (Object.keys(current).length > 0) {
          records.push(current);
          current = {};
        }
        continue;
      }
      const prefix = line[0];
      const value = line.slice(1).trim();

      switch (prefix) {
        case 'D':
          current.date = value;
          break;
        case 'T':
          current.amount = value;
          break;
        case 'P':
          current.payee = value;
          break;
        case 'M':
          current.memo = value;
          break;
        case 'L':
          current.category = value;
          break;
        default:
          break;
      }
    }

    if (Object.keys(current).length > 0) {
      records.push(current);
    }

    if (!header) {
      throw new ValidationError('QIF header missing');
    }

    return { header, records };
  }
}
