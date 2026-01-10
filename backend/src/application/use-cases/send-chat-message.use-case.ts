import { randomUUID } from 'crypto';
import type { FortnightSnapshot } from '../../domain/model/fortnight-snapshot.entity.js';
import type { IAiProvider } from '../../domain/services/ai-provider.interface.js';
import { BarefootAdvisorService } from '../../domain/services/barefoot-advisor.service.js';
import type { BudgetProfileRepository } from '../../domain/repositories/budget-profile.repository.interface.js';
import type { DebtRepository } from '../../domain/repositories/debt.repository.interface.js';
import type { FortnightSnapshotRepository } from '../../domain/repositories/fortnight-snapshot.repository.interface.js';
import type { ChatResponseDTO, SendChatMessageRequest, ChatMessage } from '../dtos/chat.dto.js';
import { UseCase } from './base.use-case.js';

/**
 * SendChatMessageUseCase: Send a message to the Barefoot Advisor AI.
 * 
 * Workflow:
 * 1. Fetch user's budget profile, debts, and current fortnight
 * 2. Filter conversation history (last 5 messages OR last 10 minutes)
 * 3. Build full context: financial + page + history using BarefootAdvisorService
 * 4. Call AI provider with user message and full context
 * 5. Return response with messageId, timestamp, and token usage
 * 
 * Error handling:
 * - If profile doesn't exist: Throw DomainError (user needs setup)
 * - If AI provider fails: Re-throw as DomainError with clear message
 * 
 * @extends UseCase<SendChatMessageRequest, ChatResponseDTO>
 * @example
 * ```typescript
 * const useCase = new SendChatMessageUseCase(
 *   profileRepo,
 *   debtRepo,
 *   fortnightRepo,
 *   geminiProvider,
 *   advisorService
 * );
 * 
 * const response = await useCase.execute({
 *   message: "Should I pay off my credit card first?",
 *   conversationHistory: [{ id: '...', role: 'user', content: '...', timestamp: '...' }],
 *   pageContext: { page: 'debts', specificDebt: {...} }
 * });
 * 
 * console.log(response.response); // AI's advice
 * console.log(response.tokenUsage?.totalTokens); // Token count
 * ```
 */
export class SendChatMessageUseCase extends UseCase<
  SendChatMessageRequest,
  ChatResponseDTO
> {
  private advisorService: BarefootAdvisorService;

  /**
   * Constructor with dependency injection.
   * All repositories are swappable (Postgres/Memory for testing).
   * AI provider is injected for flexibility (Gemini/Ollama).
   * 
   * @param profileRepository - Fetch user's budget configuration
   * @param debtRepository - Fetch user's debts
   * @param fortnightSnapshotRepository - Fetch current fortnight (optional)
   * @param aiProvider - AI backend (Gemini, Ollama, etc.)
   */
  constructor(
    private profileRepository: BudgetProfileRepository,
    private debtRepository: DebtRepository,
    private fortnightSnapshotRepository: FortnightSnapshotRepository,
    private aiProvider: IAiProvider
  ) {
    super();
    this.advisorService = new BarefootAdvisorService();
  }

  /**
   * Execute the use case: Generate AI response to user message with full context.
   * 
   * @param request - { message, conversationHistory?, pageContext? }
   * @returns ChatResponseDTO with AI response, UUID, timestamp, and token usage
   * @throws DomainError if profile doesn't exist or AI call fails
   */
  async execute(request: SendChatMessageRequest): Promise<ChatResponseDTO> {
    // Fetch user's budget profile (required for context)
    const profile = await this.profileRepository.getProfile(request.userId);
    if (!profile) {
      throw new Error('User profile not found. Please set up your budget first.');
    }

    // Fetch user's debts
    const debts = await this.debtRepository.findByPriority(request.userId);

    // Fetch current fortnight (optional, may be null)
    const fortnights = await this.fortnightSnapshotRepository.getAll(request.userId);
    const currentFortnight: FortnightSnapshot | null = fortnights.at(-1) ?? null;

    // Filter conversation history (last 5 messages OR last 10 minutes)
    const filteredHistory = this.filterConversationHistory(request.conversationHistory || []);

    // Build full context: financial snapshot + page context + conversation history
    const fullContext = this.advisorService.buildFullContext(
      profile,
      debts,
      currentFortnight,
      filteredHistory,
      request.pageContext
    );

    // Note: System prompt is passed to GeminiAiProvider constructor as systemInstruction.
    // fullContext contains user-specific data (income, debts, allocations, page, history).
    // Call AI provider with full context
    const aiResponse = await this.aiProvider.generateResponse(request.message, fullContext);

    // Generate response with token usage
    const chatResponse: ChatResponseDTO = {
      response: aiResponse.text,
      messageId: randomUUID(),
      timestamp: new Date().toISOString(),
      ...(aiResponse.usage && { tokenUsage: aiResponse.usage }),
    };

    return chatResponse;
  }

  /**
   * Filter conversation history to prevent excessive token usage.
   * Keeps last 5 messages OR messages from last 10 minutes, whichever is smaller.
   * 
   * @param history - Full conversation history
   * @returns Filtered history (max 5 messages, max 10 minutes old)
   * @private
   */
  private filterConversationHistory(history: ChatMessage[]): ChatMessage[] {
    if (!history || history.length === 0) {
      return [];
    }

    // Filter by time: keep only last 10 minutes
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const recentMessages = history.filter(msg => {
      const msgTime = new Date(msg.timestamp).getTime();
      return msgTime > tenMinutesAgo;
    });

    // Keep last 5 messages (most recent)
    return recentMessages.slice(-5);
  }
}
