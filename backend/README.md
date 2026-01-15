# Bucketwise Planner Backend

A **Domain-Driven Design** backend implementing the Barefoot Investor bucket-based budgeting methodology. Clean separation of concerns, swappable persistence layers, and optional AI integration.

**Attribution:** Implements Scott Pape's *Barefoot Investor* methodology ([www.barefootinvestor.com](https://www.barefootinvestor.com/))

## Authentication & Multi-User

This backend supports **multi-user JWT-based authentication**:
- User signup/login endpoints
- JWT token generation and validation
- Refresh token support
- Password hashing via bcryptjs
- Each self-hosted instance has its own user database

No centralized authentication — each deployment is independent.

## Optional AI Advisor

The AI chat feature is **optional and disabled by default**:
- Requires Google AI Studio API key (free tier available)
- Disabled if `GEMINI_API_KEY` is not set
- Can be toggled via `AI_ENABLED` environment variable
- No third-party dependency required for core functionality

**Get API key:** [https://aistudio.google.com/](https://aistudio.google.com/)

## Architecture

```
src/
├── domain/               # Pure business logic (no framework deps)
│   ├── model/           # Entities & value objects (Money, Debt, Fortnight, etc.)
│   ├── repositories/    # Interfaces (implementations in infrastructure/)
│   ├── exceptions/      # Domain errors (ValidationError, DomainError)
│   ├── services/        # Business logic (debt calc, payoff projections)
│   └── value-objects/   # Money (cents), bucket types, etc.
├── application/         # Use cases & DTOs (orchestration layer)
│   ├── use-cases/       # IUseCase implementations
│   ├── dtos/            # Request/response schemas (Zod validated)
│   └── errors/          # Application-level error mapping
├── infrastructure/      # External concerns
│   ├── persistence/     # PostgreSQL repositories
│   ├── database/        # Connection, migrations
│   ├── auth/            # JWT, bcryptjs integration
│   └── ai/              # Google Gemini integration (optional)
└── presentation/        # HTTP layer
    └── http/            # Express routes, controllers, middleware
```

## Local Development Setup

### Requirements
- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+

### Install Dependencies
```bash
pnpm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env with:
# - PG_CONNECTION_STRING (required)
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - ADMIN_SECRET (generate with: openssl rand -base64 32)
# - GEMINI_API_KEY (optional, for AI chat)
# - AI_ENABLED (optional, default false)
```

### Database Setup

Create PostgreSQL database and user:

```bash
createdb budgetwise
psql budgetwise -c "CREATE USER budgetwise WITH PASSWORD 'your-password';"
psql budgetwise -c "GRANT ALL PRIVILEGES ON DATABASE budgetwise TO budgetwise;"
```

Then update `.env` with connection string:
```
PG_CONNECTION_STRING=postgresql://budgetwise:your-password@localhost:5432/budgetwise
```

### Build & Run
```bash
```bash
pnpm build              # Compile TypeScript
pnpm dev                # Start dev server (http://localhost:3000)
pnpm exec tsc --noEmit  # Type check
```

## AI Advisor (Optional)

The AI financial advisor is powered by Google Gemini 2.5 Flash. To enable:

1. Get free API key from [https://aistudio.google.com/](https://aistudio.google.com/)
2. Set `GEMINI_API_KEY` in `.env`
3. Set `AI_ENABLED=true`
4. Restart server

If `AI_ENABLED=false` or `GEMINI_API_KEY` is empty, chat routes are disabled and the app starts normally. No errors will occur.

**Privacy:** Messages are sent to Google Gemini API (third-party). No permanent chat history stored.

See [docs/AI_ADVISOR.md](../docs/AI_ADVISOR.md) for full details.

## Testing

```bash
pnpm test              # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
```

- **54+ passing tests** covering domain logic, use cases, and repositories
- **Vitest** framework for fast, deterministic testing
- **Coverage:** >80% for critical paths

## Key Design Principles

- **DDD (Domain-Driven Design)**: Domain logic is isolated and framework-agnostic
- **Repository Pattern**: Swap `MemoryTransactionRepository` for Postgres/SQLite without changing domain code
- **Timezone-Aware Date Handling** (v0.2.0+): Fortnight boundaries evaluated in user's local timezone via `TimezoneService`, preventing UTC/local calendar day mismatches
- **SOLID Principles**:
  - **S**ingle Responsibility: Each class has one reason to change
  - **O**pen/Closed: Open for extension (new repo implementations), closed for modification
  - **L**iskov Substitution: All repository implementations are interchangeable
  - **I**nterface Segregation: Lean, focused interfaces
  - **D**ependency Inversion: Domain depends on abstractions, not concrete implementations

## Domain Models

### Bucket Types
- **Daily Expenses** (60% of income) — Bills, groceries, essentials
- **Splurge** (10%) — Guilt-free discretionary spending
- **Smile** (10%) — Long-term goals and dreams
- **Fire Extinguisher** (20%) — Debt payoff → Emergency fund → Wealth
- **Mojo** (optional) — Additional savings bucket

Percentages are configurable per user profile.

### Key Entities
- `Transaction`: Record of income/expense
- `Allocation`: Budget allocation percentages for a fortnight
- `FortnightSnapshot`: Period summary with allocations & transactions
- `Money`: Value object for currency (cents-based, no float issues)

## Use Cases (Application Layer)

### RecordTransactionUseCase
```typescript
await recordTxUseCase.execute({
  bucket: 'Daily Expenses',
  kind: 'expense',
  description: 'Groceries',
  amountCents: 5000,
  occurredAt: new Date(),
  tags: ['food'],
});
```

### CreateFortnightUseCase
```typescript
await createFortnightUseCase.execute({
  periodStart: new Date('2026-01-01'),
  periodEnd: new Date('2026-01-14'),
  allocations: [
    { bucket: 'Daily Expenses', percent: 0.6 },
    { bucket: 'Fire Extinguisher', percent: 0.2 },
    { bucket: 'Splurge', percent: 0.1 },
    { bucket: 'Smile', percent: 0.1 },
  ],
});
```

## Domain Services

### DebtPayoffCalculator
Calculate months to debt freedom using snowball or avalanche methods.

### SavingsProjector
Project savings accumulation and analyze spending trends by bucket.

## Persistence Layer

### Currently Supported
- **Memory** (default for local dev) - all data in-memory, lost on restart

### Future Implementations
- PostgreSQL
- SQLite
- File-based (JSON)

### Switching Persistence Backends
All repository implementations follow the same interface. To switch from memory to Postgres:

```typescript
// Before
import { MemoryTransactionRepository } from './infrastructure/persistence/memory/...';
const txRepo = new MemoryTransactionRepository();

// After
import { PostgresTransactionRepository } from './infrastructure/persistence/postgres/...';
const txRepo = new PostgresTransactionRepository(pgConnection);
```

No changes needed in application layer or domain logic.

## Testing Strategy

- **Unit Tests** (`tests/unit/`) - Test isolated domain/application logic
- **Integration Tests** (`tests/integration/`) - Test repositories & use cases together
- **E2E Tests** (`tests/e2e/`) - Test complete workflows

```bash
# Example: run all tests
pnpm test
```

## Next Steps

1. **Implement HTTP API** (Express/Fastify) - wire controllers to routes
2. **Add Tests** - start with use-case tests
3. **CLI Tool** - add commands for quick testing
4. **Real Persistence** - implement Postgres/SQLite repository
5. **Frontend** - React SPA or other UI consuming the API

## File Structure Guidelines

- **kebab-case** for files & folders: `fortnight-snapshot.entity.ts`, `domain/repositories/`
- **PascalCase** for classes: `FortnightSnapshot`, `BaseEntity`
- **camelCase** for methods/properties: `totalIncome()`, `bucketSpend()`
- Use `.entity.ts`, `.value-object.ts`, `.repository.interface.ts` suffixes for clarity

## Exports

All public APIs are exported from `src/index.ts` for easy importing:

```typescript
import {
  FortnightSnapshot,
  RecordTransactionUseCase,
  MemoryTransactionRepository,
} from './index.js';
```

---

Happy budgeting! 💰
