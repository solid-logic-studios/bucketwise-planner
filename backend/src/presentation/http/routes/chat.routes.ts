import { Router } from 'express';
import { sendChatMessageSchema } from '../../../application/dtos/schemas/chat.schema.js';
import type { ChatController } from '../controllers/chat.controller.js';
import { validationMiddleware } from '../middlewares/validation.middleware.js';

/**
 * buildChatRouter: Create chat routes for Barefoot Advisor.
 * 
 * Routes:
 * - POST /message: Send message to AI advisor
 * 
 * @param controller - ChatController instance (injected with use case)
 * @returns Express Router configured with chat endpoints
 * 
 * @example
 * ```typescript
 * const chatRouter = buildChatRouter(chatController);
 * app.use('/chat', chatRouter);
 * // Endpoints available at: POST /chat/message
 * ```
 */
export function buildChatRouter(controller: ChatController): Router {
  const router = Router();

  /**
   * POST /message
   * Send a message to the Barefoot Advisor AI
   * 
   * Request body:
   * {
   *   message: string (1-500 chars)
   * }
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     response: string,
   *     messageId: string,
   *     timestamp: string
   *   }
   * }
   * 
   * Error responses:
   * - 400: Message validation failed (empty, too long)
   * - 500: AI provider error or profile not found
   */
  router.post(
    '/message',
    validationMiddleware(sendChatMessageSchema),
    controller.asyncHandler((req, res) => controller.sendMessage(req, res))
  );

  return router;
}
