import { useCallback, useState } from 'react';
import { api } from '../../api/client.js';
import { formatDateToISO } from '../../utils/formatters.js';
import type { TransactionFilters, TransactionState } from './types.js';

interface UseTransactionsArgs {
  filters: TransactionFilters;
  fortnightStartDate: string | null;
  fortnightEndDate: string | null;
  pageSize: number;
  currentPage: number;
}

export const useTransactionsData = ({ filters, fortnightStartDate, fortnightEndDate, pageSize, currentPage }: UseTransactionsArgs) => {
  const [state, setState] = useState<TransactionState>({ data: [], total: 0, limit: pageSize, offset: 0, loading: false });

  const loadTransactions = useCallback(async () => {
    if (!fortnightStartDate || !fortnightEndDate) return;

    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const startDateIso = formatDateToISO(fortnightStartDate);
      const endDateIso = formatDateToISO(fortnightEndDate);
      const offset = (currentPage - 1) * pageSize;
      const response = await api.listTransactions({
        bucket: filters.bucket,
        startDate: startDateIso,
        endDate: endDateIso,
        limit: pageSize,
        offset,
      });
      setState({
        data: response.transactions,
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        loading: false,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to load transactions',
        loading: false,
      }));
    }
  }, [filters.bucket, fortnightEndDate, fortnightStartDate, currentPage, pageSize]);

  return { state, setState, loadTransactions } as const;
};
