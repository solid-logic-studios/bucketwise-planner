import {
  ActionIcon,
  Alert,
  Badge,
  Divider,
  Drawer,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconSend, IconTrash } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '../hooks/useChat';
import { usePageContext } from '../hooks/usePageContext';
import { showSuccess } from '../utils/notifications';
import { useChatContext } from './chat/useChatContext.js';
import { TokenUsageIndicator } from './TokenUsageIndicator';

/**
 * ChatWidget: AI-powered chat drawer for Barefoot Investor advice.
 * 
 * Features:
 * - Mantine Drawer positioned on the right
 * - Page context badge showing current page
 * - Message history (user + assistant bubbles) with count
 * - Conversation history (last 5 messages or 10-minute window sent to backend)
 * - Page context detection (auto-detects current page for context-aware responses)
 * - Token usage tracking with color-coded indicator
 * - Text input with send button
 * - Loading state (spinner while waiting for response)
 * - Error handling (displays error alert)
 * - Enhanced clear history button with confirmation
 * - Auto-scroll to latest message
 * - Page-specific empty state suggestions
 * 
 * Usage:
 * - Managed via ChatProvider context (isOpen state)
 * - Triggered by floating action button in App.tsx
 */
export function ChatWidget() {
  const { isOpen, closeChat } = useChatContext();
  const { messages, isLoading, error, totalTokensUsed, sendMessage, clearMessages } = useChat();
  const pageContext = usePageContext();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) {
      return;
    }

    const messageText = inputValue;
    setInputValue(''); // Clear input immediately
    await sendMessage(messageText, pageContext);
  }, [inputValue, isLoading, sendMessage, pageContext]);

  const handleClear = useCallback(() => {
    modals.openConfirmModal({
      title: 'Clear chat history',
      children: (
        <Text size="sm">
          Clear all {messages.length} {messages.length === 1 ? 'message' : 'messages'} from chat
          history? This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Clear history', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        clearMessages();
        showSuccess('Chat history has been cleared successfully', 'History cleared');
      },
    });
  }, [messages.length, clearMessages]);

  const getPageLabel = useCallback((page?: string): string => {
    if (!page) return 'General';
    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      debts: 'Debts',
      fortnight: 'Fortnight',
      profile: 'Profile',
      general: 'General',
    };
    return labels[page] || 'General';
  }, []);

  const getEmptyStateSuggestions = useCallback((page?: string): string[] => {
    const suggestions: Record<string, string[]> = {
      dashboard: [
        'What is my current financial snapshot?',
        'How am I tracking this fortnight?',
        'What debts should I prioritize?',
      ],
      transactions: [
        'How much have I spent this fortnight?',
        'What is my biggest expense category?',
        'Show me recurring transactions',
      ],
      debts: [
        'How long until I am debt-free?',
        'Explain the debt snowball method',
        'Should I pay extra on my mortgage?',
      ],
      fortnight: [
        'How much do I have left in each bucket?',
        'Am I on track with my budget?',
        'What is the Fire Extinguisher for?',
      ],
      profile: [
        'How should I allocate my income?',
        'What percentage for Fire Extinguisher?',
        'Explain the Barefoot bucket system',
      ],
    };
    return suggestions[page || 'general'] || [
      'How does the Barefoot Investor method work?',
      'What should I prioritize first?',
      'Help me understand my budget',
    ];
  }, []);

  const pageSuggestions = useMemo(
    () => getEmptyStateSuggestions(pageContext?.page),
    [pageContext?.page, getEmptyStateSuggestions]
  );

  return (
    <Drawer
      opened={isOpen}
      onClose={closeChat}
      title="AI Advisor"
      position="right"
      size="md"
      padding="md"
    >
      <Stack style={{ height: 'calc(100vh - 120px)' }} gap="md">
        {/* Context and status header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Badge variant="light" color="blue" size="sm">
              {getPageLabel(pageContext?.page)}
            </Badge>
            {messages.length > 0 && (
              <Text size="xs" c="dimmed">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </Text>
            )}
          </Group>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={handleClear}
            disabled={messages.length === 0}
            title={`Clear ${messages.length} messages`}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>

        <Divider />

        {/* AI Disabled notice */}
        {error?.includes('404') || error?.includes('not found') ? (
          <Alert color="yellow" title="AI Advisor Disabled" icon={null}>
            <Stack gap="xs">
              <Text size="sm">
                The AI advisor is not enabled on this instance. To enable it:
              </Text>
              <Text size="sm" component="div" c="dimmed">
                <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Set <code>AI_ENABLED=true</code> in backend .env</li>
                  <li>Set <code>GEMINI_API_KEY=your_key</code> in backend .env</li>
                  <li>Restart the backend service</li>
                </ol>
              </Text>
              <Text size="xs" c="dimmed">
                See <a href="https://github.com/PaulAtkins88/bucketwise-planner/blob/main/docs/AI_ADVISOR.md" target="_blank" rel="noopener noreferrer">AI_ADVISOR.md</a> for details.
              </Text>
            </Stack>
          </Alert>
        ) : error ? (
          <Alert color="red" title="Error" withCloseButton onClose={() => null}>
            {error}
          </Alert>
        ) : null}

        {/* Messages area */}
        <ScrollArea
          style={{ flex: 1 }}
          viewportRef={scrollRef}
          styles={{ viewport: { paddingBottom: '1rem' } }}
        >
          <Stack gap="md">
            {messages.length === 0 && (
              <Paper p="md" withBorder style={{ textAlign: 'center' }}>
                <Text c="dimmed" size="sm" fw={500} mb="xs">
                  No messages yet. Start a conversation!
                </Text>
                <Text c="dimmed" size="xs" mb="sm">
                  Try asking:
                </Text>
                <Stack gap="xs">
                  {pageSuggestions.map((suggestion, idx) => (
                    <Text
                      key={idx}
                      size="xs"
                      c="dimmed"
                      style={{
                        fontStyle: 'italic',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--mantine-color-dark-7)',
                      }}
                    >
                      "{suggestion}"
                    </Text>
                  ))}
                </Stack>
              </Paper>
            )}

            {messages.map((message) => (
              <Paper
                key={message.id}
                p="sm"
                withBorder
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  backgroundColor:
                    message.role === 'user'
                      ? 'var(--mantine-color-blue-6)'
                      : 'var(--mantine-color-dark-6)',
                }}
              >
                {message.role === 'assistant' ? (
                  <div style={{ fontSize: '0.875rem' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <Text
                    size="sm"
                    style={{
                      whiteSpace: 'pre-wrap',
                      color: 'white',
                    }}
                  >
                    {message.content}
                  </Text>
                )}
                <Text
                  size="xs"
                  c="dimmed"
                  mt="xs"
                  style={{ color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : undefined }}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Text>
              </Paper>
            ))}

            {isLoading && (
              <Paper p="sm" withBorder style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                <Group gap="xs">
                  <Loader size="xs" />
                  <Text size="sm" c="dimmed">
                    Thinking...
                  </Text>
                </Group>
              </Paper>
            )}
          </Stack>
        </ScrollArea>

        {/* Input form */}
        <form onSubmit={handleSubmit}>
          <Group gap="xs">
            <TextInput
              flex={1}
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              maxLength={500}
            />
            <ActionIcon
              type="submit"
              variant="filled"
              color="blue"
              size="lg"
              disabled={!inputValue.trim() || isLoading}
            >
              <IconSend size={18} />
            </ActionIcon>
          </Group>
        </form>

        {/* Token usage footer */}
        {totalTokensUsed > 0 && (
          <>
            <Divider />
            <Group justify="center">
              <TokenUsageIndicator totalTokens={totalTokensUsed} />
            </Group>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
