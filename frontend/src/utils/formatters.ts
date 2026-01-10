export const formatCurrency = (cents?: number): string => {
  if (cents === undefined) return '-';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
};

export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(0)}%`;
};

export const formatDate = (dateString: string): string => {
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
