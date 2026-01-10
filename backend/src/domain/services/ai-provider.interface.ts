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
 * AiResponse: Response from AI provider including text and usage metrics.
 * Allows tracking token consumption for cost monitoring.
 */
export interface AiResponse {
  /**
   * The AI-generated response text
   */
  text: string;

  /**
   * Token usage for this request (optional - not all providers support this)
   */
  usage?: TokenUsage;
}

/**
 * IAiProvider: Interface for AI provider implementations.
 * Allows swapping between different AI backends (Gemini, Ollama, Claude, etc.)
 * without changing service or use case logic.
 * 
 * @interface
 * @example
 * ```typescript
 * // Gemini implementation
 * const geminiProvider = new GeminiAiProvider(process.env.GOOGLE_AI_STUDIO_API_KEY);
 * 
 * // Later, swap to Ollama without changing code that uses this interface
 * const ollamaProvider = new OllamaAiProvider('http://localhost:11434');
 * ```
 */
export interface IAiProvider {
  /**
   * Generate a response from the AI provider.
   * Accepts a user message and system context, returns AI-generated response with token usage.
   * 
   * @param userMessage - The user's input message (e.g., "How do I prioritize my debts?")
   * @param systemContext - System prompt + user's budget context combined
   * @returns Promise<AiResponse> - The AI's text response with optional token usage
   * @throws Error if API call fails (to be caught and mapped by use case)
   * 
   * @example
   * ```typescript
   * const response = await provider.generateResponse(
   *   "Should I pay off my credit card first?",
   *   "System prompt... Your current debts: Credit card $5000..."
   * );
   * console.log(response.text); // AI response
   * console.log(response.usage?.totalTokens); // Token count if available
   * ```
   */
  generateResponse(userMessage: string, systemContext: string): Promise<AiResponse>;
}
