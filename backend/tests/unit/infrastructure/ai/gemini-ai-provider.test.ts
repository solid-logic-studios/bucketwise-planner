import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GeminiAiProvider,
  GeminiAiProviderError,
} from '../../../../src/infrastructure/ai/gemini-ai-provider.js';

describe('GeminiAiProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the configured model name when generating content', async () => {
    const provider = new GeminiAiProvider('test-key', 'System instruction', 'gemini-flash-latest');
    const generateContent = vi.fn().mockResolvedValue({
      text: 'Helpful answer',
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 30,
      },
    });

    (provider as unknown as { client: { models: { generateContent: typeof generateContent } } }).client = {
      models: { generateContent },
    };

    const response = await provider.generateResponse('How do I budget?', 'User context');

    expect(generateContent).toHaveBeenCalledWith({
      model: 'gemini-flash-latest',
      contents: [
        {
          role: 'user',
          parts: [{ text: 'User context\n\nUser: How do I budget?' }],
        },
      ],
      config: {
        systemInstruction: 'System instruction',
      },
    });
    expect(response).toEqual({
      text: 'Helpful answer',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    });
  });

  it('throws a provider error when Gemini returns no text', async () => {
    const provider = new GeminiAiProvider('test-key', 'System instruction');
    const generateContent = vi.fn().mockResolvedValue({ text: '   ' });

    (provider as unknown as { client: { models: { generateContent: typeof generateContent } } }).client = {
      models: { generateContent },
    };

    await expect(provider.generateResponse('Hello', 'User context')).rejects.toThrow(
      GeminiAiProviderError,
    );
    await expect(provider.generateResponse('Hello', 'User context')).rejects.toThrow(
      'Empty response from API',
    );
  });

  it('logs and wraps provider failures with the active model name', async () => {
    const provider = new GeminiAiProvider('test-key', 'System instruction', 'gemini-flash-latest');
    const generateContent = vi.fn().mockRejectedValue(new Error('Model not found'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    (provider as unknown as { client: { models: { generateContent: typeof generateContent } } }).client = {
      models: { generateContent },
    };

    await expect(provider.generateResponse('Hello', 'User context')).rejects.toMatchObject({
      message:
        'AI advisor request failed. Please try again in a moment. If this keeps happening, check the backend logs or verify the Gemini model configuration.',
      code: 'AI_PROVIDER_ERROR',
      statusCode: 502,
      details: {
        model: 'gemini-flash-latest',
        originalError: 'Model not found',
      },
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[AI] Gemini request failed for model "gemini-flash-latest"',
      expect.any(Error),
    );
  });
});