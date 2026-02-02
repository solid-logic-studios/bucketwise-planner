import { useContext } from 'react';
import { HelpContext, type HelpContextValue } from './help-context.js';

export function useHelp(): HelpContextValue {
  const ctx = useContext(HelpContext);
  if (!ctx) {
    throw new Error('useHelp must be used within HelpProvider');
  }
  return ctx;
}
