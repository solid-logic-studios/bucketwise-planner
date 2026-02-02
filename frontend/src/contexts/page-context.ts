import { createContext } from 'react';
import type { DebtDTO, FortnightDetailDTO, PageKey, TransactionDTO } from '../api/types';

export interface PageData {
  currentPage: PageKey;
  transactions?: TransactionDTO[];
  specificDebt?: DebtDTO;
  fortnightSnapshot?: FortnightDetailDTO;
  fortnightId?: string;
  debtId?: string;
}

export interface PageContextValue {
  pageData: PageData;
  setPageData: (data: Partial<PageData>) => void;
  setCurrentPage: (page: PageKey) => void;
  clearPageData: () => void;
}

export const PageContextContext = createContext<PageContextValue | undefined>(undefined);
