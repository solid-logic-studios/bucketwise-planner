import { describe, expect, it } from 'vitest';
import { CsvParser } from '../../../../../src/application/import/csv/csv-parser.js';

describe('CsvParser', () => {
  it('parses quoted values with commas', () => {
    const content = '31/01/2026,"+400.00","Fast Transfer, Test","+986.87"';
    const result = CsvParser.parse(content, ',');

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual([
      '31/01/2026',
      '+400.00',
      'Fast Transfer, Test',
      '+986.87',
    ]);
  });

  it('parses escaped quotes', () => {
    const content = '"Value with ""quotes""",123';
    const result = CsvParser.parse(content, ',');

    expect(result.rows[0]).toEqual(['Value with "quotes"', '123']);
  });
});
