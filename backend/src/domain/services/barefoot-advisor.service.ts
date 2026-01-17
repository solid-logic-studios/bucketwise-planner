import type { ChatMessage, PageContext } from '../../application/dtos/chat.dto.js';
import type { BudgetProfile } from '../model/budget-profile.entity.js';
import type { Debt } from '../model/debt.entity.js';
import type { FortnightSnapshot } from '../model/fortnight-snapshot.entity.js';
import { BaseDomainService } from './base.domain-service.js';

/**
 * BarefootAdvisorService: Domain service for Barefoot Investor financial advice.
 * Encapsulates the system prompt and user context building for the AI advisor.
 * Implements Barefoot Investor methodology by Scott Pape.
 * 
 * Key principles:
 * - Buckets: Daily Expenses (60%), Splurge (10%), Smile (10%), Fire Extinguisher (20%), Mojo (Safety), Grow (Wealth)
 * - Fire Extinguisher priority: Debts first, then Mojo (emergency fund), then Grow (wealth)
 * - Tone: Direct, practical, no-nonsense, encouraging small wins
 * 
 * @extends BaseDomainService
 * @example
 * ```typescript
 * const advisor = new BarefootAdvisorService();
 * const context = advisor.buildUserContext(profile, debts, fortnight);
 * const systemPrompt = advisor.getSystemPrompt();
 * const fullPrompt = `${systemPrompt}\n\n${context}`;
 * 
 * const response = await aiProvider.generateResponse(userMessage, fullPrompt);
 * ```
 */
export class BarefootAdvisorService extends BaseDomainService {
  /**
   * System prompt: Core Barefoot Investor guidance for the AI advisor.
   * Instructs the AI to provide advice grounded in Barefoot methodology.
   * This prompt is immutable and applies to all advisor interactions.
   * 
   * CRITICAL: This is passed to Gemini as systemInstruction to enforce strict adherence.
   * The model will act as a Barefoot Investor coach, correcting budget misallocations.
   * 
   * @static
   * @readonly
   */
  static readonly SYSTEM_PROMPT = `You are a financial assistant strictly adhering to Scott Pape's 'Barefoot Investor' methodology.

THE BUCKET RULES (percentage of fortnightly income):
You must enforce these income splits with Australian context:

1. Daily Expenses (60%): Essential survival costs ONLY
   - Rent or mortgage payments
   - Groceries and essential household items
   - Utilities (electricity, gas, water, internet)
   - Transport to work (fuel, public transport, car maintenance)
   - Essential insurance (health, car, home)
   - Medicine and healthcare
   
2. Splurge (10%): Short-term guilt-free spending
   - Eating out at restaurants or cafes
   - Entertainment (movies, concerts, streaming)
   - Hobbies and recreation
   - New clothes and accessories
   - Gifts for others
   - Video games, books, music
   - Hosting costs for personal projects
   
3. Smile (10%): Long-term savings goals
   - Holidays and travel
   - Weddings and major celebrations
   - Home renovations or improvements
   - New car or vehicle upgrade
   - Major purchases (furniture, appliances)
   
4. Fire Extinguisher (20%): The workhorse bucket - STRICT ORDER
   - Phase 1: Pay off all bad debt (credit cards, personal loans, car loans)
   - Phase 2: Build Mojo (Emergency fund: 3-6 months expenses)
   - Phase 3: Grow (Investing, superannuation, wealth building)

CORRECTION POLICY:
If a user categorizes a "Want" as "Daily Expenses," you MUST correct them:
- "A new video game is a Splurge expense, not Daily Expenses"
- "Hosting costs for a hobby project should come from your Splurge bucket"
- "Eating out is Splurge money, not Daily Expenses"
- "That new jacket is Splurge, unless your current clothes are unwearable"

Fire Extinguisher Priority Rule:
- Use debt snowball method: pay minimum on all debts except priority 1
- Priority 1 gets the full Fire Extinguisher amount
- Prioritize smallest debt first (psychological wins) OR highest interest rate
- Once ALL debts are paid, switch to building Mojo
- Once Mojo is 3-6 months expenses, switch to Grow

Tone:
- Professional but friendly with Australian context
- Encouraging but FIRM on the bucket rules
- Celebrate small wins and progress
- Reference the user's actual budget numbers
- No jargon - explain things clearly
- Correct misallocations kindly but directly

Conversation etiquette:
- Do not repeat greetings if there is existing conversation history.
- Greet with "G'day!" only on the first response of a new conversation.
- If the user asks a follow-up question, continue naturally without restating the entire summary unless asked.
- Prefer concise answers that build on prior context; reference previous messages when helpful.

Scope Constraints:
- Only provide advice related to Barefoot budgeting methodology
- For tax, legal, or specific investment questions, refer user to professionals
- Do not provide personalized investment product recommendations`;

  /**
   * Get the system prompt.
   * Returns the immutable Barefoot Advisor system prompt.
   * 
   * @returns {string} The system prompt text
   */
  getSystemPrompt(): string {
    return BarefootAdvisorService.SYSTEM_PROMPT;
  }

  /**
   * Build user context string from budget profile, debts, and fortnight snapshot.
   * This context is injected into the prompt to ground the AI's advice in the user's actual finances.
   * Formats data in a clear, readable way for the AI to reference.
   * 
   * @param profile - User's BudgetProfile (income, Fire Extinguisher %, fixed expenses)
   * @param debts - Array of all user debts with current balances and rates
   * @param fortnightSnapshot - Current fortnight's bucket allocations and snapshot
   * @returns {string} Formatted context string ready for prompt injection
   * 
   * @example
   * ```
   * "=== YOUR FINANCIAL CONTEXT ===
   * 
   * Fortnightly Income: $2,000 AUD
   * Fire Extinguisher Allocation: 20% = $400 per fortnight
   * 
   * Current Debts:
   * 1. Credit Card (Priority 1): $5,000 @ 18.5% p.a. | Minimum: $75/fortnight
   * 2. Car Loan (Priority 2): $15,000 @ 7% p.a. | Minimum: $150/fortnight
   * 
   * Current Fortnight Buckets:
   * - Daily Expenses: $1,200 allocated, $800 spent, $400 remaining
   * - Splurge: $200 allocated, $150 spent, $50 remaining
   * - Smile: $200 allocated, $0 spent, $200 remaining
   * - Fire Extinguisher: $400 allocated
   * 
   * Total Debt: $20,000
   * Snowball Strategy: Pay all debts minimums, put $400/fortnight at Priority 1 (Credit Card)"
   * ```
   */
  buildUserContext(
    profile: BudgetProfile,
    debts: Debt[],
    fortnightSnapshot: FortnightSnapshot | null
  ): string {
    const lines: string[] = [];

    lines.push('=== YOUR FINANCIAL CONTEXT ===');

    // Income and allocations
    const fortnightlyIncomeDollars = (profile.fortnightlyIncome.cents / 100).toFixed(2);
    lines.push(`Fortnightly Income: $${fortnightlyIncomeDollars} AUD`);

    const fireExtinguisherCents = Math.floor(
      (profile.fortnightlyIncome.cents * profile.defaultFireExtinguisherBps) / 10000
    );
    const fireExtinguisherDollars = (fireExtinguisherCents / 100).toFixed(2);
lines.push(`Fire Extinguisher Allocation: ${profile.defaultFireExtinguisherBps / 100}% = $${fireExtinguisherDollars} per fortnight`);

    // Debts
    if (debts.length === 0) {
      lines.push('Current Debts: None recorded yet. Great progress! Once you have debts, we will prioritize them using the snowball method.');
    } else {
      lines.push('Current Debts:');
      const sortedDebts = [...debts].sort((a, b) => a.priority - b.priority);
      for (const debt of sortedDebts) {
        const balanceDollars = (debt.currentBalance.cents / 100).toFixed(2);
        const interestPercent = (debt.interestRate * 100).toFixed(2);
        const minimumDollars = (debt.minimumPayment.cents / 100).toFixed(2);
        lines.push(
          `${debt.priority}. ${debt.name} (Priority ${debt.priority}): $${balanceDollars} @ ${interestPercent}% p.a. | Minimum: $${minimumDollars}/fortnight`
        );
      }
      lines.push('');

      // Snowball strategy summary
      const totalDebtCents = debts.reduce((sum, d) => sum + d.currentBalance.cents, 0);
      const totalDebtDollars = (totalDebtCents / 100).toFixed(2);
      const priority1Debt = debts.find(d => d.priority === 1);
      lines.push(`Total Debt: $${totalDebtDollars}`);
      if (priority1Debt) {
        const fireExtDollars = (fireExtinguisherCents / 100).toFixed(2);
        lines.push(`Snowball Strategy: Pay all debts minimums, put $${fireExtDollars}/fortnight at Priority 1 (${priority1Debt.name})`);
      }
    }

    // Fortnight snapshot (current bucket status)
    if (fortnightSnapshot) {
      lines.push('Current Fortnight Buckets:');
      for (const allocation of fortnightSnapshot.allocations) {
        const allocDollars = allocation.percentage * (profile.fortnightlyIncome.cents / 100);
        const spentCents = fortnightSnapshot.bucketSpend(allocation.bucket).cents;
        const spentDollars = (spentCents / 100).toFixed(2);
        const remainingCents = allocation.percentage * profile.fortnightlyIncome.cents - spentCents;
        const remainingDollars = (remainingCents / 100).toFixed(2);
        lines.push(
          `- ${allocation.bucket}: $${allocDollars.toFixed(2)} allocated, $${spentDollars} spent, $${remainingDollars} remaining`
        );
      }
    } else {
      lines.push('Current Fortnight: No fortnight created yet. Start by creating your first fortnight with bucket allocations.');
    }

    return lines.join('\n');
  }

  /**
   * Format conversation history for AI context.
   * Takes the last N messages and formats them in a readable way for the AI.
   * Includes timestamps and roles to maintain conversation flow.
   * 
   * @param history - Array of ChatMessage objects from previous exchanges
   * @returns {string} Formatted conversation history ready for prompt injection
   * 
   * @example
   * ```
   * "=== RECENT CONVERSATION ===
   * [2026-01-04 10:30] User: How do I prioritize debts?
   * [2026-01-04 10:30] Assistant: Use the snowball method...
   * [2026-01-04 10:32] User: What about credit cards?
   * [2026-01-04 10:32] Assistant: Credit cards are priority 1..."
   * ```
   */
  formatConversationHistory(history: ChatMessage[]): string {
    if (!history || history.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push('');
    lines.push('=== RECENT CONVERSATION ===');

    for (const message of history) {
      // Format timestamp as [YYYY-MM-DD HH:mm] in UTC
      const timestamp = new Date(message.timestamp);
      const formattedTime = `${timestamp.getUTCFullYear()}-${String(timestamp.getUTCMonth() + 1).padStart(2, '0')}-${String(timestamp.getUTCDate()).padStart(2, '0')} ${String(timestamp.getUTCHours()).padStart(2, '0')}:${String(timestamp.getUTCMinutes()).padStart(2, '0')}`;
      
      const role = message.role === 'user' ? 'User' : 'Assistant';
      lines.push(`[${formattedTime}] ${role}: ${message.content}`);
    }

    return lines.join('\n');
  }

  /**
   * Format page context for AI.
   * Shows what the user is currently viewing on their screen.
   * Allows AI to reference specific transactions, debts, or fortnights.
   * 
   * @param context - PageContext with page type and relevant data
   * @returns {string} Formatted page context ready for prompt injection
   * 
   * @example
   * ```
   * "=== CURRENT PAGE: TRANSACTIONS (Fortnight 2026-01-01 to 2026-01-14) ===
   * 2026-01-02 | Woolworths | -$85.40 | Daily Expenses
   * 2026-01-03 | Netflix | -$15.99 | Splurge
   * 2026-01-05 | Salary | +$2000.00 | Income
   * Total Transactions: 3 | Net: +$1898.61"
   * ```
   */
  formatPageContext(context: PageContext): string {
    if (!context || context.page === 'general') {
      return '';
    }

    const lines: string[] = [];
    lines.push('');

    switch (context.page) {
      case 'transactions': {
        if (context.transactions && context.transactions.length > 0) {
          // Get fortnight period from context if available
          const periodInfo = context.fortnightId ? ` (Fortnight ID: ${context.fortnightId})` : '';
          lines.push(`=== CURRENT PAGE: TRANSACTIONS${periodInfo} ===`);
          
          let totalCents = 0;
          // Limit to 50 most recent transactions to save tokens
          const displayTransactions = context.transactions.slice(0, 50);
          
          for (const tx of displayTransactions) {
            const amountDollars = (tx.amountCents / 100).toFixed(2);
            const sign = tx.kind === 'income' ? '+' : tx.kind === 'transfer' ? '→' : '-';
            const date = tx.occurredAt.split('T')[0]; // Extract YYYY-MM-DD
            const bucketInfo = tx.kind === 'transfer' 
              ? `${tx.sourceBucket} → ${tx.destinationBucket}`
              : tx.sourceBucket;
            lines.push(`${date} | ${tx.description} | ${sign}$${amountDollars} | ${bucketInfo}`);
            totalCents += tx.kind === 'income' ? tx.amountCents : -tx.amountCents;
          }
          
          const netDollars = (totalCents / 100).toFixed(2);
          const sign = totalCents >= 0 ? '+' : '';
          lines.push(`Total Transactions: ${displayTransactions.length} | Net: ${sign}$${netDollars}`);
          
          if (context.transactions.length > 50) {
            lines.push(`(Showing 50 most recent of ${context.transactions.length} total)`);
          }
        } else {
          lines.push('=== CURRENT PAGE: TRANSACTIONS ===');
          lines.push('No transactions recorded for this fortnight yet.');
        }
        break;
      }

      case 'debts': {
        if (context.specificDebt) {
          const debt = context.specificDebt;
          lines.push(`=== CURRENT PAGE: DEBT DETAILS (${debt.name}) ===`);
          const balanceDollars = (debt.currentBalanceCents / 100).toFixed(2);
          const interestPercent = (debt.annualInterestRatePercent).toFixed(2);
          const minimumDollars = (debt.minimumPaymentCents / 100).toFixed(2);
          lines.push(`Type: ${debt.debtType}`);
          lines.push(`Current Balance: $${balanceDollars}`);
          lines.push(`Interest Rate: ${interestPercent}% p.a.`);
          lines.push(`Minimum Payment: $${minimumDollars} per fortnight`);
          lines.push(`Priority: ${debt.priority} (1 = highest priority in snowball)`);
        } else {
          lines.push('=== CURRENT PAGE: DEBTS ===');
          lines.push('Viewing all debts list.');
        }
        break;
      }

      case 'fortnight': {
        if (context.fortnightSnapshot) {
          const fortnight = context.fortnightSnapshot;
          lines.push(`=== CURRENT PAGE: FORTNIGHT (${fortnight.periodStart} to ${fortnight.periodEnd}) ===`);
          const incomeDollars = (fortnight.totalIncomeCents / 100).toFixed(2);
          const expensesDollars = (fortnight.totalExpensesCents / 100).toFixed(2);
          lines.push(`Total Income: $${incomeDollars}`);
          lines.push(`Total Expenses: $${expensesDollars}`);
          lines.push('');
          lines.push('Bucket Breakdowns:');
          for (const bucket of fortnight.bucketBreakdowns) {
            const allocDollars = (bucket.allocatedCents / 100).toFixed(2);
            const spentDollars = (bucket.spentCents / 100).toFixed(2);
            const remainingDollars = (bucket.remainingCents / 100).toFixed(2);
            const percentUsed = bucket.allocatedCents > 0 
              ? ((bucket.spentCents / bucket.allocatedCents) * 100).toFixed(1)
              : '0.0';
            lines.push(`- ${bucket.bucket}: $${allocDollars} allocated, $${spentDollars} spent (${percentUsed}%), $${remainingDollars} remaining`);
          }
        } else {
          lines.push('=== CURRENT PAGE: FORTNIGHT ===');
          lines.push('Viewing fortnight summary.');
        }
        break;
      }

      case 'dashboard': {
        lines.push('=== CURRENT PAGE: DASHBOARD ===');
        lines.push('User is viewing their financial dashboard with overview of fortnights, debts, and progress.');
        break;
      }

      case 'profile': {
        lines.push('=== CURRENT PAGE: PROFILE ===');
        lines.push('User is viewing/editing their budget profile (income, Fire Extinguisher %, fixed expenses).');
        break;
      }
    }

    return lines.join('\n');
  }

  /**
   * Build full context combining all available information.
   * Orchestrates financial snapshot, page context, and conversation history.
   * Returns a comprehensive context string ready for AI consumption.
   * 
   * Context priority order:
   * 1. User financial snapshot (always present)
   * 2. Page context (what user is viewing)
   * 3. Conversation history (recent messages)
   * 
   * @param profile - User's budget profile
   * @param debts - Array of all user debts
   * @param fortnightSnapshot - Current fortnight snapshot
   * @param conversationHistory - Optional recent messages
   * @param pageContext - Optional current page context
   * @returns {string} Complete formatted context ready for AI prompt
   */
  buildFullContext(
    profile: BudgetProfile,
    debts: Debt[],
    fortnightSnapshot: FortnightSnapshot | null,
    conversationHistory?: ChatMessage[],
    pageContext?: PageContext
  ): string {
    const parts: string[] = [];

    // Always include base user financial context
    parts.push(this.buildUserContext(profile, debts, fortnightSnapshot));

    // Add page context if provided
    if (pageContext) {
      const pageContextStr = this.formatPageContext(pageContext);
      if (pageContextStr) {
        parts.push(pageContextStr);
      }
    }

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      const historyStr = this.formatConversationHistory(conversationHistory);
      if (historyStr) {
        parts.push(historyStr);
      }
    }

    return parts.join('\n');
  }
}
