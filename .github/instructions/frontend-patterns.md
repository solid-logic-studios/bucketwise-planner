# Frontend Patterns & Best Practices

## Component Structure

### View Components (Pages)
```typescript
// views/DebtsView.tsx
import { useEffect, useState } from 'react';
import { Container, Title, Group, ActionIcon, Tooltip } from '@mantine/core';
import { useHelp } from '../components/HelpDrawer';
import { useHotkeys } from '@mantine/hooks';
import { IconQuestionMark } from '@tabler/icons-react';
import { apiClient } from '../api/client';
import type { DebtDTO } from '../api/types';

export function DebtsView() {
  const [debts, setDebts] = useState<DebtDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { openHelp } = useHelp();
  useHotkeys([['mod+/', () => openHelp('debts')]]);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<DebtDTO[]>('/debts');
      setDebts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load debts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={loadDebts} />;

  return (
    <Container size="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Debts</Title>
        <Tooltip label="Help (⌘/)">
          <ActionIcon onClick={() => openHelp('debts')} variant="subtle">
            <IconQuestionMark size={20} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* View content */}
    </Container>
  );
}
```

**Pattern Rules:**
- Loading/error/empty states always present
- Help trigger: "?" button + `mod+/` hotkey
- Consistent header with title and help button
- Error handling with retry capability
- Type-safe API calls with TypeScript

### Reusable Components
```typescript
// components/FortnightSelector.tsx
interface FortnightSelectorProps {
  selectedId: string | null;
  onFortnightChange: (fortnight: { id: string; startDate: string; endDate: string }) => void;
}

export function FortnightSelector({ selectedId, onFortnightChange }: FortnightSelectorProps) {
  // Component implementation
}
```

**Rules:**
- Define explicit prop interfaces
- Keep components focused (single responsibility)
- Export from `components/index.ts` for clean imports
- Use Mantine components for consistency

## Date Handling (Critical)

### Always Use formatDateToISO
```typescript
// utils/formatters.ts
export function formatDateToISO(value: string | Date): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

**Usage:**
```typescript
// ✅ GOOD - normalize dates before API calls
const handleFortnightChange = (fortnight: any) => {
  setFortnightStartDate(formatDateToISO(fortnight.startDate));
  setFortnightEndDate(formatDateToISO(fortnight.endDate));
};

// ✅ GOOD - normalize dates before comparisons
const matchingPayment = timeline.find(
  item => formatDateToISO(item.paymentDate) === formatDateToISO(fortnightStartDate)
);

// ❌ BAD - direct comparison without normalization
if (item.paymentDate === fortnightStartDate) { /* ... */ }
```

**Why:** Prevents timezone drift where "2025-12-31" becomes "2025-12-30T14:00:00.000Z", breaking exact date matching.

## API Client Pattern

### Typed API Wrapper
```typescript
// api/client.ts
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`http://localhost:3000${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success || !response.ok) {
    throw new Error(json.error?.message || 'Request failed');
  }

  return json.data!;
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  // ...
};
```

**Rules:**
- Unwrap `ApiResponse` envelope automatically
- Throw errors for failed responses
- Type-safe with generics
- Centralized error handling

### Type Definitions
```typescript
// api/types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface DebtDTO {
  id: string;
  name: string;
  balanceCents: number;
  minimumPaymentCents: number;
  annualInterestRatePercent: number;
  priority: number;
  debtType: string;
}
```

**Rules:**
- Match backend DTO structures
- Export from `api/types.ts`
- Use TypeScript for compile-time safety

## Help System Pattern

### Adding Help to a Page
```typescript
// 1. Import hooks and icons
import { useHelp } from '../components/HelpDrawer';
import { useHotkeys } from '@mantine/hooks';
import { IconQuestionMark } from '@tabler/icons-react';
import { Tooltip, ActionIcon } from '@mantine/core';

// 2. Add help hook and hotkey
const { openHelp } = useHelp();
useHotkeys([['mod+/', () => openHelp('pagename')]]);

// 3. Add help button to header
<Group justify="space-between" mb="lg">
  <Title order={1}>Page Title</Title>
  <Tooltip label="Help (⌘/)">
    <ActionIcon onClick={() => openHelp('pagename')} variant="subtle">
      <IconQuestionMark size={20} />
    </ActionIcon>
  </Tooltip>
</Group>
```

### Adding Help Content
```typescript
// constants/helpContent.ts
export const helpContent: Record<HelpPageKey, HelpPageContent> = {
  pagename: {
    key: 'pagename',
    title: 'Page Title Help',
    description: 'Overview of what this page does',
    sections: [
      {
        title: 'Feature Name',
        body: 'Detailed explanation of the feature...',
      },
      // More sections...
    ],
    quickLinks: [
      'Action name - why it matters',
      'Another action - what it does',
    ],
    tags: ['tag1', 'tag2', 'searchable', 'keywords'],
  },
};
```

**Rules:**
- 5 sections per page (comprehensive coverage)
- 2-3 quick links with explanations
- 4-5 searchable tags
- Explain what/why/how, not just what

## Tooltip Pattern

### Adding Tooltips to Complex Controls
```typescript
<Tooltip label="Clear explanation of what this does">
  <Button>Action</Button>
</Tooltip>

// For action icons
<Tooltip label="Helpful description (⌘ shortcut)">
  <ActionIcon onClick={handleAction}>
    <IconSomething size={20} />
  </ActionIcon>
</Tooltip>

// For form fields
<Tooltip label="What this field affects" multiline w={220}>
  <Select
    label="Field Label"
    data={options}
    {...form.getInputProps('field')}
  />
</Tooltip>
```

**Rules:**
- Add to buttons/icons that aren't self-explanatory
- Include keyboard shortcuts in help tooltips
- Use `multiline` and set width for longer descriptions
- Wrap the interactive element, not labels

## State Management

### Local State Pattern
```typescript
// Prefer local state for view-specific data
const [selectedFortnight, setSelectedFortnight] = useState<string | null>(null);
const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
const [filters, setFilters] = useState({ bucket: null, kind: null });
```

### Context for Global State
```typescript
// For cross-cutting concerns (like help system)
const HelpContext = createContext<HelpContextValue>({
  openHelp: () => {},
  closeHelp: () => {},
  isOpen: false,
  currentPage: null,
});

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<HelpPageKey | null>(null);

  // Implementation...

  return (
    <HelpContext.Provider value={{ /* ... */ }}>
      {children}
      <HelpDrawer />
    </HelpContext.Provider>
  );
}
```

**Rules:**
- Use local state by default
- Context for global features (help, theme, auth in future)
- Avoid prop drilling with context
- Keep context focused (single responsibility)

## Loading & Error States

### Standard Pattern
```typescript
if (loading) {
  return (
    <Center h={400}>
      <Loader size="lg" />
    </Center>
  );
}

if (error) {
  return (
    <Alert icon={<IconAlertCircle />} color="red" title="Error">
      {error}
      <Button onClick={retry} mt="sm">Retry</Button>
    </Alert>
  );
}

if (data.length === 0) {
  return (
    <EmptyState
      title="No items found"
      description="Get started by creating your first item."
      action={<Button onClick={onCreate}>Create Item</Button>}
    />
  );
}
```

**Rules:**
- Always handle loading/error/empty states
- Provide retry functionality for errors
- Use consistent components (LoadingSpinner, ErrorAlert, EmptyState)
- Clear, actionable messages

## Formatting Utilities

### Currency, Percents, Dates
```typescript
// utils/formatters.ts
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatPercent(decimal: number): string {
  return `${(decimal * 100).toFixed(2)}%`;
}

export function formatDateDisplay(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
```

**Usage:**
```typescript
<Text>{formatCurrency(balanceCents)}</Text>
<Text>{formatPercent(0.199)}</Text>
<Text>{formatDateDisplay('2025-12-31')}</Text>
```

## Common Anti-Patterns to Avoid

❌ **Don't compare dates without normalization**
```typescript
// BAD - timezone issues
if (date1 === date2) { /* ... */ }
```

✅ **Do normalize first**
```typescript
// GOOD
if (formatDateToISO(date1) === formatDateToISO(date2)) { /* ... */ }
```

❌ **Don't re-fetch data unnecessarily**
```typescript
// BAD - fetches on every render
useEffect(() => {
  fetch('/api/data');
});
```

✅ **Do control when to fetch**
```typescript
// GOOD - only on mount
useEffect(() => {
  loadData();
}, []);
```

❌ **Don't skip loading/error states**
```typescript
// BAD - no error handling
const data = await apiClient.get('/debts');
return <DebtList debts={data} />;
```

✅ **Do handle all states**
```typescript
// GOOD
if (loading) return <LoadingSpinner />;
if (error) return <ErrorAlert message={error} />;
return <DebtList debts={data} />;
```

❌ **Don't hardcode API URLs**
```typescript
// BAD
fetch('http://localhost:3000/debts');
```

✅ **Do use API client**
```typescript
// GOOD
apiClient.get<DebtDTO[]>('/debts');
```
