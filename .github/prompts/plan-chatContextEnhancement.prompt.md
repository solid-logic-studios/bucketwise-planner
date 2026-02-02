# Plan: Smart Chat Context with Conversation History (Comprehensive, Phased)

Enhance the AI chat widget with conversation history (last 5 messages, 10-minute window) and automatic page context detection. The AI will understand what page the user is on, see relevant data (transactions, debts, fortnights), and maintain conversation continuity for more natural interactions.

**Goals:**
- Maintain last 5 messages OR messages from last 10 minutes (whichever is less)
- Auto-detect page context (Dashboard, Transactions, Debts, Fortnight, Profile)
- Send relevant page data with each message (transactions on Transactions page, specific debt on Debts page, etc.)
- Add token usage tracking and display to user
- Preserve existing stateless architecture (no server-side session storage)

---

## Phase 1: Backend Foundation (DTOs + Domain Service)

**Objective:** Extend DTOs to accept conversation history and page context. Update domain service to format this data for the AI.

### Tasks

1. **Update chat DTOs** — Modify [backend/src/application/dtos/chat.dto.ts](backend/src/application/dtos/chat.dto.ts)
   - Add `ChatMessage` interface (matches frontend):
     ```typescript
     export interface ChatMessage {
       id: string;
       role: 'user' | 'assistant';
       content: string;
       timestamp: string; // ISO 8601
     }
     ```
   - Add `PageContext` interface:
     ```typescript
     export interface PageContext {
       page: 'dashboard' | 'transactions' | 'debts' | 'fortnight' | 'profile' | 'general';
       fortnightId?: string; // If on Transactions or Fortnight page
       debtId?: string; // If viewing specific debt
       transactions?: TransactionDTO[]; // If on Transactions page
       specificDebt?: DebtDTO; // If on Debts page with debt selected
       fortnightSnapshot?: FortnightDetailDTO; // If on Fortnight detail page
     }
     ```
   - Update `SendChatMessageRequest`:
     ```typescript
     export interface SendChatMessageRequest {
       message: string;
       conversationHistory?: ChatMessage[]; // Optional: last N messages
       pageContext?: PageContext; // Optional: current page data
     }
     ```
   - Add to `ChatResponseDTO`:
     ```typescript
     export interface ChatResponseDTO {
       response: string;
       messageId: string;
       timestamp: string;
       tokenUsage?: {
         promptTokens: number;
         completionTokens: number;
         totalTokens: number;
       }; // NEW: Track token usage
     }
     ```

2. **Update Zod schema** — Modify [backend/src/application/dtos/schemas/chat.schema.ts](backend/src/application/dtos/schemas/chat.schema.ts)
   - Add `chatMessageSchema`:
     ```typescript
     const chatMessageSchema = z.object({
       id: z.string().uuid(),
       role: z.enum(['user', 'assistant']),
       content: z.string(),
       timestamp: z.string().datetime(),
     });
     ```
   - Add `pageContextSchema`:
     ```typescript
     const pageContextSchema = z.object({
       page: z.enum(['dashboard', 'transactions', 'debts', 'fortnight', 'profile', 'general']),
       fortnightId: z.string().uuid().optional(),
       debtId: z.string().uuid().optional(),
       transactions: z.array(z.any()).optional(), // Simplified, already validated on frontend
       specificDebt: z.any().optional(),
       fortnightSnapshot: z.any().optional(),
     });
     ```
   - Update `sendChatMessageSchema`:
     ```typescript
     export const sendChatMessageSchema = z.object({
       message: z.string().min(1).max(500),
       conversationHistory: z.array(chatMessageSchema).max(10).optional(), // Max 10 messages
       pageContext: pageContextSchema.optional(),
     });
     ```
   - Rationale: Max 10 messages prevents abuse, but use case will filter to 5 or 10-min window

3. **Enhance BarefootAdvisorService** — Modify [backend/src/domain/services/barefoot-advisor.service.ts](backend/src/domain/services/barefoot-advisor.service.ts)
   - Add new method `formatConversationHistory(history: ChatMessage[]): string`
     - Returns formatted string:
       ```
       === RECENT CONVERSATION ===
       [2026-01-04 10:30] User: How do I prioritize debts?
       [2026-01-04 10:30] Assistant: Use the snowball method...
       [2026-01-04 10:32] User: What about credit cards?
       [2026-01-04 10:32] Assistant: Credit cards are priority 1...
       ```
     - Format timestamps as `[YYYY-MM-DD HH:mm]`
     - Keep it concise to save tokens
   
   - Add new method `formatPageContext(context: PageContext): string`
     - Switch on `context.page`:
       - **transactions:** Format visible transactions with date, description, amount, bucket
       - **debts:** Format specific debt with payment history
       - **fortnight:** Format fortnight allocations and spent/remaining
       - **dashboard:** Summarize key metrics (total debt, next payment, etc.)
       - **profile:** Format income, Fire Extinguisher %, fixed expenses
       - **general:** Return empty string
     - Example output for transactions:
       ```
       === CURRENT PAGE: TRANSACTIONS (Fortnight 2026-01-01 to 2026-01-14) ===
       2026-01-02 | Woolworths | -$85.40 | Daily Expenses
       2026-01-03 | Netflix | -$15.99 | Splurge
       2026-01-05 | Salary | +$2000.00 | Income
       Total Transactions: 3 | Net: +$1898.61
       ```
   
   - Add new method `buildFullContext(profile, debts, fortnight, history?, pageContext?): string`
     - Combines all context sources:
       1. System prompt (unchanged, passed via GeminiAiProvider constructor)
       2. User financial context (existing `buildUserContext()`)
       3. Page context (new `formatPageContext()`)
       4. Conversation history (new `formatConversationHistory()`)
     - Return order: Financial context → Page context → Conversation history
     - Add separators (`===`) for clarity

4. **Unit tests for Phase 1** — Add tests to [backend/tests/unit/domain/services/barefoot-advisor.service.test.ts](backend/tests/unit/domain/services/barefoot-advisor.service.test.ts)
   - Test `formatConversationHistory()` with 0, 1, 5 messages
   - Test `formatPageContext()` for each page type
   - Test `buildFullContext()` combines all sources correctly
   - Test token limits (ensure context doesn't exceed reasonable size)

**Deliverable:** Backend can accept and format conversation history + page context. Ready for use case integration.

---

## Phase 2: Application Layer (Use Case + Token Tracking)

**Objective:** Update use case to handle new context types. Add token usage tracking via AI provider interface.

### Tasks

1. **Update IAiProvider interface** — Modify [backend/src/domain/services/ai-provider.interface.ts](backend/src/domain/services/ai-provider.interface.ts)
   - Change return type to include token usage:
     ```typescript
     export interface AiResponse {
       text: string;
       usage?: {
         promptTokens: number;
         completionTokens: number;
         totalTokens: number;
       };
     }
     
     export interface IAiProvider {
       generateResponse(userMessage: string, systemContext: string): Promise<AiResponse>;
     }
     ```
   - Rationale: Need token data for user display and cost tracking

2. **Update GeminiAiProvider** — Modify [backend/src/infrastructure/ai/gemini-ai-provider.ts](backend/src/infrastructure/ai/gemini-ai-provider.ts)
   - Change return type: `Promise<string>` → `Promise<AiResponse>`
   - Extract token usage from Gemini response:
     ```typescript
     const response = await this.client.models.generateContent({...});
     
     return {
       text: response.text || '',
       usage: response.usageMetadata ? {
         promptTokens: response.usageMetadata.promptTokenCount || 0,
         completionTokens: response.usageMetadata.candidatesTokenCount || 0,
         totalTokens: response.usageMetadata.totalTokenCount || 0,
       } : undefined,
     };
     ```
   - Gemini SDK includes `usageMetadata` in response (check API docs)

3. **Update SendChatMessageUseCase** — Modify [backend/src/application/use-cases/send-chat-message.use-case.ts](backend/src/application/use-cases/send-chat-message.use-case.ts)
   - Accept new fields from `SendChatMessageRequest`:
     - `conversationHistory?: ChatMessage[]`
     - `pageContext?: PageContext`
   
   - Filter conversation history:
     ```typescript
     // Keep only last 5 messages OR messages from last 10 minutes
     const filteredHistory = this.filterConversationHistory(
       request.conversationHistory || []
     );
     
     private filterConversationHistory(history: ChatMessage[]): ChatMessage[] {
       const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
       const recent = history.filter(msg => 
         new Date(msg.timestamp).getTime() > tenMinutesAgo
       );
       return recent.slice(-5); // Keep last 5
     }
     ```
   
   - Build full context:
     ```typescript
     const fullContext = this.advisorService.buildFullContext(
       profile,
       debts,
       currentFortnight,
       filteredHistory,
       request.pageContext
     );
     ```
   
   - Call AI provider and extract token usage:
     ```typescript
     const aiResponse = await this.aiProvider.generateResponse(
       request.message,
       fullContext
     );
     
     return {
       response: aiResponse.text,
       messageId: randomUUID(),
       timestamp: new Date().toISOString(),
       tokenUsage: aiResponse.usage,
     };
     ```

4. **Unit tests for Phase 2** — Update [backend/tests/unit/application/use-cases/send-chat-message.use-case.test.ts](backend/tests/unit/application/use-cases/send-chat-message.use-case.test.ts)
   - Test conversation history filtering (time-based and count-based)
   - Test page context passed to advisor service
   - Test token usage returned in DTO
   - Mock `IAiProvider.generateResponse()` to return `AiResponse` with usage
   - Test with 0, 1, 5, 10 messages in history

**Deliverable:** Use case orchestrates full context (history + page + financial data) and returns token usage.

---

## Phase 3: Frontend State (Conversation History + Page Detection)

**Objective:** Track conversation history in frontend, auto-detect page context, send both to backend.

### Tasks

1. **Update frontend types** — Modify [frontend/src/api/types.ts](frontend/src/api/types.ts)
   - Add `ChatMessage` (same as backend):
     ```typescript
     export interface ChatMessage {
       id: string;
       role: 'user' | 'assistant';
       content: string;
       timestamp: string;
     }
     ```
   - Add `PageContext`:
     ```typescript
     export type PageKey = 'dashboard' | 'transactions' | 'debts' | 'fortnight' | 'profile' | 'general';
     
     export interface PageContext {
       page: PageKey;
       fortnightId?: string;
       debtId?: string;
       transactions?: TransactionDTO[];
       specificDebt?: DebtDTO;
       fortnightSnapshot?: FortnightDetailDTO;
     }
     ```
   - Update `SendChatMessageRequest`:
     ```typescript
     export interface SendChatMessageRequest {
       message: string;
       conversationHistory?: ChatMessage[];
       pageContext?: PageContext;
     }
     ```
   - Update `ChatResponseDTO` to include `tokenUsage?`

2. **Update API client** — Modify [frontend/src/api/client.ts](frontend/src/api/client.ts)
   - Change signature:
     ```typescript
     sendChatMessage: (request: SendChatMessageRequest) =>
       request<ChatResponseDTO>('/chat/message', 'POST', request),
     ```
   - Now accepts full request object (not just string)

3. **Update useChat hook** — Modify [frontend/src/hooks/useChat.ts](frontend/src/hooks/useChat.ts)
   - Change `messages` type from local to `ChatMessage[]` (with `id`, `role`, `content`, `timestamp`)
   - Add state for token usage:
     ```typescript
     const [totalTokensUsed, setTotalTokensUsed] = useState(0);
     ```
   - Update `sendMessage` signature:
     ```typescript
     const sendMessage = useCallback(async (
       messageText: string,
       pageContext?: PageContext
     ) => {
       // Generate user message
       const userMessage: ChatMessage = {
         id: crypto.randomUUID(),
         role: 'user',
         content: messageText,
         timestamp: new Date().toISOString(),
       };
       
       setMessages(prev => [...prev, userMessage]);
       setIsLoading(true);
       setError(null);
       
       try {
         // Send with history (last 5) + page context
         const response = await api.sendChatMessage({
           message: messageText,
           conversationHistory: messages.slice(-5), // Last 5 messages
           pageContext,
         });
         
         // Add assistant response
         const assistantMessage: ChatMessage = {
           id: response.messageId,
           role: 'assistant',
           content: response.response,
           timestamp: response.timestamp,
         };
         
         setMessages(prev => [...prev, assistantMessage]);
         
         // Update token usage
         if (response.tokenUsage) {
           setTotalTokensUsed(prev => prev + response.tokenUsage.totalTokens);
         }
       } catch (error) {
         // Remove user message on error
         setMessages(prev => prev.slice(0, -1));
         setError(error.message);
       } finally {
         setIsLoading(false);
       }
     }, [messages]);
     ```
   - Return `totalTokensUsed` from hook

4. **Create usePageContext hook** — Add [frontend/src/hooks/usePageContext.ts](frontend/src/hooks/usePageContext.ts)
   - Custom hook to detect current page and gather relevant data:
     ```typescript
     import { useLocation } from 'react-router-dom';
     import { useMemo } from 'react';
     
     export function usePageContext(): PageContext | undefined {
       const location = useLocation();
       
       // Get current page state from location or context
       // This will vary based on your routing structure
       
       return useMemo(() => {
         const path = location.pathname;
         
         if (path === '/' || path === '/dashboard') {
           return { page: 'dashboard' };
         }
         
         if (path.startsWith('/transactions')) {
           // Transactions page should expose currentFortnightId and transactions via context or props
           // For now, return basic context (will enhance in Phase 4)
           return { page: 'transactions' };
         }
         
         if (path.startsWith('/debts')) {
           return { page: 'debts' };
         }
         
         if (path.startsWith('/fortnight')) {
           return { page: 'fortnight' };
         }
         
         if (path.startsWith('/profile')) {
           return { page: 'profile' };
         }
         
         return { page: 'general' };
       }, [location.pathname]);
     }
     ```
   - Rationale: Simple hook to start, will enhance with data in Phase 4

5. **Update ChatWidget** — Modify [frontend/src/components/ChatWidget.tsx](frontend/src/components/ChatWidget.tsx)
   - Import `usePageContext` hook
   - Get page context:
     ```typescript
     const pageContext = usePageContext();
     ```
   - Pass to `sendMessage`:
     ```typescript
     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       if (!inputValue.trim() || isLoading) return;
       
       const message = inputValue.trim();
       setInputValue('');
       await sendMessage(message, pageContext); // Pass page context
     };
     ```
   - Display token usage in drawer footer (if > 0):
     ```tsx
     {totalTokensUsed > 0 && (
       <Text size="xs" c="dimmed" ta="center">
         Tokens used: {totalTokensUsed.toLocaleString()}
       </Text>
     )}
     ```

**Deliverable:** Frontend tracks conversation history, detects page context, sends both to backend. Token usage displayed.

---

## Phase 4: Rich Page Context (Data Injection)

**Objective:** Inject actual page data (transactions, debts, fortnights) into page context. Requires accessing view state.

### Tasks

1. **Create PageContextProvider** — Add [frontend/src/contexts/PageContextProvider.tsx](frontend/src/contexts/PageContextProvider.tsx)
   - Context to store page-specific data:
     ```typescript
     interface PageContextState {
       pageData: {
         transactions?: TransactionDTO[];
         debts?: DebtDTO[];
         selectedDebt?: DebtDTO;
         fortnight?: FortnightDetailDTO;
         fortnightId?: string;
       };
       setPageData: (data: Partial<PageContextState['pageData']>) => void;
     }
     
     export const PageContextProvider = ({ children }) => {
       const [pageData, setPageData] = useState<PageContextState['pageData']>({});
       
       return (
         <PageContext.Provider value={{ pageData, setPageData }}>
           {children}
         </PageContext.Provider>
       );
     };
     
     export const usePageContextData = () => {
       const context = useContext(PageContext);
       if (!context) throw new Error('usePageContextData must be within PageContextProvider');
       return context;
     };
     ```

2. **Update App.tsx** — Modify [frontend/src/App.tsx](frontend/src/App.tsx)
   - Wrap `AppContent` in `PageContextProvider`:
     ```tsx
     export default function App() {
       return (
         <ChatProvider>
           <PageContextProvider>
             <AppContent />
           </PageContextProvider>
         </ChatProvider>
       );
     }
     ```

3. **Update TransactionsView** — Modify [frontend/src/views/TransactionsView.tsx](frontend/src/views/TransactionsView.tsx)
   - Import `usePageContextData`
   - Set transactions when they load:
     ```typescript
     const { setPageData } = usePageContextData();
     
     useEffect(() => {
       if (transactions && currentFortnightId) {
         setPageData({
           transactions,
           fortnightId: currentFortnightId,
         });
       }
     }, [transactions, currentFortnightId, setPageData]);
     
     // Clear on unmount
     useEffect(() => {
       return () => setPageData({});
     }, [setPageData]);
     ```

4. **Update DebtsView** — Modify [frontend/src/views/DebtsView.tsx](frontend/src/views/DebtsView.tsx)
   - Set debts when they load:
     ```typescript
     const { setPageData } = usePageContextData();
     
     useEffect(() => {
       if (debts) {
         setPageData({ debts });
       }
     }, [debts, setPageData]);
     ```
   - If user selects a specific debt (e.g., clicks to view details):
     ```typescript
     const handleDebtClick = (debt: DebtDTO) => {
       setPageData({ selectedDebt: debt });
       // ... other logic
     };
     ```

5. **Update FortnightView** — Modify [frontend/src/views/FortnightView.tsx](frontend/src/views/FortnightView.tsx)
   - Set fortnight snapshot:
     ```typescript
     const { setPageData } = usePageContextData();
     
     useEffect(() => {
       if (fortnightDetail) {
         setPageData({
           fortnight: fortnightDetail,
           fortnightId: selectedFortnightId,
         });
       }
     }, [fortnightDetail, selectedFortnightId, setPageData]);
     ```

6. **Update DashboardView** — Modify [frontend/src/views/DashboardView.tsx](frontend/src/views/DashboardView.tsx)
   - Set dashboard data (if needed for specific insights):
     ```typescript
     const { setPageData } = usePageContextData();
     
     useEffect(() => {
       if (dashboardData) {
         setPageData({
           fortnight: dashboardData.currentFortnight,
           debts: dashboardData.debts,
         });
       }
     }, [dashboardData, setPageData]);
     ```

7. **Update usePageContext hook** — Modify [frontend/src/hooks/usePageContext.ts](frontend/src/hooks/usePageContext.ts)
   - Combine route detection with page data:
     ```typescript
     export function usePageContext(): PageContext | undefined {
       const location = useLocation();
       const { pageData } = usePageContextData();
       
       return useMemo(() => {
         const path = location.pathname;
         
         if (path === '/' || path === '/dashboard') {
           return {
             page: 'dashboard',
             // No specific data needed for dashboard
           };
         }
         
         if (path.startsWith('/transactions')) {
           return {
             page: 'transactions',
             fortnightId: pageData.fortnightId,
             transactions: pageData.transactions, // Actual loaded transactions
           };
         }
         
         if (path.startsWith('/debts')) {
           return {
             page: 'debts',
             specificDebt: pageData.selectedDebt, // If viewing specific debt
           };
         }
         
         if (path.startsWith('/fortnight')) {
           return {
             page: 'fortnight',
             fortnightId: pageData.fortnightId,
             fortnightSnapshot: pageData.fortnight,
           };
         }
         
         if (path.startsWith('/profile')) {
           return { page: 'profile' };
         }
         
         return { page: 'general' };
       }, [location.pathname, pageData]);
     }
     ```

**Deliverable:** Page context now includes actual loaded data (transactions, debts, fortnights). AI can see what user sees.

---

## Phase 5: UI Enhancements (History Display + Token Monitoring)

**Objective:** Improve chat UI to show conversation history indicators and token usage warnings.

### Tasks

1. **Add conversation indicators to ChatWidget** — Modify [frontend/src/components/ChatWidget.tsx](frontend/src/components/ChatWidget.tsx)
   - Show "Context Aware" badge when page context exists:
     ```tsx
     {pageContext && pageContext.page !== 'general' && (
       <Badge
         color="teal"
         size="sm"
         leftSection={<IconEye size={12} />}
       >
         Viewing: {pageContext.page}
       </Badge>
     )}
     ```
   - Show message count in header:
     ```tsx
     <Group justify="space-between">
       <Text size="sm" fw={500}>Barefoot Advisor</Text>
       {messages.length > 0 && (
         <Badge size="sm" variant="light">
           {messages.length} messages
         </Badge>
       )}
     </Group>
     ```
   - Add "Clear History" confirmation dialog:
     ```tsx
     const handleClearHistory = () => {
       if (messages.length > 5) {
         // Show confirmation
         if (!confirm(`Clear ${messages.length} messages?`)) return;
       }
       clearMessages();
     };
     ```

2. **Add token usage monitoring** — Add [frontend/src/components/TokenUsageIndicator.tsx](frontend/src/components/TokenUsageIndicator.tsx)
   - Component to display token usage with color coding:
     ```tsx
     interface TokenUsageIndicatorProps {
       totalTokens: number;
     }
     
     export function TokenUsageIndicator({ totalTokens }: TokenUsageIndicatorProps) {
       const cost = (totalTokens / 1000000) * 0.15; // Gemini pricing estimate
       const color = totalTokens > 50000 ? 'red' : totalTokens > 20000 ? 'yellow' : 'green';
       
       return (
         <Tooltip label={`Estimated cost: $${cost.toFixed(4)}`}>
           <Badge color={color} variant="light" size="xs">
             {(totalTokens / 1000).toFixed(1)}k tokens
           </Badge>
         </Tooltip>
       );
     }
     ```
   - Import and use in ChatWidget footer

3. **Add context summary in empty state** — Modify [frontend/src/components/ChatWidget.tsx](frontend/src/components/ChatWidget.tsx)
   - Update empty state to show what AI can see:
     ```tsx
     {messages.length === 0 && (
       <Stack gap="md" align="center" py="xl">
         <Text size="sm" c="dimmed" ta="center">
           Ask the Barefoot Advisor anything!
         </Text>
         
         {pageContext && pageContext.page !== 'general' && (
           <Paper p="xs" bg="teal.0" withBorder>
             <Text size="xs" c="teal.9">
               📊 I can see your {pageContext.page} data
             </Text>
           </Paper>
         )}
         
         <Stack gap="xs">
           <Text size="xs" fw={500}>Try asking:</Text>
           {pageContext?.page === 'transactions' && (
             <>
               <Text size="xs" c="dimmed">• "Analyze my spending this fortnight"</Text>
               <Text size="xs" c="dimmed">• "Where can I cut back on expenses?"</Text>
             </>
           )}
           {pageContext?.page === 'debts' && (
             <>
               <Text size="xs" c="dimmed">• "Should I increase my Fire Extinguisher?"</Text>
               <Text size="xs" c="dimmed">• "How long until I'm debt-free?"</Text>
             </>
           )}
           {/* ... other page-specific suggestions */}
         </Stack>
       </Stack>
     )}
     ```

4. **Add help content for context features** — Modify [frontend/src/constants/helpContent.ts](frontend/src/constants/helpContent.ts)
   - Update `chat` help page to explain context awareness:
     ```typescript
     {
       title: 'Context Awareness',
       body: 'The AI sees what you see! When you open chat from different pages, the AI has access to:\n\n- Transactions page: All visible transactions for the current fortnight\n- Debts page: Your debt list and selected debt details\n- Fortnight page: Bucket allocations and spending breakdown\n- Dashboard: Overall financial snapshot\n\nThis means you can ask specific questions like "Why did I overspend on Splurge?" and the AI will analyze your actual transactions.',
     },
     {
       title: 'Conversation History',
       body: 'The AI remembers your last 5 messages (or last 10 minutes of chat). This allows for natural follow-up questions without repeating context. Example:\n\nYou: "How much have I spent on dining out?"\nAI: "You\'ve spent $120 on dining out this fortnight..."\nYou: "Is that too much?"\nAI: [Understands "that" refers to dining out spending]',
     },
     ```

5. **Add token usage to ProfileView** — Modify [frontend/src/views/ProfileView.tsx](frontend/src/views/ProfileView.tsx)
   - Display lifetime token usage (if tracked):
     ```tsx
     <Paper p="md" withBorder>
       <Text size="sm" fw={500} mb="xs">AI Chat Usage</Text>
       <Group justify="space-between">
         <Text size="xs" c="dimmed">Total tokens used:</Text>
         <TokenUsageIndicator totalTokens={totalTokensUsed} />
       </Group>
     </Paper>
     ```
   - Add reset button if desired

**Deliverable:** Rich UI showing context awareness, conversation history indicators, token usage monitoring.

---

## Phase 6: Testing & Optimization

**Objective:** End-to-end testing, performance optimization, token usage limits.

### Tasks

1. **Backend integration tests** — Add [backend/tests/integration/chat-with-context.test.ts](backend/tests/integration/chat-with-context.test.ts)
   - Test full flow with conversation history:
     - Send message 1: "How much debt do I have?"
     - Send message 2 with history: "How long to pay it off?"
     - Verify AI gets full context
   - Test page context injection:
     - Mock transactions page context
     - Verify formatted transactions in AI context
   - Test token usage returned in response

2. **Frontend component tests** — Add tests for ChatWidget with context
   - Test page context changes when route changes
   - Test conversation history sent with each message
   - Test token usage display updates

3. **Manual E2E testing flow**
   ```
   1. Open app → Dashboard
   2. Open chat → Ask "What's my financial status?"
   3. Navigate to Transactions page
   4. Ask "Did I overspend on Splurge?" (should see transactions)
   5. Ask "Which transaction was unnecessary?" (follow-up, has history)
   6. Navigate to Debts page
   7. Ask "Should I increase payments?" (should see debts)
   8. Verify token usage displayed and updates
   9. Clear history → Verify messages cleared
   10. Ask new question → Verify no history sent
   ```

4. **Performance optimization**
   - Add debouncing to page context updates (avoid sending same data repeatedly)
   - Implement memoization for `formatPageContext()` (cache formatted strings)
   - Add compression for large transaction lists (e.g., limit to 50 most recent)
   - Monitor bundle size impact (conversation history shouldn't bloat frontend)

5. **Token usage limits and warnings**
   - Add warning when single context exceeds 10k tokens:
     ```tsx
     {estimatedTokens > 10000 && (
       <Alert color="yellow" icon={<IconAlertTriangle />}>
         Large context detected. Consider clearing history to reduce costs.
       </Alert>
     )}
     ```
   - Add setting in ProfileView to disable context features:
     ```tsx
     <Switch
       label="Send page context with chat messages"
       description="AI can see transactions, debts, etc. Increases token usage."
       checked={sendPageContext}
       onChange={(e) => setSendPageContext(e.currentTarget.checked)}
     />
     ```

6. **Update documentation**
   - Update main [README.md](README.md) with context-aware features
   - Update [docs/CHAT_WIDGET_IMPLEMENTATION.md](docs/CHAT_WIDGET_IMPLEMENTATION.md):
     - Document conversation history (5 messages, 10-min window)
     - Document page context detection
     - Document token usage tracking
     - Add example contexts for each page
   - Update help content with best practices

**Deliverable:** Fully tested, optimized, documented context-aware chat system.

---

## Cross-Phase Considerations

### Token Usage Management
- **Gemini 2.5 Flash Pricing (2026 estimate):** ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Target:** <2000 tokens per message (with context + history)
- **Strategies:**
  1. Limit transactions to 50 most recent
  2. Limit conversation history to 5 messages or 10 minutes
  3. Truncate long debt payment histories
  4. Format data concisely (no verbose descriptions)

### Context Priority
When multiple contexts exist, prioritize:
1. System instruction (always present, via constructor)
2. User financial snapshot (income, debts, current fortnight)
3. Page context (what user is looking at)
4. Conversation history (last N messages)

If total context approaches token limit (e.g., 30k), trim in reverse order:
- Remove oldest conversation messages first
- Simplify page context (fewer transactions)
- Keep financial snapshot minimal

### Data Freshness
- Page context is ephemeral (only current page load)
- Conversation history persists in browser session (cleared on refresh)
- Financial data refetched on each message (always current)
- No server-side session storage (stateless architecture preserved)

### Privacy Considerations
- All data sent to Gemini API (no local-only option in this phase)
- Conversation history never persisted to database
- Token usage tracking can be disabled in profile
- Clear disclosure in help content

### Future Extensibility Points
1. **Persistent conversation threads** — Save conversation history to database, resume later
2. **Conversation branching** — Multiple chat threads for different topics
3. **Export conversations** — Download chat history as text/PDF
4. **Context caching** — Cache expensive context formatting (Gemini supports cached contexts)
5. **Smart context pruning** — Use AI to summarize old messages instead of truncating

---

## Deliverable Summary by Phase

| Phase | Deliverables | Key Files |
|-------|--------------|-----------|
| 1 | Backend DTOs + Domain service context formatting | `chat.dto.ts`, `chat.schema.ts`, `barefoot-advisor.service.ts` |
| 2 | Use case with history filtering + Token tracking | `send-chat-message.use-case.ts`, `ai-provider.interface.ts`, `gemini-ai-provider.ts` |
| 3 | Frontend conversation history + Page detection | `useChat.ts`, `usePageContext.ts`, `ChatWidget.tsx`, `types.ts`, `client.ts` |
| 4 | Rich page context with actual data injection | `PageContextProvider.tsx`, all view components updated |
| 5 | UI enhancements + Token usage indicators | `TokenUsageIndicator.tsx`, `ChatWidget.tsx`, `helpContent.ts` |
| 6 | Testing, optimization, documentation | Integration tests, E2E flow, performance tuning, docs |

---

## Estimated Timeline

- **Phase 1:** 2-3 hours (Backend foundation)
- **Phase 2:** 2-3 hours (Use case + token tracking)
- **Phase 3:** 3-4 hours (Frontend state management)
- **Phase 4:** 4-5 hours (Rich page context - most views)
- **Phase 5:** 2-3 hours (UI polish)
- **Phase 6:** 3-4 hours (Testing + optimization)

**Total:** 16-22 hours (2-3 days of focused work)

---

This plan is ready for phased implementation. Each phase is self-contained, testable, and adds incremental value. The system will be significantly more useful after Phase 4 (when AI can see page data).
