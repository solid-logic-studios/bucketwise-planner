import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage, PageContext } from '../../../../src/application/dtos/chat.dto.js';
import { SendChatMessageUseCase } from '../../../../src/application/use-cases/send-chat-message.use-case.js';
import { Allocation } from '../../../../src/domain/model/allocation.entity.js';
import { BudgetProfile } from '../../../../src/domain/model/budget-profile.entity.js';
import { Debt } from '../../../../src/domain/model/debt.entity.js';
import { FortnightSnapshot } from '../../../../src/domain/model/fortnight-snapshot.entity.js';
import { Money } from '../../../../src/domain/model/money.js';
import type { BudgetProfileRepository } from '../../../../src/domain/repositories/budget-profile.repository.interface.js';
import type { DebtRepository } from '../../../../src/domain/repositories/debt.repository.interface.js';
import type { FortnightSnapshotRepository } from '../../../../src/domain/repositories/fortnight-snapshot.repository.interface.js';
import type { AiResponse, IAiProvider } from '../../../../src/domain/services/ai-provider.interface.js';

describe('SendChatMessageUseCase', () => {
  // Mock repositories
  const mockProfileRepository = {
    getProfile: vi.fn(),
    saveProfile: vi.fn(),
  } as unknown as BudgetProfileRepository;

  const mockDebtRepository = {
    findByPriority: vi.fn(),
    findByType: vi.fn(),
    getById: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as DebtRepository;

  const mockFortnightRepository = {
    getAll: vi.fn(),
    findByPeriod: vi.fn(),
    getById: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as FortnightSnapshotRepository;

  // Mock AI provider
  const mockAiProvider: IAiProvider = {
    generateResponse: vi.fn().mockResolvedValue({ text: 'This is a helpful response from Barefoot Advisor.' } as AiResponse),
  };

  const userId = 'test-user-id';

  const useCase = new SendChatMessageUseCase(
    mockProfileRepository,
    mockDebtRepository,
    mockFortnightRepository,
    mockAiProvider
  );

  describe('execute', () => {
    // Reset mocks before each test
    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(mockAiProvider.generateResponse).mockResolvedValue({
        text: 'This is a helpful response from Barefoot Advisor.',
      } as AiResponse);
    });
    it('should throw error if profile not found', async () => {
      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({ userId, message: 'Help me!' })
      ).rejects.toThrow('User profile not found');
    });

    it('should generate response with user message', async () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      const response = await useCase.execute({
        userId,
        message: 'How do I prioritize debts?',
      });

      expect(response).toBeDefined();
      expect(response.response).toBe('This is a helpful response from Barefoot Advisor.');
      expect(response.messageId).toBeTruthy();
      expect(response.timestamp).toBeTruthy();
    });

    it('should return valid UUID for messageId', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      const response = await useCase.execute({ userId, message: 'Test' });

      // Check UUID v4 format (8-4-4-4-12 hex characters)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.messageId).toMatch(uuidRegex);
    });

    it('should return ISO 8601 timestamp', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      const response = await useCase.execute({ userId, message: 'Test' });

      // Check ISO 8601 format
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(response.timestamp).toMatch(isoRegex);
    });

    it('should call AI provider with system prompt and user context', async () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );

      const debt = new Debt(
        'debt-1',
        'Credit Card',
        'credit-card',
        new Money(500000),
        new Money(500000),
        0.185,
        new Money(7500),
        'FORTNIGHTLY',
        1
      );

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([debt]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      const userMessage = 'Should I focus on my credit card?';
      await useCase.execute({ userId, message: userMessage });

      // Verify AI provider was called
      expect(mockAiProvider.generateResponse).toHaveBeenCalled();

      const calls = vi.mocked(mockAiProvider.generateResponse).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const [message, context] = calls[0]!;

      // Verify message is passed through
      expect(message).toBe(userMessage);

      // Verify context includes user financial data (system prompt now passed separately via GeminiAiProvider constructor)
      expect(context).toContain('Fortnightly Income');
      expect(context).toContain('Credit Card');
    });

    it('should include current fortnight in context if exists', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);

      const allocations = [
        new Allocation('alloc-1', 'Daily Expenses', 0.6),
      ];

      const fortnight = new FortnightSnapshot(
        'fortnight-1',
        new Date('2026-01-01'),
        new Date('2026-01-14'),
        allocations,
        []
      );

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([fortnight]);

      await useCase.execute({ userId, message: 'Test' });

      const calls = vi.mocked(mockAiProvider.generateResponse).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const [, context] = calls[0]!;

      expect(context).toContain('Current Fortnight Buckets');
      expect(context).toContain('Daily Expenses');
    });

    it('should handle multiple debts', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);

      const debt1 = new Debt(
        'debt-1',
        'Credit Card',
        'credit-card',
        new Money(500000),
        new Money(500000),
        0.185,
        new Money(7500),
        'FORTNIGHTLY',
        1
      );

      const debt2 = new Debt(
        'debt-2',
        'Car Loan',
        'mortgage',
        new Money(1500000),
        new Money(1500000),
        0.07,
        new Money(15000),
        'FORTNIGHTLY',
        5
      );

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([debt1, debt2]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      await useCase.execute({ userId, message: 'Test' });

      const calls = vi.mocked(mockAiProvider.generateResponse).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const [, context] = calls[0]!;

      expect(context).toContain('Credit Card');
      expect(context).toContain('Car Loan');
      expect(context).toContain('Snowball Strategy');
    });

    it('should throw error if AI provider fails', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      const errorProvider: IAiProvider = {
        generateResponse: vi.fn().mockRejectedValueOnce(new Error('API Error')),
      };

      const useCaseWithError = new SendChatMessageUseCase(
        mockProfileRepository,
        mockDebtRepository,
        mockFortnightRepository,
        errorProvider
      );

      await expect(
        useCaseWithError.execute({ userId, message: 'Test' })
      ).rejects.toThrow();
    });

    it('should include conversation history in context', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);

      const history: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'What are my debts?',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'You have a credit card debt...',
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      await useCase.execute({
        userId,
        message: 'Should I pay it off?',
        conversationHistory: history,
      });

      const calls = vi.mocked(mockAiProvider.generateResponse).mock.calls;
      const [, context] = calls[0]!;

      expect(context).toContain('=== RECENT CONVERSATION ===');
      expect(context).toContain('What are my debts?');
      expect(context).toContain('You have a credit card debt...');
    });

    it('should filter conversation history to last 5 messages', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);

      // Create 10 messages
      const history: ChatMessage[] = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i}`,
        timestamp: new Date(Date.now() - (10 - i) * 1000).toISOString(), // Stagger timestamps
      }));

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      await useCase.execute({
        userId,
        message: 'Test',
        conversationHistory: history,
      });

      const calls = vi.mocked(mockAiProvider.generateResponse).mock.calls;
      const [, context] = calls[0]!;

      // Should contain last 5 messages (5-9)
      expect(context).toContain('Message 5');
      expect(context).toContain('Message 9');
      // Should NOT contain first messages (0-4)
      expect(context).not.toContain('Message 0');
      expect(context).not.toContain('Message 4');
    });

    it('should filter conversation history by 10-minute window', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);
      const now = Date.now();

      const history: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Old message',
          timestamp: new Date(now - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        },
        {
          id: 'msg-2',
          role: 'user',
          content: 'Recent message',
          timestamp: new Date(now - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        },
      ];

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      await useCase.execute({
        userId,
        message: 'Test',
        conversationHistory: history,
      });

      const calls = vi.mocked(mockAiProvider.generateResponse).mock.calls;
      const [, context] = calls[0]!;

      // Should contain recent message
      expect(context).toContain('Recent message');
      // Should NOT contain old message
      expect(context).not.toContain('Old message');
    });

    it('should include page context in full context', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);

      const pageContext: PageContext = {
        page: 'debts',
        specificDebt: {
          id: 'debt-1',
          name: 'Credit Card',
          debtType: 'credit-card',
          currentBalanceCents: 500000,
          minimumPaymentCents: 7500,
           minPaymentFrequency: 'FORTNIGHTLY',
          annualInterestRatePercent: 18.5,
          priority: 1,
        },
      };

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      await useCase.execute({
        userId,
        message: 'Should I increase payments?',
        pageContext,
      });

      const calls = vi.mocked(mockAiProvider.generateResponse).mock.calls;
      const [, context] = calls[0]!;

      expect(context).toContain('=== CURRENT PAGE: DEBT DETAILS (Credit Card) ===');
      expect(context).toContain('$5000.00');
      expect(context).toContain('18.50% p.a.');
    });

    it('should return token usage when provided by AI', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      // Mock AI provider with token usage
      vi.mocked(mockAiProvider.generateResponse).mockResolvedValueOnce({
        text: 'Response with token usage',
        usage: {
          promptTokens: 150,
          completionTokens: 50,
          totalTokens: 200,
        },
      });

      const response = await useCase.execute({ userId, message: 'Test' });

      expect(response.tokenUsage).toBeDefined();
      expect(response.tokenUsage?.promptTokens).toBe(150);
      expect(response.tokenUsage?.completionTokens).toBe(50);
      expect(response.tokenUsage?.totalTokens).toBe(200);
    });

    it('should not include token usage if AI provider does not provide it', async () => {
      const profile = new BudgetProfile('profile-1', new Money(200000), 2000, []);

      vi.mocked(mockProfileRepository.getProfile).mockResolvedValueOnce(profile);
      vi.mocked(mockDebtRepository.findByPriority).mockResolvedValueOnce([]);
      vi.mocked(mockFortnightRepository.getAll).mockResolvedValueOnce([]);

      // Mock AI provider without token usage
      vi.mocked(mockAiProvider.generateResponse).mockResolvedValueOnce({
        text: 'Response without token usage',
      });

      const response = await useCase.execute({ userId, message: 'Test' });

      expect(response.tokenUsage).toBeUndefined();
    });
  });
});
