import { z } from 'zod';

/**
 * chatMessageSchema: Validation for individual conversation message.
 * Used in conversation history array validation.
 */
const chatMessageSchema = z.object({
  id: z.string().uuid('Message ID must be a valid UUID'),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty'),
  timestamp: z.string().datetime({ message: 'Timestamp must be a valid ISO 8601 datetime' }),
});

/**
 * pageContextSchema: Validation for page context information.
 * Flexible validation since frontend data is already validated.
 */
const pageContextSchema = z.object({
  page: z.enum(['dashboard', 'transactions', 'debts', 'fortnight', 'profile', 'general']),
  fortnightId: z.string().uuid().optional(),
  debtId: z.string().uuid().optional(),
  // Simplified validation - actual DTOs already validated on frontend
  transactions: z.array(z.any()).optional(),
  specificDebt: z.any().optional(),
  fortnightSnapshot: z.any().optional(),
});

/**
 * sendChatMessageSchema: Validation schema for POST /chat/message requests.
 * Enforces message length constraints and format.
 * 
 * Constraints:
 * - Min 1 character (prevents empty queries)
 * - Max 500 characters (prevents token waste, keeps AI focused)
 * - Conversation history: max 10 messages (use case filters to 5 or 10-min window)
 * - Page context: optional, provides AI with user's current view
 * 
 * @example
 * ```typescript
 * const valid = sendChatMessageSchema.parse({
 *   message: "How do I prioritize my debts?",
 *   conversationHistory: [
 *     { id: "123", role: "user", content: "What are my debts?", timestamp: "2026-01-04T10:00:00Z" }
 *   ],
 *   pageContext: { page: "debts" }
 * });
 * 
 * // Throws ValidationError for:
 * // - empty string
 * // - message longer than 500 chars
 * // - more than 10 messages in history
 * // - invalid message format
 * ```
 */
export const sendChatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message must be 500 characters or less'),
  conversationHistory: z
    .array(chatMessageSchema)
    .max(10, 'Conversation history limited to 10 messages')
    .optional(),
  pageContext: pageContextSchema.optional(),
});
