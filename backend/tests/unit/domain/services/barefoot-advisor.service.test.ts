import { describe, expect, it } from 'vitest';
import type { ChatMessage, PageContext } from '../../../../src/application/dtos/chat.dto.js';
import { Allocation } from '../../../../src/domain/model/allocation.entity.js';
import { BudgetProfile } from '../../../../src/domain/model/budget-profile.entity.js';
import { Debt } from '../../../../src/domain/model/debt.entity.js';
import { FortnightSnapshot } from '../../../../src/domain/model/fortnight-snapshot.entity.js';
import { Money } from '../../../../src/domain/model/money.js';
import { BarefootAdvisorService } from '../../../../src/domain/services/barefoot-advisor.service.js';

describe('BarefootAdvisorService', () => {
  const service = new BarefootAdvisorService();

  describe('getSystemPrompt', () => {
    it('should return the static system prompt', () => {
      const prompt = service.getSystemPrompt();

      expect(prompt).toContain('Barefoot Investor');
      expect(prompt).toContain('Daily Expenses');
      expect(prompt).toContain('Fire Extinguisher');
      expect(prompt).toContain('snowball');
      expect(prompt.length).toBeGreaterThan(500);
    });

    it('should return the same prompt on multiple calls (immutable)', () => {
      const prompt1 = service.getSystemPrompt();
      const prompt2 = service.getSystemPrompt();

      expect(prompt1).toBe(prompt2);
    });

    it('should include constraints about scope', () => {
      const prompt = service.getSystemPrompt();

      expect(prompt).toContain('tax');
      expect(prompt).toContain('legal');
      expect(prompt).toContain('professionals');
    });
  });

  describe('buildUserContext', () => {
    it('should build context with income and Fire Extinguisher allocation', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000), // $2000 fortnightly
        2000, // 20% Fire Extinguisher
        []
      );
      const debts: Debt[] = [];
      const context = service.buildUserContext(profile, debts, null);

      expect(context).toContain('Fortnightly Income: $2000.00');
      expect(context).toContain('Fire Extinguisher');
      expect(context).toContain('20%');
      expect(context).toContain('$400.00');
    });

    it('should include message when no debts exist', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );
      const context = service.buildUserContext(profile, [], null);

      expect(context).toContain('None recorded yet');
    });

    it('should list all debts sorted by priority', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );

      const debt1 = new Debt(
        'debt-1',
        'Credit Card',
        'credit-card',
        new Money(500000), // original $5000
        new Money(500000), // current $5000
        0.185, // 18.5%
        new Money(7500), // $75
        'FORTNIGHTLY',
        1
      );

      const debt2 = new Debt(
        'debt-2',
        'Car Loan',
        'mortgage',
        new Money(1500000), // original $15000
        new Money(1500000), // current $15000
        0.07,
        new Money(15000), // $150
        'FORTNIGHTLY',
        5
      );

      const context = service.buildUserContext(profile, [debt2, debt1], null); // Pass unsorted

      expect(context).toContain('Credit Card');
      expect(context).toContain('Car Loan');
      expect(context).toContain('Priority 1');
      expect(context).toContain('Priority 5');
      expect(context).toContain('$5000.00');
      expect(context).toContain('$15000.00');
      expect(context).toContain('18.50%');
      expect(context).toContain('7.00%');

      // Verify priority 1 comes before priority 5
      const context1Index = context.indexOf('Priority 1');
      const context5Index = context.indexOf('Priority 5');
      expect(context1Index).toBeLessThan(context5Index);
    });

    it('should include snowball strategy when debts exist', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );

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

      const context = service.buildUserContext(profile, [debt1], null);

      expect(context).toContain('Snowball Strategy');
      expect(context).toContain('Priority 1');
      expect(context).toContain('$400.00');
    });

    it('should include fortnight bucket status when snapshot provided', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );

      const allocations = [
        new Allocation('alloc-1', 'Daily Expenses', 0.6),
        new Allocation('alloc-2', 'Splurge', 0.1),
        new Allocation('alloc-3', 'Smile', 0.1),
        new Allocation('alloc-4', 'Fire Extinguisher', 0.2),
      ];

      const snapshot = new FortnightSnapshot(
        'fortnight-1',
        new Date('2026-01-01'),
        new Date('2026-01-14'),
        allocations,
        []
      );

      const context = service.buildUserContext(profile, [], snapshot);

      expect(context).toContain('Current Fortnight Buckets');
      expect(context).toContain('Daily Expenses');
      expect(context).toContain('Splurge');
      expect(context).toContain('Smile');
      expect(context).toContain('Fire Extinguisher');
      expect(context).toContain('allocated');
      expect(context).toContain('spent');
      expect(context).toContain('remaining');
    });

    it('should calculate bucket amounts correctly', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000), // $2000
        2000,
        []
      );

      const allocations = [
        new Allocation('alloc-1', 'Daily Expenses', 0.6), // $1200
      ];

      const snapshot = new FortnightSnapshot(
        'fortnight-1',
        new Date('2026-01-01'),
        new Date('2026-01-14'),
        allocations,
        []
      );

      const context = service.buildUserContext(profile, [], snapshot);

      expect(context).toContain('Daily Expenses: $1200.00 allocated');
      expect(context).toContain('$0.00 spent');
      expect(context).toContain('$1200.00 remaining');
    });

    it('should format context readably', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );

      const context = service.buildUserContext(profile, [], null);

      expect(context).toContain('=== YOUR FINANCIAL CONTEXT ===');
      expect(context).toContain('AUD');
      expect(context).toBeTruthy();
    });
  });

  describe('formatConversationHistory', () => {
    it('should return empty string when no history provided', () => {
      const result = service.formatConversationHistory([]);
      expect(result).toBe('');
    });

    it('should format a single message correctly', () => {
      const history: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'How do I prioritize debts?',
          timestamp: '2026-01-04T10:30:00Z',
        },
      ];

      const result = service.formatConversationHistory(history);

      expect(result).toContain('=== RECENT CONVERSATION ===');
      expect(result).toContain('User: How do I prioritize debts?');
      expect(result).toContain('2026-01-04');
      expect(result).toContain('10:30');
    });

    it('should format multiple messages in order', () => {
      const history: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'What are my debts?',
          timestamp: '2026-01-04T10:00:00Z',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'You have two debts...',
          timestamp: '2026-01-04T10:00:05Z',
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'Which should I pay first?',
          timestamp: '2026-01-04T10:01:00Z',
        },
      ];

      const result = service.formatConversationHistory(history);

      expect(result).toContain('User: What are my debts?');
      expect(result).toContain('Assistant: You have two debts...');
      expect(result).toContain('User: Which should I pay first?');

      // Verify order
      const idx1 = result.indexOf('What are my debts?');
      const idx2 = result.indexOf('You have two debts...');
      const idx3 = result.indexOf('Which should I pay first?');
      expect(idx1).toBeLessThan(idx2);
      expect(idx2).toBeLessThan(idx3);
    });

    it('should handle undefined/null history gracefully', () => {
      const result1 = service.formatConversationHistory(undefined as any);
      const result2 = service.formatConversationHistory(null as any);

      expect(result1).toBe('');
      expect(result2).toBe('');
    });
  });

  describe('formatPageContext', () => {
    it('should return empty string for general page', () => {
      const context: PageContext = { page: 'general' };
      const result = service.formatPageContext(context);

      expect(result).toBe('');
    });

    it('should format transactions page with data', () => {
      const context: PageContext = {
        page: 'transactions',
        fortnightId: 'fortnight-1',
        transactions: [
          {
            id: 'tx-1',
            bucket: 'Daily Expenses',
            sourceBucket: 'Daily Expenses',
            destinationBucket: null,
            kind: 'expense',
            description: 'Woolworths',
            amountCents: 8540,
            occurredAt: '2026-01-02T00:00:00Z',
            tags: [],
          },
          {
            id: 'tx-2',
            bucket: 'income',
            sourceBucket: 'income',
            destinationBucket: null,
            kind: 'income',
            description: 'Salary',
            amountCents: 200000,
            occurredAt: '2026-01-05T00:00:00Z',
            tags: [],
          },
        ],
      };

      const result = service.formatPageContext(context);

      expect(result).toContain('=== CURRENT PAGE: TRANSACTIONS');
      expect(result).toContain('Woolworths');
      expect(result).toContain('-$85.40');
      expect(result).toContain('Salary');
      expect(result).toContain('+$2000.00');
      expect(result).toContain('Total Transactions: 2');
      expect(result).toContain('Net:');
    });

    it('should format debts page with specific debt', () => {
      const context: PageContext = {
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

      const result = service.formatPageContext(context);

      expect(result).toContain('=== CURRENT PAGE: DEBT DETAILS (Credit Card) ===');
      expect(result).toContain('Type: credit-card');
      expect(result).toContain('Current Balance: $5000.00');
      expect(result).toContain('Interest Rate: 18.50% p.a.');
      expect(result).toContain('Minimum Payment: $75.00');
      expect(result).toContain('Priority: 1');
    });

    it('should format fortnight page with snapshot', () => {
      const context: PageContext = {
        page: 'fortnight',
        fortnightSnapshot: {
          id: 'fortnight-1',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-14',
          totalIncomeCents: 200000,
          totalExpensesCents: 85000,
          bucketBreakdowns: [
            {
              bucket: 'Daily Expenses',
              allocatedPercent: 60,
              allocatedCents: 120000,
              spentCents: 85000,
              remainingCents: 35000,
            },
          ],
          fireExtinguisherAmountCents: 40000,
        },
      };

      const result = service.formatPageContext(context);

      expect(result).toContain('=== CURRENT PAGE: FORTNIGHT');
      expect(result).toContain('2026-01-01 to 2026-01-14');
      expect(result).toContain('Total Income: $2000.00');
      expect(result).toContain('Total Expenses: $850.00');
      expect(result).toContain('Daily Expenses');
      expect(result).toContain('$1200.00 allocated');
      expect(result).toContain('$850.00 spent');
      expect(result).toContain('70.8%'); // Percent used
    });

    it('should format dashboard page', () => {
      const context: PageContext = { page: 'dashboard' };
      const result = service.formatPageContext(context);

      expect(result).toContain('=== CURRENT PAGE: DASHBOARD ===');
      expect(result).toContain('financial dashboard');
    });

    it('should format profile page', () => {
      const context: PageContext = { page: 'profile' };
      const result = service.formatPageContext(context);

      expect(result).toContain('=== CURRENT PAGE: PROFILE ===');
      expect(result).toContain('budget profile');
    });

    it('should limit transactions to 50 when many present', () => {
      const manyTransactions = Array.from({ length: 100 }, (_, i) => ({
        id: `tx-${i}`,
        bucket: 'Splurge',
        sourceBucket: 'Splurge',
        destinationBucket: null,
        kind: 'expense' as const,
        description: `Transaction ${i}`,
        amountCents: 1000,
        occurredAt: `2026-01-${String(i % 28 + 1).padStart(2, '0')}T00:00:00Z`,
        tags: [],
      }));

      const context: PageContext = {
        page: 'transactions',
        transactions: manyTransactions,
      };

      const result = service.formatPageContext(context);

      expect(result).toContain('Showing 50 most recent of 100 total');
    });
  });

  describe('buildFullContext', () => {
    it('should combine all context sources in correct order', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );

      const history: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test question',
          timestamp: '2026-01-04T10:00:00Z',
        },
      ];

      const pageContext: PageContext = {
        page: 'dashboard',
      };

      const result = service.buildFullContext(profile, [], null, history, pageContext);

      expect(result).toContain('=== YOUR FINANCIAL CONTEXT ===');
      expect(result).toContain('=== CURRENT PAGE: DASHBOARD ===');
      expect(result).toContain('=== RECENT CONVERSATION ===');

      // Verify order: Financial → Page → History
      const financialIdx = result.indexOf('=== YOUR FINANCIAL CONTEXT ===');
      const pageIdx = result.indexOf('=== CURRENT PAGE: DASHBOARD ===');
      const historyIdx = result.indexOf('=== RECENT CONVERSATION ===');

      expect(financialIdx).toBeLessThan(pageIdx);
      expect(pageIdx).toBeLessThan(historyIdx);
    });

    it('should work with only financial context (no history or page)', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );

      const result = service.buildFullContext(profile, [], null);

      expect(result).toContain('=== YOUR FINANCIAL CONTEXT ===');
      expect(result).not.toContain('=== CURRENT PAGE:');
      expect(result).not.toContain('=== RECENT CONVERSATION ===');
    });

    it('should include page context but skip history if not provided', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );

      const pageContext: PageContext = {
        page: 'transactions',
        transactions: [],
      };

      const result = service.buildFullContext(profile, [], null, undefined, pageContext);

      expect(result).toContain('=== YOUR FINANCIAL CONTEXT ===');
      expect(result).toContain('=== CURRENT PAGE: TRANSACTIONS ===');
      expect(result).not.toContain('=== RECENT CONVERSATION ===');
    });

    it('should handle empty conversation history', () => {
      const profile = new BudgetProfile(
        'profile-1',
        new Money(200000),
        2000,
        []
      );

      const result = service.buildFullContext(profile, [], null, []);

      expect(result).toContain('=== YOUR FINANCIAL CONTEXT ===');
      expect(result).not.toContain('=== RECENT CONVERSATION ===');
    });
  });
});
