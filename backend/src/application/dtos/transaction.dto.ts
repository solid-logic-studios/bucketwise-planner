/**
 * TransactionDTO: data transfer object for transaction responses
 * 
 * For regular transactions (income/expense):
 *   - bucket: the bucket affected by the transaction
 *   - sourceBucket: same as bucket
 *   - destinationBucket: null
 * 
 * For transfers:
 *   - bucket: backward-compatibility, maps to sourceBucket
 *   - sourceBucket: bucket being transferred FROM
 *   - destinationBucket: bucket being transferred TO
 */
export interface TransactionDTO {
  id: string;
  bucket: string; // Backward compatibility: same as sourceBucket
  sourceBucket: string;
  destinationBucket: string | null;
  kind: 'income' | 'expense' | 'transfer';
  description: string;
  amountCents: number;
  occurredAt: string; // ISO 8601
  tags: string[];
}

