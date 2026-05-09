import { ValidationError } from '../exceptions/validation-error.js';
import type { BarefootBucket } from './barefoot-bucket.js';
import { BaseEntity } from './base.entity.js';
import {
  type CurrencyCode,
  isSupportedCurrencyCode,
} from './currency-code.js';
import { Money } from './money.js';

export interface FixedExpense {
  id: string;
  name: string;
  bucket: BarefootBucket;
  amount: Money;
}

export class BudgetProfile extends BaseEntity {
  readonly fortnightlyIncome: Money;
  readonly defaultFireExtinguisherBps: number; // basis points (0-10000)
  readonly fixedExpenses: FixedExpense[];
  readonly timezone: string; // IANA timezone identifier (e.g., 'Australia/Melbourne', 'UTC')
  readonly currencyCode: CurrencyCode;

  constructor(
    id: string,
    fortnightlyIncome: Money,
    defaultFireExtinguisherBps: number,
    fixedExpenses: FixedExpense[],
    timezone: string = 'UTC',
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    if (fortnightlyIncome.cents < 0) {
      throw new ValidationError('Income cannot be negative');
    }
    if (defaultFireExtinguisherBps < 0 || defaultFireExtinguisherBps > 10000) {
      throw new ValidationError('Default Fire Extinguisher percent must be between 0 and 100');
    }
    const currencyCode = fortnightlyIncome.currency;
    if (!isSupportedCurrencyCode(currencyCode)) {
      throw new ValidationError(
        `Unsupported currency code: ${currencyCode}. Supported values are AUD, USD, NZD.`
      );
    }
    this.fortnightlyIncome = fortnightlyIncome;
    this.defaultFireExtinguisherBps = Math.round(defaultFireExtinguisherBps);
    this.fixedExpenses = fixedExpenses;
    this.timezone = timezone;
    this.currencyCode = currencyCode as CurrencyCode;
  }

  get defaultFireExtinguisherAmount(): Money {
    const cents = Math.floor((this.fortnightlyIncome.cents * this.defaultFireExtinguisherBps) / 10000);
    return new Money(cents, this.currencyCode);
  }
}
