import { createContext } from 'react';
import type { HelpPageKey } from '../../types/help.js';

export interface HelpContextValue {
  openHelp: (key: HelpPageKey) => void;
  closeHelp: () => void;
  isOpen: boolean;
  currentPage: HelpPageKey;
}

export const HelpContext = createContext<HelpContextValue | undefined>(undefined);
