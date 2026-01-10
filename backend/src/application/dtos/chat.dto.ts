import type { FortnightDetailDTO } from './fortnight-detail.dto.js';
import type { TransactionDTO } from './transaction.dto.js';

/**
 * ChatMessage: Individual message in a conversation thread.
 * Used for conversation history to maintain context across multiple messages.
 */
export interface ChatMessage {
  /**
   * Unique ID for this message (UUID v4)
   */
  id: string;

  /**
   * Role of the message sender
   */
  role: 'user' | 'assistant';

  /**
   * The message content/text
   */
  content: string;

  /**
   * When this message was sent (ISO 8601 string)
   */
  timestamp: string;
}

/**
 * DebtDTO: Simplified debt information for page context.
 * Subset of full debt entity needed for AI context.
 */
export interface DebtDTO {
  id: string;
  name: string;
  debtType: string;
  currentBalanceCents: number;
  minimumPaymentCents: number;
  minPaymentFrequency: string;
  annualInterestRatePercent: number;
  priority: number;
}

/**
 * PageContext: Information about what page the user is currently viewing.
 * Allows AI to see and reference specific data visible to user.
 */
export interface PageContext {
  /**
   * Which page the user is currently on
   */
  page: 'dashboard' | 'transactions' | 'debts' | 'fortnight' | 'profile' | 'general';

  /**
   * Current fortnight ID (if on Transactions or Fortnight page)
   */
  fortnightId?: string;

  /**
   * Specific debt ID (if viewing single debt details)
   */
  debtId?: string;

  /**
   * Transactions visible on current page (if on Transactions page)
   */
  transactions?: TransactionDTO[];

  /**
   * Specific debt details (if on Debts page with debt selected)
   */
  specificDebt?: DebtDTO;

  /**
   * Fortnight snapshot (if on Fortnight detail page)
   */
  fortnightSnapshot?: FortnightDetailDTO;
}

/**
 * SendChatMessageRequest: DTO for incoming chat message from user.
 * Validated via Zod schema before reaching controller.
 */
export interface SendChatMessageRequest {
  userId: string;
  /**
   * The user's message/question
   * Constraints: min 1 char, max 500 chars
   */
  message: string;

  /**
   * Optional conversation history (last N messages)
   * Limited to 10 messages max via validation
   * Use case will filter to last 5 or 10-minute window
   */
  conversationHistory?: ChatMessage[];

  /**
   * Optional page context showing what user is currently viewing
   * Allows AI to reference specific transactions, debts, etc.
   */
  pageContext?: PageContext;
}

/**
 * TokenUsage: Token consumption metrics from AI provider.
 * Used for cost tracking and user transparency.
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * ChatResponseDTO: Response from AI advisor.
 * Returned in ApiResponse<ChatResponseDTO> envelope via HTTP.
 */
export interface ChatResponseDTO {
  /**
   * The AI-generated response text
   */
  response: string;

  /**
   * Unique ID for this message exchange (UUID v4)
   * Can be used for message history/tracking if needed later
   */
  messageId: string;

  /**
   * Timestamp when response was generated (ISO 8601 string)
   * Format: YYYY-MM-DDTHH:mm:ss.sssZ (UTC)
   */
  timestamp: string;

  /**
   * Token usage for this message exchange (optional)
   * Returned from AI provider for cost tracking
   */
  tokenUsage?: TokenUsage;
}
