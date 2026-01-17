import type { HelpPageContent, HelpPageKey } from '../types/help.js';

export const helpContent: Record<HelpPageKey, HelpPageContent> = {
  transactions: {
    key: 'transactions',
    title: 'Transactions Help',
    description: 'Record spending, income, debt payments, and transfers between buckets for the selected fortnight.',
    sections: [
      {
        title: 'Snowball Payment',
        body: 'The priority debt being attacked this fortnight. Mark it recorded when you log the Fire Extinguisher payment for the active debt.',
      },
      {
        title: 'Minimum Payments',
        body: 'Required payments on other debts to keep accounts in good standing while the snowball targets the priority debt.',
      },
      {
        title: 'Quick Actions',
        body: 'Record All Debt Payments logs every planned debt payment for this fortnight. Record Income pre-fills your Profile income (or current total for this period). Add Expense opens the transaction form for any spending.',
      },
      {
        title: 'Add Transaction Form',
        body: 'Select a transaction type: Income (money in), Expense (money out), or Transfer (reallocate between buckets). For income/expense, choose a bucket. For transfers, select both source and destination buckets (must be different). Tags are optional labels for filtering (e.g., groceries, medical).',
      },
      {
        title: 'Transfers',
        body: 'A transfer moves money between buckets within the current fortnight without affecting income or expense totals. Use transfers to reallocate available funds—e.g., if you\'ve spent less in Splurge, move the surplus to Fire Extinguisher to accelerate debt payoff. Transfers show with both buckets in the transaction list (e.g., "Splurge → Fire Extinguisher").',
      },
      {
        title: 'Filters & Grouping',
        body: 'Use search and bucket filter to narrow results. Group by Date, Bucket, or Kind to view totals by category.',
      },
    ],
    quickLinks: [
      { label: 'Record debt payment', note: 'Use Snowball/Minimum sections or Add Transaction with debt toggle' },
      { label: 'Transfer between buckets', note: 'Add Transaction > Type: Transfer > Select source and destination buckets' },
      { label: 'View planned payments', note: 'Snowball and Minimum Payments in This Fortnight\'s Plan' },
      { label: 'Filter transactions', note: 'Search box and bucket dropdown in Actual Transactions' },
    ],
    tags: ['transactions', 'debt payments', 'income', 'expense', 'transfer', 'buckets', 'fire extinguisher'],
  },
  dashboard: {
    key: 'dashboard',
    title: 'Dashboard Help',
    description: 'Overview of the current fortnight, debts, and payoff projections.',
    sections: [
      {
        title: 'Payoff Timeline',
        body: 'Debt-free estimate based on live balances and your Fire Extinguisher. Uses fortnightly snowball calculations.',
      },
      {
        title: 'Income & Expenses',
        body: 'Aggregated from transactions in the selected fortnight (live data, not snapshots). Shows period totals.',
      },
      {
        title: 'Buckets Overview',
        body: 'Displays allocated vs spent per bucket for the current fortnight. Remaining amounts help guide spending pace.',
      },
      {
        title: 'Recurring Expenses',
        body: 'Top fixed expenses from your profile with their share of income. Use to verify critical bills are covered.',
      },
      {
        title: 'Fire Extinguisher',
        body: 'Shows the planned fire extinguisher amount for the current fortnight; drives the snowball payments.',
      },
    ],
    quickLinks: [
      { label: 'View bucket status', note: 'Check allocated vs spent for each bucket' },
      { label: 'Check payoff estimate', note: 'See debt-free timeline based on live balances' },
      { label: 'Review recurring expenses', note: 'Ensure top bills are covered this fortnight' },
    ],
    tags: ['dashboard', 'overview', 'fortnight', 'buckets', 'payoff'],
  },
  charts: {
    key: 'charts',
    title: 'Charts Help',
    description: 'Visualize debt payoff, tag-based spending habits, and trends across fortnights.',
    sections: [
      {
        title: 'Debt Payoff Timeline',
        body: 'Shows total debt remaining per fortnight based on your current Fire Extinguisher amount. Celebrate milestones as debts hit zero.'
      },
      {
        title: 'Top Spending Tags',
        body: 'Breaks down your highest expense tags over a selected period to spotlight habits and optimization opportunities.'
      },
      {
        title: 'Date Range Controls',
        body: 'Use the start/end date pickers to filter transaction-driven charts like tags analytics.'
      }
    ],
    quickLinks: [
      { label: 'Adjust Fire Extinguisher', note: 'Tune Profile to see payoff curve changes' },
      { label: 'Explore top tags', note: 'Set date range and inspect your highest expenses' },
    ],
    tags: ['charts', 'analytics', 'tags', 'debt payoff', 'fortnight', 'barefoot']
  },
  fortnight: {
    key: 'fortnight',
    title: 'Fortnight Help',
    description: 'Create and inspect individual fortnights with Barefoot allocations.',
    sections: [
      {
        title: 'Fortnight Selector',
        body: 'Choose an existing fortnight to load its allocations and summaries. Latest fortnight is auto-selected.',
      },
      {
        title: 'Create Fortnight',
        body: 'Use the form to define period start/end; preset Barefoot allocations are applied (60/10/10/20).',
      },
      {
        title: 'Allocations',
        body: 'Bucket allocations per fortnight determine budget targets for Transactions and Dashboard views.',
      },
      {
        title: 'Period Dates',
        body: 'Period start/end drive which transactions belong to the fortnight and how compliance is calculated.',
      },
      {
        title: 'Snapshots',
        body: 'Historical records of allocations/spend; use to compare performance across fortnights.',
      },
    ],
    quickLinks: [
      { label: 'Create a new fortnight', note: 'Set period dates and auto-apply Barefoot allocations' },
      { label: 'Review allocations', note: 'Confirm buckets sum to 100% for the period' },
    ],
    tags: ['fortnight', 'allocations', 'periods', 'snapshots'],
  },
  debts: {
    key: 'debts',
    title: 'Debts Help',
    description: 'Manage debts, priorities, and the snowball payoff plan.',
    sections: [
      {
        title: 'Snowball Priorities',
        body: 'Debts are ordered by priority; the top debt is attacked first. Adjust priority to change payoff order.',
      },
      {
        title: 'Minimum Payments',
        body: 'Set accurate minimums so the plan reserves funds for other debts while focusing on the priority debt.',
      },
      {
        title: 'Fire Extinguisher Input',
        body: 'Configure the Fire Extinguisher amount (fortnightly by default) to size the snowball payment.',
      },
      {
        title: 'Payment Frequency Conversion',
        body: 'Fortnight ≠ half a month. To preserve annual totals: monthly → fortnight = amount × (12/26); fortnight → monthly = amount × (26/12). This ensures minimums and FE amounts align with 12 months vs 26 fortnights per year.',
      },
      {
        title: 'Recording Payments',
        body: 'Use Record Payment to log a debt-payment transaction and update balances; adds debt-payment tags.',
      },
      {
        title: 'Plan Refresh',
        body: 'Plan updates automatically when amounts change; you can refresh manually after edits to see the latest timeline.',
      },
    ],
    quickLinks: [
      { label: 'Add a debt', note: 'Enter balances, rate, minimum, and priority' },
      { label: 'Record a payment', note: 'Log a debt-payment transaction to reduce balance' },
      { label: 'Understand frequency math', note: 'Monthly × 12/26; Fortnight × 26/12' },
      { label: 'Adjust priorities', note: 'Reorder debts to change snowball sequence' },
    ],
    tags: ['debts', 'snowball', 'payments', 'minimums', 'fire extinguisher'],
  },
  profile: {
    key: 'profile',
    title: 'Profile Help',
    description: 'Set your income, buckets, and Fire Extinguisher amount.',
    sections: [
      {
        title: 'Income',
        body: 'Fortnightly income drives the Fire Extinguisher calculation and budget allocations across the app.',
      },
      {
        title: 'Fire Extinguisher Percent',
        body: 'Percent of fortnightly income allocated to debt payoff; feeds the snowball payment size.',
      },
      {
        title: 'Fixed Expenses',
        body: 'Recurring bills with bucket assignments; used to flag recurring items in Transactions and Dashboard.',
      },
      {
        title: 'Buckets',
        body: 'Select Barefoot buckets for fixed expenses to keep reporting consistent across fortnights.',
      },
      {
        title: 'Saving Profile',
        body: 'Use Save Profile to persist changes; values propagate to payoff planning and dashboards.',
      },
    ],
    quickLinks: [
      { label: 'Update income', note: 'Keeps payoff and budget projections accurate' },
      { label: 'Tune fire extinguisher', note: 'Adjust percent to change snowball size' },
      { label: 'Add fixed expenses', note: 'Track recurring bills with bucket tags' },
    ],
    tags: ['profile', 'settings', 'income', 'fire extinguisher', 'fixed expenses'],
  },
  ownhome: {
    key: 'ownhome',
    title: 'Own Your Home Help',
    description: 'Visualize how Fire Extinguisher overpayments accelerate mortgage payoff after credit cards are eliminated.',
    sections: [
      {
        title: 'Baseline vs Fire Extinguisher',
        body: 'Baseline shows mortgage payoff with minimum-only payments. With Fire Extinguisher shows payoff when applying your FE amount after all credit cards are paid. The chart compares both timelines.',
      },
      {
        title: 'When does FE become available?',
        body: 'The simulator uses your current debt snowball plan to detect when all credit card debts are paid off. After that fortnight, Fire Extinguisher payments apply to the mortgage in addition to your minimum payment.',
      },
      {
        title: 'Time Saved & Interest Saved',
        body: 'Time Saved shows how many fortnights (or years) the FE overpayments shave off your mortgage term. Interest Saved shows the dollar amount you avoid paying in mortgage interest by paying off faster.',
      },
      {
        title: 'Assumptions',
        body: 'The simulator uses fortnightly compounding interest based on your mortgage rate. It assumes you consistently pay the minimum plus FE once available. Real outcomes may vary with rate changes or payment gaps.',
      },
      {
        title: 'Adjusting Fire Extinguisher',
        body: 'To see different scenarios, go to Profile and adjust your Fire Extinguisher percentage. Return here to see updated projections.',
      },
    ],
    quickLinks: [
      { label: 'Change FE amount', note: 'Go to Profile → Fire Extinguisher %' },
      { label: 'View credit card payoff', note: 'See Debts page for snowball timeline' },
      { label: 'Mortgage details', note: 'Debts page shows current mortgage balance and rate' },
    ],
    tags: ['mortgage', 'own your home', 'fire extinguisher', 'overpayment', 'interest', 'payoff', 'grow bucket'],
  },
  chat: {
    key: 'chat',
    title: 'Barefoot Advisor Chat',
    description: 'AI-powered advice using your live budget data and Barefoot Investor methodology.',
    sections: [
      {
        title: 'What is the Barefoot Advisor?',
        body: 'An AI chat assistant trained on the Barefoot Investor method. It analyzes your income, debts, fortnights, and bucket allocations to provide personalized financial advice.',
      },
      {
        title: 'What can I ask?',
        body: 'Ask about debt prioritization, the snowball method, bucket allocations, Fire Extinguisher sizing, upcoming payments, or general Barefoot methodology. Example: "How should I prioritize my credit card vs mortgage?"',
      },
      {
        title: 'Privacy & Data',
        body: 'Chat messages and your budget context (income, debts, fortnight status) are sent to the AI model. No data is stored permanently—each message is stateless. Your conversation history is kept locally in your browser session.',
      },
      {
        title: 'Clear History',
        body: 'Click the trash icon to clear all messages and start a fresh conversation. This only clears your local browser history—no server data is affected.',
      },
      {
        title: 'Opening the Chat',
        body: 'Click the chat bubble icon in the top-right header to open the drawer. The chat stays available across all pages.',
      },
    ],
    quickLinks: [
      { label: 'Example: Debt priority', note: 'Ask: "How should I prioritize my debts?"' },
      { label: 'Example: Fire Extinguisher', note: 'Ask: "What is the Fire Extinguisher bucket?"' },
      { label: 'Example: Snowball method', note: 'Ask: "Explain the debt snowball method"' },
    ],
    tags: ['chat', 'ai', 'advisor', 'barefoot', 'help', 'advice'],
  },
};

export const helpPageKeys = Object.keys(helpContent) as HelpPageKey[];
