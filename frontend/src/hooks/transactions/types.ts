import type { TransactionDTO } from '../../api/types.js';

export type TransactionKind = 'income' | 'expense' | 'transfer';

export const bucketOptions = [
  'Daily Expenses',
  'Splurge',
  'Smile',
  'Fire Extinguisher',
  'Mojo',
  'Grow',
] as const;

export type BucketType = (typeof bucketOptions)[number];

export interface TransactionFilters {
  bucket?: BucketType;
  search?: string;
}

export interface TransactionState {
  data: TransactionDTO[];
  total: number;
  limit: number;
  offset: number;
  loading: boolean;
  error?: string;
}

export interface TransactionFormValues {
  bucket: BucketType; // Backward compatibility: same as sourceBucket
  sourceBucket: BucketType;
  destinationBucket: BucketType | null | undefined;
  kind: TransactionKind;
  description: string;
  amountDollars: number;
  tags: string[];
  debtPayment: boolean;
  debtId?: string;
  occurredAt?: Date | string | null;
}
