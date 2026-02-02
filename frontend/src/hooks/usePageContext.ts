import type { PageContext } from '../api/types';
import { usePageDataContext } from '../contexts/usePageDataContext.ts';
import { useMemo } from 'react';

/**
 * usePageContext hook: Returns current page context enriched with data from PageContextProvider.
 * 
 * Phase 4 Implementation: Combines current page + actual page data.
 * - Current page tracked in PageContextProvider (updated by App.tsx on navigation)
 * - PageData from provider adds transactions[], specificDebt, fortnightSnapshot
 * - Returns complete PageContext ready for AI consumption
 * 
 * @example
 * ```tsx
 * const pageContext = usePageContext();
 * // On transactions page with loaded data:
 * // { page: 'transactions', transactions: [...] }
 * // On debts page with specific debt:
 * // { page: 'debts', debtId: '...', specificDebt: {...} }
 * ```
 */
export function usePageContext(): PageContext | undefined {
  const { pageData } = usePageDataContext();
  
  return useMemo((): PageContext | undefined => {
    const baseContext: PageContext = {
      page: pageData.currentPage,
    };
    
    // Enrich with page data from provider
    return {
      ...baseContext,
      ...(pageData.transactions && { transactions: pageData.transactions }),
      ...(pageData.specificDebt && { specificDebt: pageData.specificDebt }),
      ...(pageData.fortnightSnapshot && { fortnightSnapshot: pageData.fortnightSnapshot }),
      ...(pageData.fortnightId && { fortnightId: pageData.fortnightId }),
      ...(pageData.debtId && { debtId: pageData.debtId }),
    };
  }, [pageData]);
}
