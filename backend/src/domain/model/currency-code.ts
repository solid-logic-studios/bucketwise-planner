export const supportedCurrencyCodes = ['AUD', 'USD', 'NZD'] as const;

export type CurrencyCode = (typeof supportedCurrencyCodes)[number];

export const DEFAULT_CURRENCY_CODE: CurrencyCode = 'AUD';

export function isSupportedCurrencyCode(value: string): value is CurrencyCode {
  return (supportedCurrencyCodes as readonly string[]).includes(value);
}
