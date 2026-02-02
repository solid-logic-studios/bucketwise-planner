import { describe, expect, it } from 'vitest';
import { QifParser } from '../../../../../src/application/import/qif/qif-parser.js';

describe('QifParser', () => {
  it('parses basic QIF records', () => {
    const content = '!Type:Bank\nD31/01/2026\nT-12.34\nPCoffee\n^';
    const result = QifParser.parse(content);

    expect(result.header).toBe('!Type:Bank');
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toEqual({
      date: '31/01/2026',
      amount: '-12.34',
      payee: 'Coffee',
    });
  });
});
