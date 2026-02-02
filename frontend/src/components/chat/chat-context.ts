import { createContext } from 'react';

export interface ChatContextValue {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

export const ChatContext = createContext<ChatContextValue | undefined>(undefined);
