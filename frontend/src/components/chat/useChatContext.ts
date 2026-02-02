import { useContext } from 'react';
import { ChatContext, type ChatContextValue } from './chat-context.js';

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
