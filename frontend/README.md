# Bucketwise Planner - Frontend

React + TypeScript + Vite frontend for multi-user Barefoot Investor budget management.

**Attribution:** Implements Scott Pape's *Barefoot Investor* methodology ([www.barefootinvestor.com](https://www.barefootinvestor.com/))

## Features

### Core Views
- **Dashboard**: Financial snapshot, current fortnight overview, debt summary, payoff timeline
- **Transactions**: Record income/expenses/debt payments with bucket assignment, filtering
- **Debts**: Debt management with snowball prioritization and automated payoff calculator
- **Fortnights**: Budget period management with bucket breakdowns and tracking
- **Profile**: Income configuration, bucket percentages, fixed expenses

### Authentication
- **Signup/Login**: JWT-based multi-user authentication
- **Secure Sessions**: Refresh token support, local session storage
- **User Profile**: Personal budget configuration per user

### Optional AI Chat (Disabled by Default)
- **Context-Aware Responses**: AI includes relevant budget data based on current page
- **Privacy-Focused**: No permanent chat history stored (ephemeral context)
- **Smart Initialization**: Detects if AI is disabled and shows friendly message
- **Requires API Key**: Optional Google AI Studio key to enable
- **Page Context**: Tailors advice based on current page (Dashboard, Transactions, Debts, etc.)

See [docs/AI_ADVISOR.md](../docs/AI_ADVISOR.md) for setup and usage.

### UX Features
- **Dark Theme**: Custom Mantine theme (navy/slate + teal/amber accents)
- **Help System**: Searchable, contextual help with keyboard shortcuts (`⌘/`)
- **Tooltips**: Helpful hints on complex controls
- **Loading/Error/Empty States**: Consistent patterns across all views
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Keyboard Shortcuts**: `⌘/` (Cmd+/) or `Ctrl+/` for help

### Technical Features
- **Full TypeScript**: Strict mode, type-safe throughout
- **React Hooks**: Context providers, custom hooks for state management
- **Mantine Components**: Accessible, modern UI components
- **Date Safety**: Timezone normalization prevents date bugs
- **API Client**: Typed fetch wrapper with error handling

## Tech Stack

- **React 18**: UI framework
- **TypeScript**: Strict mode, full type safety
- **Vite 7**: Fast build tool and dev server
- **Mantine v8.3.10**: Component library with dark theme
- **Tabler Icons**: Icon set (@tabler/icons-react)
## AI Chat Widget

Optional feature that appears in top-right header (teal chat bubble). Requires backend to have `GEMINI_API_KEY` set.

**If disabled**, frontend shows a friendly message:
> "AI Chat is disabled. To enable, add `GEMINI_API_KEY` to backend .env and set `AI_ENABLED=true`. See README for instructions."

**Keyboard shortcut:** `⌘/` (Cmd+Slash on Mac) or `Ctrl+/` (Windows/Linux)

See [docs/AI_ADVISOR.md](../docs/AI_ADVISOR.md) for full setup and usage guide.

## Local Development

### Requirements
- Node.js 18+
- pnpm 8+
- Backend running on http://localhost:3000 (or update VITE_API_BASE)

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Default VITE_API_BASE=http://localhost:3000 (adjust if needed)

# Start dev server
pnpm dev
# Frontend on http://localhost:5173
```

### Build

```bash
pnpm build              # Create production build
pnpm preview            # Preview production build
pnpm exec tsc --noEmit  # Type check
```

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts          # Typed API client with fetch wrapper
│   │   └── types.ts           # API DTOs and response types
│   ├── components/
│   │   ├── ChatWidget.tsx      # AI chat drawer (optional, context-aware)
│   │   ├── ChatProvider.tsx    # Chat state management
│   │   ├── HelpDrawer.tsx      # Searchable global help system
│   │   ├── ProtectedRoute.tsx  # JWT auth route protection
│   │   └── ...                 # Reusable UI components
│   ├── contexts/
│   │   ├── AuthProvider.tsx    # JWT auth state & login
│   │   └── PageContextProvider.tsx  # Page data for AI context
│   ├── hooks/
│   │   ├── useChat.ts          # Chat state + conversation history
│   │   └── usePageContext.ts   # Current page detection + data
│   ├── views/
│   │   ├── DashboardView.tsx   # Overview + debt summary + timeline
│   │   ├── TransactionsView.tsx # Record/view transactions
│   │   ├── DebtsView.tsx       # Manage debts + snowball
│   │   ├── FortnightView.tsx   # Bucket allocations + spending
│   │   └── ProfileView.tsx     # User settings + configuration
│   ├── constants/
│   │   └── helpContent.ts      # Searchable help documentation
│   ├── utils/
│   │   └── formatters.ts       # Date/currency/percent formatters
│   └── utils/
│       └── formatters.ts       # Date, currency, percent formatters
├── public/                     # Static assets
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Development

### Prerequisites
- Node.js 18+
- pnpm 8+

### Setup
```bash
cd frontend
pnpm install
```

### Run Development Server
```bash
pnpm dev
# Opens on http://localhost:5173
```

### Type Check
```bash
pnpm exec tsc --noEmit
```

### Build for Production
```bash
pnpm build
# Output in dist/
```

### Preview Production Build
```bash
pnpm preview
```

## Environment Variables

Create `.env` file:
```env
VITE_API_BASE=http://localhost:3000
```

## Key Patterns

### Date Handling
Always use `formatDateToISO()` from `utils/formatters.ts`:
```typescript
import { formatDateToISO } from '../utils/formatters';

// ✅ Correct
const startDate = formatDateToISO(fortnightStart);

// ❌ Wrong (timezone issues)
const startDate = new Date(fortnightStart).toISOString();
```

### Page Context Integration
Views populate PageContextProvider when data loads:
```typescript
import { usePageDataContext } from '../contexts/PageContextProvider';

const { setPageData } = usePageDataContext();

useEffect(() => {
  if (transactions) {
    setPageData({
      transactions: transactions.slice(0, 50), // Limit for token efficiency
      fortnightId,
    });
  }
}, [transactions, fortnightId, setPageData]);
```

### Chat Integration
ChatWidget automatically includes page context:
```typescript
const pageContext = usePageContext();
await sendMessage(messageText, pageContext);
// Backend receives: { message, conversationHistory?, pageContext? }
```

## Notifications and Modals

### Toast Notifications
Use utility functions from `utils/notifications.ts`:

```typescript
import { showSuccess, showError, showWarning, showInfo } from '../utils/notifications';

// Success notification
showSuccess('Transaction saved successfully');

// Error notification
showError('Failed to save transaction');

// Warning notification
showWarning('Budget limit approaching');

// Info notification
showInfo('Fortnight starting tomorrow');
```

### Confirmation Modals
Use pre-configured confirmation modals:

```typescript
import { confirmDelete, confirmAction } from '../utils/notifications';

// Delete confirmation (red button)
confirmDelete({
  title: 'Delete transaction',
  message: 'Are you sure? This cannot be undone.',
  onConfirm: async () => {
    await deleteTransaction(id);
    showSuccess('Transaction deleted');
  },
});

// Generic action confirmation
confirmAction({
  title: 'Clear history',
  message: 'Clear all messages?',
  confirmLabel: 'Clear',
  onConfirm: () => {
    clearHistory();
    showSuccess('History cleared');
  },
});
```

### Loading Notifications
For long-running operations:

```typescript
import { showLoading, updateNotification } from '../utils/notifications';

const id = showLoading('Processing transaction...');

try {
  await processTransaction();
  updateNotification(id, {
    message: 'Transaction processed successfully',
    color: 'green',
  });
} catch (error) {
  updateNotification(id, {
    message: 'Failed to process transaction',
    color: 'red',
  });
}
```

### Direct API Usage
For custom notifications, use the Mantine APIs directly:

```typescript
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';

// Custom notification
notifications.show({
  title: 'Custom Title',
  message: 'Custom message',
  color: 'teal',
  autoClose: 5000,
});

// Custom modal
modals.openConfirmModal({
  title: 'Custom Modal',
  children: <YourCustomComponent />,
  labels: { confirm: 'OK', cancel: 'Cancel' },
  onConfirm: () => console.log('Confirmed'),
});
```

## Chat Context Architecture

### Conversation History Flow
1. User sends message
2. useChat hook filters last 5 messages from state
3. Backend further filters to 10-minute window
4. Filtered history sent to AI with new message

### Page Context Flow
1. User navigates to page
2. App.tsx calls `setCurrentPage('transactions')`
3. View loads data, calls `setPageData({ transactions: [...] })`
4. usePageContext combines page + data
5. ChatWidget includes in API request

### Token Management
- Extracted from Gemini API's `usageMetadata`
- Accumulated across conversation
- Color-coded indicator:
  - **Green**: < 5,000 tokens (efficient)
  - **Yellow**: 5,000 - 10,000 tokens (moderate)
  - **Red**: > 10,000 tokens (consider clearing)
- Resets on history clear or page refresh

## Testing

See [TESTING_CHAT_CONTEXT.md](../docs/TESTING_CHAT_CONTEXT.md) for comprehensive testing guide.

### Quick Checks
```bash
# Type check
pnpm exec tsc --noEmit

# Verify no console errors in browser
# Test chat on all pages
# Verify page context badge updates
# Test conversation history (5 messages)
# Test token usage display
```

## Troubleshooting

### Dates Not Matching
- Ensure using `formatDateToISO()` everywhere
- Check API returns ISO strings (YYYY-MM-DD)
- Verify no timezone conversions

### Chat Context Not Sent
- Check PageContextProvider wraps App
- Verify view calls `setPageData()` when data loads
- Check network tab for `pageContext` in request body

### Token Counter Wrong
- Gemini API may not always return usage
- Counter resets on page refresh (intentional)
- Only accumulates when `response.tokenUsage` exists

### TypeScript Errors
- Run `pnpm exec tsc --noEmit` for detailed errors
- Check import paths use `.js` extension (ESM)
- Verify `verbatimModuleSyntax` compatibility

## Contributing

- Follow existing patterns (hooks, components, views)
- Use TypeScript strict mode (no `any`)
- Add tooltips for complex UI
- Update help content for new features
- Maintain date normalization

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
