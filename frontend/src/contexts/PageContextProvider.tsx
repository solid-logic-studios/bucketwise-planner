import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import type { DebtDTO, FortnightDetailDTO, PageKey, TransactionDTO } from '../api/types';

interface PageData {
  currentPage: PageKey;
  transactions?: TransactionDTO[];
  specificDebt?: DebtDTO;
  fortnightSnapshot?: FortnightDetailDTO;
  fortnightId?: string;
  debtId?: string;
}

interface PageContextValue {
  pageData: PageData;
  setPageData: (data: Partial<PageData>) => void;
  setCurrentPage: (page: PageKey) => void;
  clearPageData: () => void;
}

const PageContextContext = createContext<PageContextValue | undefined>(undefined);

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

/**
 * usePageDataContext: Access page data storage for view components.
 * 
 * Use this hook in view components to populate page data when content loads.
 * Different from usePageContext which combines route + data for ChatWidget.
 */
export function usePageDataContext(): PageContextValue {
  const context = useContext(PageContextContext);
  if (!context) {
    throw new Error('usePageDataContext must be used within PageContextProvider');
  }
  return context;
}
