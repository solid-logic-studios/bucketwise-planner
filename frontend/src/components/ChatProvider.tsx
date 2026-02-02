import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { ChatContext, type ChatContextValue } from './chat/chat-context.js';

interface ChatProviderProps {
  children: ReactNode;
}

/**
 * ChatProvider: Global context for managing chat drawer state.
 */
export function ChatProvider({ children }: ChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value: ChatContextValue = {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
