import type { CsvImportPreviewRow } from '../../../api/types.js';

export const defaultPresetName = 'Custom Preset';

export const csvFormatOptions = [
  { value: 'cba-au', label: 'Commonwealth Bank AU' },
  { value: 'qif', label: 'QIF (Quicken)' },
  { value: 'custom', label: 'Custom mapping' },
];

export const csvDelimiters = [
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe (|)' },
];

export const dateFormatOptions = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
];

export const decimalSeparatorOptions = [
  { value: '.', label: 'Dot (.)' },
  { value: ',', label: 'Comma (,)' },
];

export const thousandsSeparatorOptions = [
  { value: ',', label: 'Comma (,)' },
  { value: '.', label: 'Dot (.)' },
  { value: ' ', label: 'Space' },
  { value: '', label: 'None' },
];

export const mappingModeOptions = [
  { value: 'header', label: 'Header names' },
  { value: 'index', label: 'Column positions' },
];

export const defaultColumnMapping = {
  dateColumn: 0,
  amountColumn: 1,
  descriptionColumn: 2,
  balanceColumn: 3,
};

export function hasRowErrors(rows: CsvImportPreviewRow[]): boolean {
  return rows.some((row) => row.errors.length > 0);
}

export function summarizePreview(rows: CsvImportPreviewRow[]) {
  const total = rows.length;
  const errored = rows.filter((row) => row.errors.length > 0).length;
  const warnings = rows.filter((row) => row.warnings.length > 0).length;
  return { total, errored, warnings };
}
