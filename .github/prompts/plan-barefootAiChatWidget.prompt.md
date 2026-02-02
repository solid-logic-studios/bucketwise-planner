# Plan: Barefoot Investor AI Chat Widget (Comprehensive, Phased)

**STATUS: ✅ COMPLETED (January 4, 2026)**

All phases implemented successfully. AI chat widget is live and functional!

- ✅ Phase 1: Backend Foundation (Domain Layer)
- ✅ Phase 2: Application Layer (Use Case + DTO)
- ✅ Phase 3: Presentation Layer (HTTP Controller & Routes)
- ✅ Phase 4: Frontend Widget (React Component + Hook)
- ✅ Phase 5: Integration & Testing (Full Workflow)

**Implementation Details:** See `docs/CHAT_WIDGET_IMPLEMENTATION.md`  
**Quick Start Guide:** See `docs/CHAT_WIDGET_QUICKSTART.md`  
**Test Results:** 54/54 backend tests passing, frontend builds clean

**IMPORTANT UPDATE (Jan 4, 2026):** GeminiAiProvider now uses strict `systemInstruction` via config parameter, not prompt concatenation. System prompt enforces:
- Barefoot Investor methodology adherence
- Bucket rules with Australian context (Daily 60%, Splurge 10%, Smile 10%, Fire Extinguisher 20%)
- Correction policy for misallocated expenses (e.g., "Video games are Splurge, not Daily Expenses")
- Fire Extinguisher priority order: Bad Debt → Mojo → Grow

This ensures the AI model acts as a strict financial coach at the model level, not just via prompts.

---

Implement a Barefoot Investor AI chat widget with strict architecture: provider abstraction for extensibility, domain service encapsulating system prompt, use case orchestrating context + AI, and React drawer widget with real-time messaging. Four phases: backend foundation, HTTP layer, frontend widget, integration & testing.

---

## Phase 1: Backend Foundation (Domain Layer)

**Objective:** Build type-safe AI provider abstraction and system prompt logic.

### Tasks

1. **Create AI provider interface** — Add [backend/src/domain/services/ai-provider.interface.ts](backend/src/domain/services/ai-provider.interface.ts)
   - Define `IAiProvider` with single method: `generateResponse(userMessage: string, systemContext: string): Promise<string>`
   - Rationale: Allows swapping Gemini → Ollama/Claude without touching service logic
   - No implementation details, just contract

2. **Implement Gemini AI provider** — Add [backend/src/infrastructure/ai/gemini-ai-provider.ts](backend/src/infrastructure/ai/gemini-ai-provider.ts)
   - Install `@google/generative-ai` package (npm/pnpm)
   - Constructor accepts API key: `constructor(private apiKey: string)`
   - Implement `generateResponse()` calling `GoogleGenerativeAI` SDK
   - Use `gemini-1.5-flash` model (fast, free-tier friendly)
   - Handle API errors gracefully, throw domain `DomainError` with message
   - Return `Promise<string>` (the raw response text)

3. **Create Barefoot advisor domain service** — Add [backend/src/domain/services/barefoot-advisor.service.ts](backend/src/domain/services/barefoot-advisor.service.ts)
   - Extend `BaseDomainService` (check pattern in [backend/src/domain/services/debt-payoff-calculator.ts](backend/src/domain/services/debt-payoff-calculator.ts))
   - Define static `SYSTEM_PROMPT` property with hardcoded Barefoot guidance:
     ```
     "You are a financial advisor grounded in the Barefoot Investor methodology by Scott Pape.
      
      Barefoot Buckets: Daily Expenses (60%), Splurge (10%), Smile (10%), Fire Extinguisher (20%), Mojo (Safety Net), Grow (Wealth).
      
      Core Rule: Fire Extinguisher money is for debt payoff first, then building Mojo (3–6 months expenses), then Grow wealth.
      
      Tone: Direct, practical, no-nonsense. No jargon. Encourage small wins. Reference the user's actual budget when possible.
      
      Constraints: Only give financial advice related to Barefoot budgeting. For tax/legal questions, refer to professionals."
     ```
   - Method `buildUserContext(profile: BudgetProfile, debts: Debt[], fortnightSnapshot: FortnightSnapshot): string`
     - Returns formatted string with user's income, debts, allocations for prompt injection
     - Example: "Your fortnightly income: $2000. Current debts: Credit card $5000 (priority 1), Car $15000 (priority 2). Fire Extinguisher: $400/fortnight."
   - No external calls, pure logic

4. **Unit tests for Phase 1** — Add [backend/tests/unit/domain/services/barefoot-advisor.service.test.ts](backend/tests/unit/domain/services/barefoot-advisor.service.test.ts)
   - Test `buildUserContext()` outputs correct format
   - Test system prompt is immutable constant
   - Mock nothing (pure logic)

**Deliverable:** Type-safe provider contract + Gemini implementation + system prompt service. Ready for use case injection.

---

## Phase 2: Application Layer (Use Case + DTO)

**Objective:** Orchestrate AI call with user budget context, return typed response.

### Tasks

1. **Create chat DTOs and schemas** — Add [backend/src/application/dtos/chat.dto.ts](backend/src/application/dtos/chat.dto.ts)
   - Define `SendChatMessageRequest { message: string }`
   - Define `ChatResponseDTO { response: string; messageId: string; timestamp: Date }`
   - Add [backend/src/application/dtos/schemas/chat.schema.ts](backend/src/application/dtos/schemas/chat.schema.ts)
     - `sendChatMessageSchema = z.object({ message: z.string().min(1).max(500) })`
     - Rationale: Max 500 chars prevents token waste, keeps responses snappy

2. **Implement send chat message use case** — Add [backend/src/application/use-cases/send-chat-message.use-case.ts](backend/src/application/use-cases/send-chat-message.use-case.ts)
   - Extend `UseCase<SendChatMessageRequest, ChatResponseDTO>`
   - Constructor DI: `constructor(private profileRepository: BudgetProfileRepository, private debtRepository: DebtRepository, private fortnightSnapshotRepository: FortnightSnapshotRepository, private aiProvider: IAiProvider, private advisorService: BarefootAdvisorService)`
   - `execute(request: SendChatMessageRequest): Promise<ChatResponseDTO>`
     - Fetch user's `BudgetProfile` (income, Fire Extinguisher %)
     - Fetch all `Debt[]` with current balances
     - Fetch current `FortnightSnapshot` (bucket allocations)
     - Call `advisorService.buildUserContext()` with above data
     - Call `aiProvider.generateResponse(request.message, systemPrompt + userContext)`
     - Return `ChatResponseDTO` with response + generated UUID + current timestamp
   - Error handling: If API call fails, throw `DomainError('Failed to generate response. Please try again.')`
   - Catch and re-throw Zod validation errors as `ValidationError`

3. **Unit tests for Phase 2** — Add [backend/tests/unit/application/use-cases/send-chat-message.use-case.test.ts](backend/tests/unit/application/use-cases/send-chat-message.use-case.test.ts)
   - Mock all repositories (return sample `BudgetProfile`, `Debt[]`, `FortnightSnapshot`)
   - Mock `IAiProvider.generateResponse()` to return test response
   - Test use case:
     - Calls all repositories
     - Passes correct system prompt + context to provider
     - Returns `ChatResponseDTO` with non-empty response + valid UUID
     - Handles provider errors gracefully
   - Use `vi.mock()` for mocks, follow pattern in [backend/tests/unit/application/use-cases/get-dashboard.use-case.test.ts](backend/tests/unit/application/use-cases/get-dashboard.use-case.test.ts) if exists

**Deliverable:** Fully typed, testable use case that orchestrates budget context + AI. Ready for HTTP layer.

---

## Phase 3: Presentation Layer (HTTP Controller & Routes)

**Objective:** Expose chat as REST endpoint with validation, error mapping, standard response envelope.

### Tasks

1. **Create chat controller** — Add [backend/src/presentation/http/controllers/chat.controller.ts](backend/src/presentation/http/controllers/chat.controller.ts)
   - Extend `BaseController` (check pattern in [backend/src/presentation/http/controllers/dashboard.controller.ts](backend/src/presentation/http/controllers/dashboard.controller.ts))
   - Constructor DI: `constructor(private sendChatMessageUseCase: SendChatMessageUseCase)`
   - Method `async sendMessage(req: Request, res: Response): Promise<void>`
     - Request body already validated by middleware (contains `message: string`)
     - Call `this.sendChatMessageUseCase.execute({ message: req.body.message })`
     - Return via `this.sendSuccess(res, result)` (inherits from `BaseController`)
   - Thin controller: no validation, error handling, or business logic

2. **Create chat router** — Add [backend/src/presentation/http/routers/chat.router.ts](backend/src/presentation/http/routers/chat.router.ts)
   - Export `function buildChatRouter(controller: ChatController): Router`
   - Define route: `POST /message`
   - Apply validation middleware: `validationMiddleware(sendChatMessageSchema)`
   - Wrap controller method: `asyncHandler((req, res) => controller.sendMessage(req, res))`
   - Full route: `router.post('/message', validationMiddleware(sendChatMessageSchema), asyncHandler((req, res) => controller.sendMessage(req, res)))`
   - Rationale: Validation runs before controller, errors caught globally

3. **Wire in server composition root** — Modify [backend/src/server.ts](backend/src/server.ts)
   - After repositories and other use cases are wired:
     ```typescript
     const aiProvider = new GeminiAiProvider(process.env.GOOGLE_AI_STUDIO_API_KEY!);
     const advisorService = new BarefootAdvisorService();
     const sendChatMessageUseCase = new SendChatMessageUseCase(
       budgetProfileRepository,
       debtRepository,
       fortnightSnapshotRepository,
       aiProvider,
       advisorService
     );
     const chatController = new ChatController(sendChatMessageUseCase);
     const chatRouter = buildChatRouter(chatController);
     app.use('/chat', chatRouter);
     ```
   - Ensure `GOOGLE_AI_STUDIO_API_KEY` is in `.env` (already present)
   - Use `process.env.GOOGLE_AI_STUDIO_API_KEY!` (non-null assertion, assuming env var exists)

4. **Error mapping integration** — Verify [backend/src/application/errors/error-mapper.ts](backend/src/application/errors/error-mapper.ts)
   - Should already handle `DomainError` → 500, `ValidationError` → 400
   - Test that AI provider errors bubble correctly

5. **Integration test for Phase 3** — Add [backend/tests/integration/chat.controller.test.ts](backend/tests/integration/chat.controller.test.ts) (optional, simple)
   - Mock `GeminiAiProvider` + repositories
   - Test `POST /chat/message { message: "..." }` → `200 { success: true, data: { response: "..." } }`
   - Test `POST /chat/message { message: "" }` → `400 { success: false, error: { ... } }`

**Deliverable:** Full HTTP endpoint with validation, error handling, and response envelope. Testable via `curl` or Postman.

---

## Phase 4: Frontend Widget (React Component + Hook)

**Objective:** Build user-facing chat drawer with message history, input, and loading states.

### Tasks

1. **Create custom chat hook** — Add [frontend/src/hooks/useChat.ts](frontend/src/hooks/useChat.ts)
   - Define `Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }`
   - Define `UseChatReturn { messages: Message[]; loading: boolean; error: string | null; sendMessage: (text: string) => Promise<void>; clearError: () => void }`
   - Hook logic:
     - State: `messages: Message[]`, `loading: boolean`, `error: string | null`
     - `sendMessage(text)` function:
       - Validate text is non-empty
       - Add user message to history
       - Set `loading = true`
       - Call `api.sendChatMessage(text)` (to be added in Phase 4, Task 3)
       - Add assistant response to history
       - Set `loading = false`
       - Handle errors: set `error`, re-throw or suppress
       - Clear input in caller component (via return state)
     - `clearError()` sets `error = null`
   - Follow pattern of custom hooks in [frontend/src/hooks](frontend/src/hooks) (if any) or similar to `useHelp()` context pattern

2. **Create chat context provider** — Add [frontend/src/components/ChatProvider.tsx](frontend/src/components/ChatProvider.tsx)
   - Define `ChatContextValue { messages: Message[]; loading: boolean; error: string | null; sendMessage: (text: string) => Promise<void>; clearError: () => void }`
   - Export `ChatContext = createContext<ChatContextValue | undefined>(undefined)`
   - Export `ChatProvider({ children })` component:
     - Use `useChat()` hook internally
     - Provide context value to children
     - Return `<ChatContext.Provider value={{...}}>{children}</ChatContext.Provider>`
   - Export `useChat()` hook:
     - Retrieve context, throw error if undefined (not wrapped)
     - Return context value

3. **Create chat widget component** — Add [frontend/src/components/ChatWidget.tsx](frontend/src/components/ChatWidget.tsx)
   - Use `useChat()` hook to access messages, loading, error
   - Use `useState` for:
     - `isOpen: boolean` (drawer visibility)
     - `inputValue: string` (textarea input)
   - Layout:
     - Floating `ActionIcon` button (Mantine, bottom-right corner):
       - Icon: MessageCircle or ChatBubble from tabler icons
       - onClick: toggle `isOpen`
       - Styles: `position: fixed`, `bottom: 20px`, `right: 20px`, `zIndex: 1000`
     - `Drawer` (Mantine):
       - `opened={isOpen}`, `onClose={() => setIsOpen(false)}`
       - `position="right"`, `size="sm"` or `"md"`
       - Title: "Barefoot Advisor"
       - Content:
         - Message list (scrollable `Stack` with max height):
           - Loop `messages`, render each as `Paper` with left/right alignment (user right, assistant left)
           - User messages: light background (gray)
           - Assistant messages: teal/accent background
           - Show timestamps in small gray text
         - If `loading`: Show `<Center><Loader /> Barefoot is thinking...</Center>`
         - If `error`: Show `<ErrorAlert message={error} onClose={clearError} />`
         - Input area:
           - `Textarea` (controlled): `value={inputValue}`, `onChange={(e) => setInputValue(e.target.value)}`
           - Placeholder: "Ask about your budget..."
           - Props: `placeholder`, `autoFocus`, `disabled={loading}`
           - `Button` (send):
             - Label: "Send" or icon `IconSend`
             - onClick: call `sendMessage(inputValue)`, clear input, scroll to bottom
             - Disabled: `loading || !inputValue.trim()`
     - Tooltip on floating button: "Chat with Barefoot Advisor (mod+k)"

4. **Add chat API endpoint** — Modify [frontend/src/api/client.ts](frontend/src/api/client.ts)
   - Add to `api` export object:
     ```typescript
     sendChatMessage: (message: string) => 
       request<ChatResponseDTO>('/chat/message', 'POST', { message })
     ```
   - Add [frontend/src/api/types.ts](frontend/src/api/types.ts):
     ```typescript
     export interface ChatResponseDTO {
       response: string;
       messageId: string;
       timestamp: Date;
     }
     ```

5. **Wrap app in provider and add hotkey** — Modify [frontend/src/main.tsx](frontend/src/main.tsx)
   - Wrap `<App />` in `<ChatProvider><App /></ChatProvider>`
   - In `App.tsx` or root component:
     - Import `useChat` hook
     - Add hotkey via `useHotkeys([['mod+k', () => setIsOpen(true)]])`
     - Or: Pass global hotkey listener if `ChatWidget` manages its own state

6. **Export widget from components** — Modify [frontend/src/components/index.ts](frontend/src/components/index.ts)
   - Add export: `export { ChatWidget } from './ChatWidget';`

7. **Frontend tests (optional)** — Add [frontend/tests/ChatWidget.test.tsx](frontend/tests/ChatWidget.test.tsx)
   - Mock `useChat` hook
   - Test widget renders button, opens drawer, sends message, displays responses
   - Test loading state, error state

**Deliverable:** Full-featured chat widget integrated into app with context provider, custom hook, and hotkey support.

---

## Phase 5: Integration & Testing (Full Workflow)

**Objective:** Verify end-to-end functionality, handle edge cases, ensure robustness.

### Tasks

1. **Manual end-to-end test**
   - Start backend: `cd backend && pnpm dev`
   - Start frontend: `cd frontend && pnpm dev`
   - Open app in browser
   - Press `mod+k` to open chat
   - Type message: "Help me understand my Fire Extinguisher allocation"
   - Verify:
     - Message appears on right (user)
     - Loading state shows "Barefoot is thinking..."
     - Response appears on left (assistant) after ~2–5 seconds
     - No console errors in browser or backend logs
     - Message timestamps are correct

2. **Edge case testing**
   - Empty message: Verify send button disabled
   - Very long message (>500 chars): Verify validation error or truncation
   - Rapid clicks: Verify only one API call
   - Network error (disconnect network): Verify error message displayed
   - Missing `GOOGLE_AI_STUDIO_API_KEY`: Verify server fails to start with clear error

3. **Type checking and linting**
   - Backend: `cd backend && pnpm exec tsc --noEmit` (no TypeScript errors)
   - Frontend: `cd frontend && pnpm exec tsc --noEmit` (no TypeScript errors)
   - Run linters if configured (ESLint, Prettier)

4. **Full test suite**
   - Backend: `cd backend && pnpm test` (all unit/integration tests pass)
   - Frontend: `cd frontend && pnpm test` (if test setup exists)
   - Review coverage: AI provider, advisor service, use case should have >80% coverage

5. **Documentation (optional but recommended)**
   - Add comment block to `send-chat-message.use-case.ts`:
     ```typescript
     /**
      * Sends a user message to the Barefoot Advisor AI service.
      * 
      * Fetches the user's profile, current debts, and fortnight snapshot,
      * builds context string, and passes user message + system prompt to AI provider.
      * 
      * @throws DomainError if AI provider call fails or profile not found
      * @throws ValidationError if message validation fails
      */
     ```
   - Add to README or internal docs: "Chat widget is available via mod+k hotkey"

6. **Performance checks**
   - Measure API response time: Should be <5 seconds (Gemini flash model)
   - Check bundle size: Ensure `@google/generative-ai` doesn't bloat backend
   - Frontend: Verify drawer doesn't lag on message add/scroll

**Deliverable:** Production-ready feature with comprehensive testing and documentation.

---

## Cross-Phase Considerations

### Dependencies & Ordering
- **Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5**
  - Cannot start Phase 2 without Phase 1 types
  - Cannot start Phase 3 without Phase 2 use case
  - Cannot start Phase 4 without Phase 3 endpoint
  - Phase 5 integrates all

### Common Pitfalls to Avoid
1. **API key not loaded** — Ensure `GOOGLE_AI_STUDIO_API_KEY` in `.env` before starting backend
2. **Prompt injection** — System prompt is hardcoded; user message concatenated, not interpolated. Safe from injection attacks.
3. **Message overflow** — Max 500 chars per message prevents token waste. Display warning if user tries >500.
4. **Loading states** — Don't forget to set `loading = false` in catch blocks (use try/finally if needed)
5. **Timezone in timestamps** — Use `new Date()` (UTC) for `ChatResponseDTO.timestamp`, avoid local time
6. **Context data missing** — If user has no debts/fortnights, `buildUserContext()` should still return valid string (e.g., "No debts recorded yet. Start by creating your first debt.")
7. **CORS if needed** — If frontend on different origin than backend, ensure no CORS issues (usually not in local dev)

### Testing Strategy Summary
- **Unit**: Domain service logic, use case orchestration, DTOs
- **Integration**: Full HTTP endpoint with mocked AI provider
- **E2E**: Manual testing with real Gemini API (smoke test, one success case)
- **Coverage target**: >80% for critical paths (use case, domain service, controller)

### Performance Notes
- **Gemini flash model** — Optimized for speed, suitable for chat
- **Context building** — O(N) where N = number of debts/fortnights. Should be <100ms
- **Response time** — API call typically 2–5 seconds. Consider frontend timeout of 30s
- **No caching** — Each message queries repos fresh (ensures latest budget data)

### Future Extensibility Points
1. **Message persistence** — Add `ChatMessage` entity + repository to store conversation history
2. **Multiple conversations** — Add `Conversation` entity, thread messages
3. **Ollama provider** — Implement `OllamaAiProvider` without changing `BarefootAdvisorService` or use case
4. **Streaming responses** — Migrate to Server-Sent Events (SSE) for real-time response streaming
5. **Rate limiting** — Add middleware to limit chat requests per user/hour

---

## Deliverable Summary by Phase

| Phase | Deliverables | Key Files |
|-------|--------------|-----------|
| 1 | Type-safe AI provider + system prompt | `ai-provider.interface.ts`, `gemini-ai-provider.ts`, `barefoot-advisor.service.ts` |
| 2 | Use case + DTOs + unit tests | `send-chat-message.use-case.ts`, `chat.dto.ts`, `chat.schema.ts`, `*.test.ts` |
| 3 | HTTP controller + router + wiring | `chat.controller.ts`, `chat.router.ts`, `server.ts` (modified) |
| 4 | React widget + hook + provider + API | `ChatWidget.tsx`, `useChat.ts`, `ChatProvider.tsx`, `client.ts` (modified) |
| 5 | Full test coverage + docs | Test suites, E2E validation, README updates |

---

This plan is ready for implementation. Each phase is self-contained, testable, and follows your existing DDD + SOLID patterns.
