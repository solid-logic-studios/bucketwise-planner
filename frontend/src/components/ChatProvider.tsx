import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ChatContextValue {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

/**
 * ChatProvider: Global context for managing chat drawer state.
 * 
 * Provides:
 * - isOpen: boolean indicating drawer visibility
 * - openChat: function to show drawer
 * - closeChat: function to hide drawer
 * - toggleChat: function to toggle drawer
 * 
 * @example
 * ```tsx
 * // In App.tsx
 * <ChatProvider>
 *   <YourApp />
 * </ChatProvider>
 * 
 * // In any component
 * const { isOpen, openChat } = useChat();
 * ```
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

/**
 * useChatContext hook: Access chat drawer state and controls.
 * Must be used within ChatProvider.
 * 
 * @throws Error if used outside ChatProvider
 */
export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
