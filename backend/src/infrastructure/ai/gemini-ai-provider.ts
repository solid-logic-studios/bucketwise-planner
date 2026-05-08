import { GoogleGenAI } from '@google/genai';
import type { AiResponse, IAiProvider, TokenUsage } from '../../domain/services/ai-provider.interface.js';
import { UserFacingError } from '../../shared/errors/user-facing-error.js';

type GeminiUsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

type GeminiGenerateContentResponse = {
  text?: string;
  usageMetadata?: GeminiUsageMetadata;
};

/**
 * GeminiAiProviderError: Domain error for Gemini API failures.
 * Thrown when the Google Gen AI API call fails.
 * 
 * @extends UserFacingError
 */
export class GeminiAiProviderError extends UserFacingError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      502,
      'AI_PROVIDER_ERROR',
      message,
      details,
    );
    Object.setPrototypeOf(this, GeminiAiProviderError.prototype);
  }
}

/**
 * GeminiAiProvider: Implements IAiProvider using Google Gen AI SDK.
 * Uses the gemini-2.5-flash model for speed and efficiency.
 * 
 * IMPORTANT: Accepts systemInstruction in constructor to enforce strict
 * behavioral guidelines (e.g., Barefoot Investor methodology). This is
 * passed to the Gemini model config, not concatenated to user prompts.
 * 
 * @implements {IAiProvider}
 * @example
 * ```typescript
 * const systemPrompt = BarefootAdvisorService.SYSTEM_PROMPT;
 * const provider = new GeminiAiProvider(process.env.GEMINI_API_KEY!, systemPrompt);
 * const response = await provider.generateResponse(
 *   "Should I buy a video game with Daily Expenses?",
 *   "User's income: $2000/fortnight, Debts: Credit card $5000..."
 * );
 * console.log(response); // AI will correct: "No, that's Splurge money!"
 * ```
 */
export class GeminiAiProvider implements IAiProvider {
  private readonly client: GoogleGenAI;
  static readonly DEFAULT_MODEL_NAME = 'gemini-2.5-flash';

  private readonly modelName: string;
  private readonly systemInstruction: string;

  /**
   * Create a new Gemini AI provider.
   * 
   * @param apiKey - Google AI Studio API key (GEMINI_API_KEY env var)
   * @param systemInstruction - System-level instruction for model behavior (e.g., Barefoot methodology)
   * @throws GeminiAiProviderError if apiKey is missing or invalid
   */
  constructor(apiKey: string, systemInstruction: string, modelName = GeminiAiProvider.DEFAULT_MODEL_NAME) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new GeminiAiProviderError('API key is required and must be a string');
    }

    if (!systemInstruction || typeof systemInstruction !== 'string') {
      throw new GeminiAiProviderError('System instruction is required and must be a string');
    }

    if (!modelName || typeof modelName !== 'string' || modelName.trim().length === 0) {
      throw new GeminiAiProviderError('Model name is required and must be a non-empty string');
    }

    this.client = new GoogleGenAI({ apiKey });
    this.systemInstruction = systemInstruction;
    this.modelName = modelName.trim();
  }

  /**
   * Generate a response using the Gemini model with strict system instructions.
   * 
   * The systemInstruction (e.g., Barefoot rules) is passed in the config object
   * to the Gemini API. This ensures the model strictly adheres to the behavioral
   * guidelines at the model level, not just in the prompt.
   * 
   * The systemContext parameter contains user-specific budget data (income, debts, allocations)
   * which is prepended to the user's message to provide financial context.
   * 
   * @param userMessage - The user's question or statement
   * @param systemContext - User budget context (income, debts, fortnight allocations)
   * @returns Promise<AiResponse> - The AI-generated response with token usage metadata
   * @throws GeminiAiProviderError if the API call fails
   */
  async generateResponse(userMessage: string, systemContext: string): Promise<AiResponse> {
    try {
      // Combine user budget context with their message
      const fullPrompt = `${systemContext}\n\nUser: ${userMessage}`;

      // Use the models.generateContent API with properly structured contents.
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }],
          },
        ],
        config: {
          systemInstruction: this.systemInstruction,
        },
      });

      const { text, usageMetadata } = response as unknown as GeminiGenerateContentResponse;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new GeminiAiProviderError('Empty response from API');
      }

      // Extract token usage when available
      let usage: TokenUsage | undefined = undefined;
      if (usageMetadata) {
        usage = {
          promptTokens: usageMetadata.promptTokenCount || 0,
          completionTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
        };
      }

      return usage ? { text, usage } : { text };
    } catch (error) {
      // If already a GeminiAiProviderError, re-throw
      if (error instanceof GeminiAiProviderError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[AI] Gemini request failed for model "${this.modelName}"`, error);
      throw new GeminiAiProviderError(
        'AI advisor request failed. Please try again in a moment. If this keeps happening, check the backend logs or verify the Gemini model configuration.',
        {
          model: this.modelName,
          originalError: errorMessage,
        },
      );
    }
  }
}
