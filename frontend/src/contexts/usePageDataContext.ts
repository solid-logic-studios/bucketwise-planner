import { useContext } from 'react';
import { PageContextContext, type PageContextValue } from './page-context.ts';

export function usePageDataContext(): PageContextValue {
  const context = useContext(PageContextContext);
  if (!context) {
    throw new Error('usePageDataContext must be used within PageContextProvider');
  }
  return context;
}
