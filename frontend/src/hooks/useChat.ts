import { useCallback, useState } from 'react';
import { api } from '../api/client';
import type { ChatMessage, PageContext } from '../api/types';
import { generateUUID } from '../utils/uuid';

interface UseChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  totalTokensUsed: number;
  sendMessage: (message: string, pageContext?: PageContext) => Promise<void>;
  clearMessages: () => void;
}

/**
 * useChat hook: Manages chat message history, conversation context, and API communication.
 * 
 * Features:
 * - Maintains message history (user + assistant)
 * - Sends last 5 messages as conversation history to backend
 * - Accepts optional page context for context-aware responses
 * - Tracks total token usage across conversation
 * - Handles loading/error states
 * - Provides clearMessages for resetting conversation
 * 
 * @example
 * ```tsx
 * const { messages, isLoading, error, totalTokensUsed, sendMessage } = useChat();
 * 
 * const handleSubmit = async (text: string) => {
 *   await sendMessage(text, pageContext);
 * };
 * ```
 */
export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);

  const sendMessage = useCallback(async (messageText: string, pageContext?: PageContext) => {
    console.log('[useChat] sendMessage called with:', messageText);
    if (!messageText.trim()) {
      console.log('[useChat] Message empty, returning');
      return;
    }

    // Clear previous error
    setError(null);
    setIsLoading(true);
    console.log('[useChat] Set loading to true');

    // Add user message to history
    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    console.log('[useChat] Added user message to history');

    try {
      // Get last 5 messages as conversation history (excluding the current user message)
      const conversationHistory = messages.slice(-5);

      console.log('[useChat] About to call api.sendChatMessage');
      // Call API with conversation history and page context
      const response = await api.sendChatMessage({ 
        message: messageText.trim(),
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
        pageContext,
      });
      console.log('[useChat] API response received:', response);

      // Add assistant response to history
      const assistantMessage: ChatMessage = {
        id: response.messageId,
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Accumulate token usage if provided
      if (response.tokenUsage?.totalTokens) {
        setTotalTokensUsed((prev) => prev + (response.tokenUsage?.totalTokens ?? 0));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Remove the user message on error to avoid confusion
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setTotalTokensUsed(0);
  }, []);

  return {
    messages,
    isLoading,
    error,
    totalTokensUsed,
    sendMessage,
    clearMessages,
  };
}
