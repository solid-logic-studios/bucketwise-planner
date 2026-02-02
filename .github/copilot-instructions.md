# Copilot Instructions

## Project Overview

**Bucketwise Planner** is an open-source, community-driven personal budget management app implementing the **Barefoot Investor** method by Scott Pape (https://www.barefootinvestor.com/). Features fortnightly budgeting cycles, debt snowball payoff tracking, and bucket-based spending allocations.

**Attribution**: This project is inspired by Scott Pape's Barefoot Investor methodology. We are not affiliated with or endorsed by Scott Pape, but credit his work prominently in all documentation.

**Tech Stack:**
- Backend: Node.js 18+ + Express v5 + TypeScript (ESM), PostgreSQL 14+ via node-postgres
- Frontend: React 18 + Vite 7 + TypeScript + Mantine v8.3.10 + Tabler Icons
- Tests: Vitest for unit/integration tests
- Deployment: Docker + Docker Compose (multi-user per self-hosted instance)
- Optional: Google Gemini 2.5 Flash AI via @google/genai (disabled by default)
- Monorepo: pnpm workspaces (backend + frontend folders)

## Architecture

### Backend (Domain-Driven Design)

**Multi-User by Default**: Each self-hosted instance is multi-user with JWT authentication. No single-user limitation.

**Layers**:
- **Domain Layer**: Pure business logic (Money, Debt, Fortnight, Allocation) — framework-free, no dependencies on Express/Zod/database
- **Application Layer**: Use cases implementing workflows, Zod schemas for DTOs, error mapping, business workflow coordination
- **Infrastructure Layer**: PostgreSQL repositories, in-memory adapters for testing, database persistence implementations
- **Presentation Layer**: Express v5 HTTP controllers, middleware, route definitions, request validation
- **Authentication Layer**: JWT tokens (refresh + access), bcryptjs password hashing, session management

**Key Principles:**
- **Domain purity**: No Express, Zod, or database concerns in domain entities — just business rules and invariants
- **Thin controllers**: Controllers delegate to use cases, never contain business logic
- **Envelope pattern**: All HTTP responses use `ApiResponse<T>` wrapper via `ResponseFormatter`
- **Error mapping**: Throw domain errors (`ValidationError`, `DomainError`); map to HTTP via `ErrorMapper`
- **Validation**: Zod schemas in `application/dtos/schemas`, applied via middleware (never re-parsed in controllers)
- **Dependency injection**: Manual constructor injection, no global singletons or static state
- **Testing**: Vitest unit tests for domain/use cases, deterministic and fast, mock repositories for isolation
- **Optional AI**: AI routes only registered if `AI_ENABLED=true` and `GEMINI_API_KEY` is set; graceful no-op if disabled
- **OOP-first**: Prefer composition, inheritance, and abstraction to model behaviors; use base classes/interfaces for shared workflows

### Frontend (React + Mantine)
- **Views**: DashboardView, FortnightView, TransactionsView, DebtsView, ProfileView
- **Components**: Reusable UI components (FortnightSelector, HelpDrawer, Badges, EmptyState)
- **State**: API client with typed fetch wrapper, minimal local state
- **Theme**: Dark custom Mantine theme (navy/slate with teal/amber accents)
- **Help System**: Global HelpDrawer with context provider, keyboard shortcuts (⌘/), searchable content
- **UX Patterns**: Tooltips on complex controls, loading/error/empty states, consistent formatting
- **OOP where useful**: Extract shared UI behavior into helper classes/adapters, avoid repeated logic in views

## Coding Conventions

### TypeScript
- Strict mode: `verbatimModuleSyntax`, `exactOptionalPropertyTypes` on
- Use type-only imports for types: `import type { Express, Request } from 'express'`
- Prefer `interface` for public contracts, `type` for unions/intersections
- Keep files ASCII, avoid emoji/unicode in code

### Backend Patterns
- Controllers: thin, validation via middleware, delegate to use cases
- Use cases: implement IUseCase interface, accept single request object, return typed response
- Repositories: conform to interfaces, implementations swappable (Postgres/in-memory)
- Value objects: immutable (Money uses integer cents), guard invariants in constructors
- Routes: wire with `asyncHandler`, validate with Zod middleware first, centralized error handling
- Logging: use request logging middleware, avoid ad-hoc console logs in domain/application
- OOP helpers: prefer base use-case/repository abstractions or mappers to reduce repetition

### Frontend Patterns
- Date handling: use `formatDateToISO()` utility to normalize dates to YYYY-MM-DD (prevents timezone drift)
- API calls: unwrap `ApiResponse` envelope, handle errors via ErrorAlert component
- Forms: Mantine components, controlled inputs, validation feedback
- Help triggers: "?" button + `mod+/` hotkey pattern on all pages
- Tooltips: use Mantine Tooltip on complex buttons/fields/headers
- Components: small, focused, prop-driven; avoid prop drilling with context when needed
- OOP helpers: encapsulate shared logic in adapters/services to avoid repetition across views

### Testing
- Unit tests: domain objects, value objects, pure functions — fast and deterministic
- Use case tests: mock repositories, verify workflows
- Integration tests: test full API endpoints with test database
- Commands: `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`

## Domain Model (Key Concepts)

### Barefoot Buckets
- **Daily Expenses** (60%): groceries, transport, bills
- **Splurge** (10%): guilt-free spending
- **Smile** (10%): long-term goals (holidays, car)
- **Fire Extinguisher** (20%): debt payoff and emergency fund

### Fortnights
- Budgeting period aligned with income cycle
- Each fortnight has bucket allocations and transactions
- Snapshots track spent/remaining per bucket
- Date format: YYYY-MM-DD (normalized to prevent timezone issues)

### Debt Snowball
- Prioritize debts (1 = highest)
- Pay minimum on all debts except priority 1
- Fire Extinguisher amount applied to priority 1
- Timeline calculated in fortnights (not months)
- Tracks interest accrual and payoff progress

### Transactions
- Kinds: INCOME, EXPENSE, DEBT_PAYMENT
- Tags: comma-separated for categorization (recurring, manual)
- Date normalization critical for fortnight matching and debt payment recording

## Current Feature Status

### Completed Features
✅ Dashboard with fortnight overview, debt summary, payoff projections
✅ Fortnight creation/management with bucket allocations
✅ Transaction recording with bucket/kind/description/amount/tags
✅ Debt management with snowball prioritization
✅ Debt payoff plan calculator (fortnightly timeline)
✅ Global help system with search, cross-page navigation, keyboard shortcuts
✅ Comprehensive tooltips on Transactions page
✅ Date normalization utilities to prevent timezone/formatting bugs
✅ Profile configuration (income, Fire Extinguisher %, fixed expenses)

### Current Implementation Details
- Fortnight selector with prev/next navigation
- Debt payment sections: Snowball Payment (priority 1) and Minimum Payments (all others)
- "Planned" badges on debt sections showing calculated amounts
- Bulk debt payment recording with one-click "Record All"
- Skip payment functionality for missed payments
- Help content centralized in `frontend/src/constants/helpContent.ts`
- Date utilities in `frontend/src/utils/formatters.ts`

## API Endpoints

### Fortnights
- `POST /fortnights` — create fortnight with allocations
- `GET /fortnights` — list all fortnights
- `GET /fortnights/:id` — get fortnight detail with bucket breakdowns

### Transactions
- `GET /transactions?bucket&fortnightId&startDate&endDate` — filtered list
- `POST /transactions` — record income/expense/debt payment

### Debts
- `GET /debts` — list all debts with balances
- `POST /debts` — create debt
- `PUT /debts/:id` — update debt (balance, minimum, priority)
- `GET /debts/payoff-plan?fortnightlyFireExtinguisherCents=<int>` — snowball timeline
- `POST /debts/:id/skip-payment` — skip scheduled payment with reason

### Dashboard
- `GET /dashboard?currentFortnightId=<id>` — consolidated view (fortnight + debts + projections)

### Profile
- `GET /profile` — get budget configuration (profile controller: requires auth, returns user profile with income/Fire Extinguisher %/fixed expenses)
- `PUT /profile` — update income, fire extinguisher %, fixed expenses (profile controller: requires auth, validates and persists user preferences)

### Chat (Optional, AI-Powered)
- `POST /api/chat` — send message to AI advisor (requires auth, `AI_ENABLED=true`, and `GEMINI_API_KEY`)
- `GET /api/chat/history` — retrieve conversation history (requires auth, only if AI enabled)

**AI Routes**: Only registered if `process.env.AI_ENABLED === 'true'` && `process.env.GEMINI_API_KEY` is set. Frontend detects disabled state and shows friendly message.

All responses use `ApiResponse<T>` envelope:
```typescript
{
  success: true | false;
  data?: T;
  error?: { message: string; code: string };
}
```

## Development Workflow

### Local Development
- Backend: `cd backend && pnpm dev` (PORT defaults to 3000)
- Frontend: `cd frontend && pnpm dev` (Vite dev server on PORT 5173)
- Database: PostgreSQL with migrations (manual setup)
- No CI/CD — local-first development

### Before Committing
1. Type check: `pnpm exec tsc --noEmit` (both backend and frontend)
2. Run tests: `pnpm test`
3. Verify no console errors in browser
4. Check date handling uses `formatDateToISO()` for consistency

### Environment
- `NODE_ENV=production` — suppress detailed errors in responses
- Database connection via environment variables
- No authentication (single-user personal app)

## Adding New Features

### New API Endpoint
1. Define Zod schema in `application/dtos/schemas`
2. Create use case implementing `IUseCase` interface
3. Add controller method (thin, delegates to use case)
4. Register route with validation middleware + `asyncHandler`
5. Update domain entities if needed (keep pure)
6. Add unit tests for use case logic
7. Update frontend API client types

### New Frontend View
1. Create view component in `frontend/src/views/`
2. Add route in App.tsx
3. Add nav link in AppShell
4. Implement loading/error/empty states
5. Add help trigger: "?" button + `mod+/` hotkey
6. Add help content to `helpContent.ts`
7. Use consistent date handling (`formatDateToISO`)
8. Add tooltips for complex controls

### New Domain Entity
1. Create entity in `domain/model/` (pure TypeScript)
2. Guard invariants in constructor
3. Add repository interface in `domain/repositories/`
4. Implement Postgres + in-memory adapters in `infrastructure/`
5. Add Zod schema for API validation in `application/dtos/schemas/`
6. Write unit tests for entity invariants
7. Update UnitOfWork if transactional boundaries needed

## Common Patterns

### Date Handling (Critical)
Always use `formatDateToISO()` from `frontend/src/utils/formatters.ts` when:
- Setting fortnight start/end dates in state
- Making API calls with date parameters
- Comparing dates for fortnight matching
- Recording transactions or debt payments
- Displaying dates in forms

**Why:** Prevents timezone drift (e.g., "2025-12-31" becoming "2025-12-30T14:00:00.000Z") that breaks exact date matching.

### Error Handling
- Backend: throw `ValidationError` for bad inputs, `DomainError` for business rule violations
- Map to HTTP in controllers via `ErrorMapper`
- Frontend: display errors via `ErrorAlert` component, extract message from `ApiResponse.error`

### Help System Pattern
```typescript
// In any view component:
import { useHelp } from '../components/HelpDrawer';
import { useHotkeys } from '@mantine/hooks';
import { IconQuestionMark } from '@tabler/icons-react';

const { openHelp } = useHelp();
useHotkeys([['mod+/', () => openHelp('viewname')]]);

// In header:
<Tooltip label="Help (⌘/)">
  <ActionIcon onClick={() => openHelp('viewname')}>
    <IconQuestionMark size={20} />
  </ActionIcon>
</Tooltip>
```

### Tooltip Pattern
```typescript
<Tooltip label="Helpful description">
  <Button>Action</Button>
</Tooltip>
```

## Troubleshooting

### Dates Don't Match / Sections Not Appearing
- Check if dates are normalized with `formatDateToISO()`
- Verify API returns ISO strings, frontend compares YYYY-MM-DD format
- Look for timezone conversion issues (use UTC parts, not local)

### TypeScript Errors on Imports
- Use `import type { ... }` for types (satisfies `verbatimModuleSyntax`)
- Check tsconfig.json has correct module resolution

### Validation Not Working
- Ensure Zod schema exists in `application/dtos/schemas`
- Check validation middleware is applied before controller
- Don't re-parse in controller — trust middleware

### Help Content Not Showing
- Verify page key matches in `helpContent.ts`
- Check HelpProvider wraps App component
- Ensure `openHelp()` called with correct page key

## File References

### Key Backend Files
- `backend/src/server.ts` — Express app entry point
- `backend/src/domain/model/` — Pure domain entities (Money, Debt, Fortnight, etc.)
- `backend/src/application/use-cases/` — Business workflows
- `backend/src/application/dtos/schemas/` — Zod validation schemas
- `backend/src/infrastructure/persistence/` — Repository implementations
- `backend/src/presentation/http/routes.ts` — Route definitions

### Key Frontend Files
- `frontend/src/App.tsx` — Root component with AppShell and routing
- `frontend/src/views/` — Main page components (Dashboard, Fortnight, Transactions, Debts, Profile)
- `frontend/src/components/HelpDrawer.tsx` — Global help system
- `frontend/src/constants/helpContent.ts` — Centralized help content
- `frontend/src/utils/formatters.ts` — Date/currency/percent formatting utilities
- `frontend/src/api/client.ts` — Typed API client with fetch wrapper

### Documentation
- `backend/ARCHITECTURE.md` — Detailed backend architecture
- `backend/README.md` — Backend setup and commands
- `backend/TESTING.md` — Testing strategy and patterns
- `frontend/README.md` — Frontend setup and structure
- `docs/FEATURE_WISHLIST.md` — Future feature ideas

## Notes
- Multi-user app: JWT authentication with refresh/access tokens, signup/login flow, per-instance independence
- All currency in cents (integer arithmetic prevents float errors)
- Fortnight-based budgeting (not monthly)
- Barefoot bucket percentages: 60/10/10/20 split (customizable)
- Debt snowball uses fortnightly calculations
- Help system supports cross-page search with "Open" buttons
- Date normalization critical for consistent behavior (use `formatDateToISO()`)
- AI Advisor is optional (disabled by default), requires GEMINI_API_KEY and AI_ENABLED=true

## External Contributors

### Getting Started
1. Fork the repository: https://github.com/PaulAtkins88/bucketwise-planner
2. Clone your fork and follow [CONTRIBUTING.md](../CONTRIBUTING.md)
3. Read [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for system overview
4. Read [docs/SELF_HOSTING.md](../docs/SELF_HOSTING.md) for local development setup

### Key Resources for Contributors
- **Architecture**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — System design, DDD patterns, API endpoints
- **Backend Dev**: [backend/README.md](../backend/README.md) — Setup, testing, auth, optional AI
- **Frontend Dev**: [frontend/README.md](../frontend/README.md) — Setup, AI chat widget, auth flows
- **Self-Hosting Guide**: [docs/SELF_HOSTING.md](../docs/SELF_HOSTING.md) — Deployment options, environment variables, troubleshooting
- **AI Advisor**: [docs/AI_ADVISOR.md](../docs/AI_ADVISOR.md) — Optional AI feature, setup, usage, troubleshooting
- **FAQ**: [docs/FAQ.md](../docs/FAQ.md) — Common questions about Barefoot methodology, features, tech, contributing
- **Contributing Guide**: [CONTRIBUTING.md](../CONTRIBUTING.md) — Code style, testing, git conventions, PR process
- **Testing**: [backend/TESTING.md](../backend/TESTING.md) — Unit/integration testing strategy, Vitest setup

### Important: Multi-User Authentication
This is a **multi-user self-hosted app**, not single-user. Every self-hosted instance has:
- Signup/login system (JWT tokens)
- Password hashing (bcryptjs)
- User-scoped data (profiles, transactions, debts, fortnights)
- Session management (refresh tokens)

When adding features:
- Protect routes with `RequireAuth` middleware
- Query database with `userId` context
- Test with multiple users
- Never assume single user in queries or business logic

### Important: Optional AI Advisor
The AI Chat widget is **optional and disabled by default**. When implementing features:
- Only register `/api/chat` routes if `AI_ENABLED=true` && `GEMINI_API_KEY`
- Frontend should gracefully show "AI disabled" message if not configured
- Never assume AI availability in core workflows
- All features must work without AI enabled
- Test both with and without GEMINI_API_KEY set

### Attribution & Naming
- Project name: **Bucketwise Planner**
- Credit: Scott Pape's **Barefoot Investor** methodology (https://www.barefootinvestor.com/)
- License: MIT (permissive, free for all use)
- In documentation: "implementing Scott Pape's Barefoot Investor method"
- In UI: Generic terms (e.g., "Bucket Allocations", "AI Advisor") to avoid trademark issues
- Mention Barefoot Investor in README, architecture docs, and contribution guidelines

### Documentation Links
After pushing changes, update docs:
- [docs/FEATURE_WISHLIST.md](../docs/FEATURE_WISHLIST.md) — Add feature ideas from community
- [CHANGELOG.md](../CHANGELOG.md) — Add release notes with contributor credits
- [docs/FAQ.md](../docs/FAQ.md) — Update with new questions from issues/discussions

### Community Principles
- This is a **community-driven** project — contributions are encouraged and valued
- Be respectful and inclusive ([CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md))
- Report security issues privately via [SECURITY.md](../SECURITY.md)
- Ask questions in GitHub Discussions (linked in [SUPPORT.md](../SUPPORT.md))
- Share feedback, ideas, and improvements via issues and PRs
