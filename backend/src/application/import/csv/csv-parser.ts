import type { CsvDelimiter } from './csv-types.js';

export interface CsvParseResult {
  rows: string[][];
}

export class CsvParser {
  static parse(content: string, delimiter: CsvDelimiter): CsvParseResult {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    let i = 0;

    const pushValue = () => {
      currentRow.push(currentValue);
      currentValue = '';
    };

    const pushRow = () => {
      if (currentRow.length === 0 && currentValue === '') {
        return;
      }
      pushValue();
      rows.push(currentRow.map((value) => value.trim()));
      currentRow = [];
    };

    while (i < content.length) {
      const char = content[i];

      if (char === '"') {
        const nextChar = content[i + 1];
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
        i += 1;
        continue;
      }

      if (!inQuotes && char === delimiter) {
        pushValue();
        i += 1;
        continue;
      }

      if (!inQuotes && (char === '\n' || char === '\r')) {
        if (char === '\r' && content[i + 1] === '\n') {
          i += 1;
        }
        pushRow();
        i += 1;
        continue;
      }

      currentValue += char;
      i += 1;
    }

    if (currentValue.length > 0 || currentRow.length > 0) {
      pushRow();
    }

    return { rows };
  }
}
