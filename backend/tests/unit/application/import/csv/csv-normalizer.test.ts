import { describe, expect, it } from 'vitest';
import { CsvDateParser, CsvNumberParser } from '../../../../../src/application/import/csv/csv-normalizer.js';

describe('CsvDateParser', () => {
  it('parses DD/MM/YYYY', () => {
    expect(CsvDateParser.parse('31/01/2026', 'DD/MM/YYYY')).toBe('2026-01-31');
  });

  it('parses YYYY-MM-DD', () => {
    expect(CsvDateParser.parse('2026-02-01', 'YYYY-MM-DD')).toBe('2026-02-01');
  });
});

describe('CsvNumberParser', () => {
  it('parses amounts with default separators', () => {
    expect(CsvNumberParser.parseAmount('+1,234.50')).toBe(1234.5);
  });

  it('parses amounts with european separators', () => {
    expect(CsvNumberParser.parseAmount('1.234,50', ',', '.')).toBe(1234.5);
  });
});
