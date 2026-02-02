import type { Request, Response } from 'express';
import type { SendChatMessageUseCase } from '../../../application/use-cases/send-chat-message.use-case.js';
import type { PageContext } from '../../../application/dtos/chat.dto.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';
import { BaseController } from './base.controller.js';

/**
 * ChatController: Handles chat requests to Barefoot Advisor AI.
 * Thin controller delegating all business logic to SendChatMessageUseCase.
 * 
 * Request body is validated by middleware before reaching this controller.
 * Errors from use case are caught by global error handler.
 * 
 * @extends BaseController
 * @example
 * ```typescript
 * const controller = new ChatController(sendChatMessageUseCase);
 * router.post('/message',
 *   validationMiddleware(sendChatMessageSchema),
 *   asyncHandler((req, res) => controller.sendMessage(req, res))
 * );
 * ```
 */
export class ChatController extends BaseController {
  constructor(private sendChatMessageUseCase: SendChatMessageUseCase) {
    super();
  }

  /**
   * POST /chat/message
   * Send a message to the Barefoot Advisor and receive AI response.
   * 
   * Request body (validated):
   * {
   *   message: string (1-500 chars)
   * }
   * 
   * Response (ApiResponse envelope):
   * {
   *   success: true,
   *   data: {
   *     response: string,
   *     messageId: string (UUID),
   *     timestamp: string (ISO 8601)
   *   }
   * }
   * 
   * @param req - Express request with validated message in body
   * @param res - Express response
   * @throws DomainError (caught by error middleware) if profile not found or AI fails
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.id;
    // Request body already validated by middleware
    const { message, conversationHistory, pageContext } = req.body as {
      message: string;
      conversationHistory?: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }>;
      pageContext?: PageContext;
    };

    // Build request payload respecting exactOptionalPropertyTypes
    const payload: {
      userId: string;
      message: string;
      conversationHistory?: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }>;
      pageContext?: PageContext;
    } = { userId, message };

    if (conversationHistory) {
      payload.conversationHistory = conversationHistory;
    }
    if (pageContext) {
      payload.pageContext = pageContext;
    }

    // Execute use case with optional context
    const result = await this.sendChatMessageUseCase.execute(payload);

    // Send success response
    this.sendSuccess(res, result);
  }
}
