# Bucketwise Planner — Backend

A **Domain-Driven Design** backend implementing Scott Pape's Barefoot Investor bucket-based budgeting methodology. Clean layered architecture, multi-user JWT authentication, PostgreSQL persistence, and optional AI integration.

**Attribution:** Implements Scott Pape's _Barefoot Investor_ methodology ([www.barefootinvestor.com](https://www.barefootinvestor.com/))

## Authentication & Multi-User

This backend supports **multi-user JWT-based authentication**:

- User signup/login endpoints
- JWT access + refresh token flow
- Password hashing via bcryptjs
- Each self-hosted instance has its own isolated user database
- All data (profiles, fortnights, transactions, debts) is scoped to the authenticated user

No centralized authentication — each deployment is independent.

## Optional AI Advisor

The AI chat feature is **optional and disabled by default**:

- Requires Google AI Studio API key (free tier available)
- Routes only registered if `AI_ENABLED=true` and `GEMINI_API_KEY` is set
- Core budgeting features work fully without the AI key
- Frontend shows a friendly "AI disabled" message when not configured

**Get API key:** [https://aistudio.google.com/](https://aistudio.google.com/)

See [docs/AI_ADVISOR.md](../docs/AI_ADVISOR.md) for full setup details.

## Architecture

```
src/
├── domain/               # Pure business logic (no framework deps)
│   ├── model/           # Entities & value objects (Money, Debt, Fortnight, BudgetProfile, etc.)
│   ├── repositories/    # Interfaces (implementations in infrastructure/)
│   ├── exceptions/      # Domain errors (ValidationError, DomainError)
│   └── services/        # Business logic (DebtPayoffCalculator, TimezoneService)
├── application/         # Use cases & DTOs (orchestration layer)
│   ├── use-cases/       # IUseCase implementations
│   └── dtos/            # Request/response schemas (Zod validated)
├── infrastructure/      # External concerns
│   ├── persistence/
│   │   ├── postgres/    # PostgreSQL repository implementations
│   │   └── memory/      # In-memory implementations (used in tests, STORAGE_METHOD=memory)
│   ├── database/        # Connection pool, schema init, migration runner
│   ├── auth/            # JWT generation/validation, token blacklist
│   └── ai/              # Google Gemini integration (optional)
└── presentation/        # HTTP layer
    └── http/            # Express v5 routes, controllers, middleware
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

### Run Schema Initialization

```bash
cd backend && pnpm run db:ensure-schema
```

This creates all tables and applies any outstanding migrations automatically on startup.

#### Upgrading from <= 0.4.0 (timezone fortnight backfill)

```bash
psql "$PG_CONNECTION_STRING" < migrations/003-backfill-fortnight-timezone-bounds.sql
# or
pnpm db:backfill-fortnight-bounds
```

#### Upgrading from <= 0.4.3 (profile user_id primary key)

Migration `004-budget-profiles-user-id-primary-key.sql` runs automatically on startup. To run manually:

```bash
psql "$PG_CONNECTION_STRING" < migrations/004-budget-profiles-user-id-primary-key.sql
```

**Back up your database before upgrading.**

### Build & Run

```bash
pnpm dev                # Start dev server with tsx (http://localhost:3000)
pnpm build              # Compile TypeScript
pnpm exec tsc --noEmit  # Type check only
```

## Testing

```bash
pnpm test              # Run all tests (99 passing)
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

- **99+ passing tests** — domain logic, use cases, and repositories
- **Vitest** framework for fast, deterministic testing
- **Unit tests**: domain entities, value objects, use cases (with mock repositories)
- **Integration tests**: full API endpoints with test database
- **Coverage**: >80% for critical paths

## Key Design Principles

- **DDD (Domain-Driven Design)**: Domain logic is isolated and framework-agnostic
- **Repository Pattern**: Swap `MemoryTransactionRepository` for Postgres without changing domain code
- **Timezone-Aware Date Handling** (v0.2.0+): Fortnight boundaries evaluated in user's local timezone via `TimezoneService`
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
- **Fire Extinguisher** (20%) — Debt payoff → Emergency fund → Wealth building
- **Mojo** / **Grow** — Optional additional savings buckets

Percentages are configurable per user profile.

### Key Entities

- `Money`: Value object for currency (integer cents — no float issues)
- `BudgetProfile`: User income, Fire Extinguisher %, fixed expenses, timezone
- `FortnightSnapshot`: Budget period with allocations and transaction summaries
- `Debt`: Balance, minimum payment, interest rate, snowball priority
- `Transaction`: Record of income/expense/debt payment with bucket assignment

### Domain Services

- `DebtPayoffCalculator`: Snowball payoff timeline in fortnights
- `TimezoneService`: DST-aware UTC ↔ local calendar day conversions

## Persistence Layer

### Supported Backends

| Method         | Config                    | Notes                               |
| -------------- | ------------------------- | ----------------------------------- |
| **PostgreSQL** | `STORAGE_METHOD=postgres` | Recommended for production          |
| **Memory**     | `STORAGE_METHOD=memory`   | Data lost on restart; used in tests |

All repository implementations conform to the same domain interfaces. The application layer is unaware of which backend is in use.

## Migrations

Migrations are plain SQL files in `backend/migrations/`, applied alphabetically at startup via the migration runner. Applied migrations are tracked in the `schema_migrations` table.

| File                                          | Description                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| `001-add-timezone-support.sql`                | Adds `timezone` column to `budget_profiles`, UTC bound columns to `fortnight_snapshots` |
| `002-add-transfer-support.sql`                | Adds `source_bucket`/`destination_bucket` to transactions                               |
| `003-backfill-fortnight-timezone-bounds.sql`  | Backfills existing fortnights with timezone-aware UTC bounds                            |
| `004-budget-profiles-user-id-primary-key.sql` | Promotes `user_id` to primary key in `budget_profiles`, drops legacy `id` column        |

## File Naming Conventions

- **kebab-case** for files and folders: `fortnight-snapshot.entity.ts`, `domain/repositories/`
- **PascalCase** for classes: `FortnightSnapshot`, `BaseEntity`
- **camelCase** for methods/properties: `totalIncome()`, `bucketSpend()`
- Suffixes for clarity: `.entity.ts`, `.value-object.ts`, `.repository.interface.ts`, `.use-case.ts`

---

Happy budgeting!
