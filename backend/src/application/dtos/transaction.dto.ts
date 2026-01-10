/**
 * TransactionDTO: data transfer object for transaction responses
 */
export interface TransactionDTO {
  id: string;
  bucket: string;
  kind: 'income' | 'expense' | 'transfer';
  description: string;
  amountCents: number;
  occurredAt: string; // ISO 8601
  tags: string[];
}
