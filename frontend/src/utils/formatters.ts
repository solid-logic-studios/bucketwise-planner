export const supportedCurrencyCodes = ['AUD', 'USD', 'NZD'] as const;
export type SupportedCurrencyCode = (typeof supportedCurrencyCodes)[number];

const DEFAULT_CURRENCY_CODE: SupportedCurrencyCode = 'AUD';

const CURRENCY_FORMAT_BY_CODE: Record<SupportedCurrencyCode, { locale: string; currency: string }> = {
  AUD: { locale: 'en-AU', currency: 'AUD' },
  USD: { locale: 'en-US', currency: 'USD' },
  NZD: { locale: 'en-NZ', currency: 'NZD' },
};

export const getConfiguredCurrencyCode = (): SupportedCurrencyCode => {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY_CODE;

  const value = localStorage.getItem('currencyCode');
  if (value === 'USD' || value === 'NZD' || value === 'AUD') {
    return value;
  }

  return DEFAULT_CURRENCY_CODE;
};

export const formatCurrency = (
  cents?: number,
  currencyCode: SupportedCurrencyCode = getConfiguredCurrencyCode()
): string => {
  if (cents === undefined) return '-';
  const format = CURRENCY_FORMAT_BY_CODE[currencyCode] ?? CURRENCY_FORMAT_BY_CODE.AUD;
  return new Intl.NumberFormat(format.locale, {
    style: 'currency',
    currency: format.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
};

export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(0)}%`;
};

export const formatDate = (dateString: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, (month ?? 1) - 1, day ?? 1);
    return localDate.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Normalize a date (string or Date) into YYYY-MM-DD using UTC parts to avoid local timezone shifts.
 * Falls back to the input string if parsing fails.
 */
export const formatDateToISO = (value: string | Date): string => {
  const isIsoDateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (isIsoDateOnly) return value;

  const parsed = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(parsed.getTime())) return typeof value === 'string' ? value : '';

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
