import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import type { PageKey } from '../api/types';
import { PageContextContext, type PageContextValue, type PageData } from './page-context';

/**
 * PageContextProvider: Stores page-specific data for AI context enrichment.
 * 
 * Views populate this provider with their loaded data (transactions, debts, fortnights).
 * The usePageContext hook combines current page with this data to create rich context.
 * 
 * Phase 4 Implementation:
 * - Stores current page (dashboard, transactions, debts, fortnight, profile)
 * - Stores transactions (limited to 50), specific debt details, fortnight snapshots
 * - Cleared/updated when page or data changes
 * - Used by ChatWidget to send context-aware page data to AI
 * 
 * @example
 * ```tsx
 * // In App.tsx:
 * const { setCurrentPage } = usePageDataContext();
 * setCurrentPage('transactions');
 * 
 * // In TransactionsView:
 * const { setPageData } = usePageDataContext();
 * useEffect(() => {
 *   if (transactions) {
 *     setPageData({ transactions: transactions.slice(0, 50) });
 *   }
 * }, [transactions]);
 * ```
 */
export function PageContextProvider({ children }: { children: ReactNode }) {
  const [pageData, setPageDataState] = useState<PageData>({ currentPage: 'dashboard' });

  const setPageData = useCallback((data: Partial<PageData>) => {
    setPageDataState((prev) => ({ ...prev, ...data }));
  }, []);

  const setCurrentPage = useCallback((page: PageKey) => {
    setPageDataState(() => ({
      currentPage: page,
      // Clear page-specific data when page changes
      transactions: undefined,
      specificDebt: undefined,
      fortnightSnapshot: undefined,
      fortnightId: undefined,
      debtId: undefined,
    }));
  }, []);

  const clearPageData = useCallback(() => {
    setPageDataState({ currentPage: 'dashboard' });
  }, []);

  const value: PageContextValue = {
    pageData,
    setPageData,
    setCurrentPage,
    clearPageData,
  };

  return (
    <PageContextContext.Provider value={value}>
      {children}
    </PageContextContext.Provider>
  );
}
