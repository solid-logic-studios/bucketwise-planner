export type QifDateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YY/MM/DD';

export interface QifImportOptions {
  dateFormat?: QifDateFormat;
}

export interface QifRawRecord {
  date?: string;
  amount?: string;
  payee?: string;
  memo?: string;
  category?: string;
}
