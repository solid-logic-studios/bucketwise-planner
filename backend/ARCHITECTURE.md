# Bucketwise Planner - Backend Architecture

## Purpose
Multi-user fortnightly budgeting API implementing Scott Pape's Barefoot Investor methodology. Domain-driven design with clear layer boundaries, PostgreSQL persistence, and optional AI advisor.

**Attribution**: This project implements concepts from Scott Pape's **Barefoot Investor** (https://www.barefootinvestor.com/).

## Layers
- **Domain**: Pure business logic — entities (`Money`, `Transaction`, `Allocation`, `FortnightSnapshot`, `Debt`), value objects, domain services (debt payoff, savings projection), domain errors. No framework imports; no database concerns.
- **Application**: Use cases orchestrating domain logic (`RecordTransactionUseCase`, `CreateFortnightUseCase`, `CalculateDebtPayoffPlanUseCase`), DTO schemas (Zod), application error mapping, workflow coordination.
- **Infrastructure**: PostgreSQL repositories implementing domain interfaces (and in-memory adapters for testing). Authentication layer with JWT tokens and password hashing (bcryptjs). Unit-of-work pattern for transactional boundaries. Swap between implementations without touching domain/application.
- **Presentation**: HTTP (Express v5). Controllers extend `BaseController` for response formatting and async error handling. Routes compose validation middleware (Zod) with controllers. Middlewares: logging → CORS → authentication → content-type → body parsers → routes → 404 → global error.

## Multi-User Architecture
- **Authentication**: JWT-based with refresh tokens. Signup/login flow provides access + refresh tokens.
- **Authorization**: All routes require `RequireAuth` middleware, which extracts userId from JWT and attaches to request.
- **Scoping**: All queries filtered by `userId`. Users see only their own data (fortnights, transactions, debts, profiles).
- **Password Hashing**: bcryptjs (10 rounds) for secure password storage. No plaintext passwords in logs or responses.
- **Session Management**: Refresh tokens rotated on use; old tokens invalidated.

## Optional AI Advisor
- **Route Registration**: `/api/chat` routes only registered if `process.env.AI_ENABLED === 'true'` && `process.env.GEMINI_API_KEY` is set.
- **No Core Dependency**: All features work without AI. Chat is pure luxury feature, not critical path.
- **Frontend Feedback**: Frontend detects disabled state and shows friendly "AI disabled" message if routes unavailable.
- **Privacy**: No data sent to external AI service unless explicitly enabled by instance admin.

## Composition Root
- `presentation/http/server.ts` wires PostgreSQL repositories, use cases, controllers, and routers into an Express app.
- Conditional AI route registration based on environment variables.
- `server.ts` boots the app with `PORT` (default 3000).

## Error Handling
- Domain errors (`ValidationError`, `DomainError`) bubble to application layer.
- `ErrorMapper` converts domain/Zod/system errors to `IApplicationError` with status codes and optional details (development only, suppressed in production).
- `ResponseFormatter` enforces a consistent `ApiResponse<T>` shape: `{ success: boolean; data?: T; error?: { message: string; code: string } }`.

## Validation
- Request bodies validated with Zod schemas in `application/dtos/schemas`. Validation middleware parses and replaces `req.body` with typed data or forwards error to error handler.
- Authentication validation via `RequireAuth` middleware extracts and verifies JWT token.

## Key Invariants
- Bucket allocation percentages must be in (0, 1] and sum to 1 in create-fortnight schema.
- Money operations guard against `NaN`/infinite values; equality uses integer cents.
- All user data filtered by `userId` from JWT context; no cross-user data leakage.
- Debt payoff calculations use fortnightly increments (not monthly) aligned with budgeting cycle.

## Extensibility Notes
- Swap PostgreSQL repositories with alternative implementations by adhering to repository interfaces and `IUnitOfWork` contract in `domain/repositories`.
- Add new endpoints by creating a controller method, wiring a Zod schema, and registering in the router via `asyncHandler`.
- Extend AI advisor with additional AI services by creating new chat adapters (e.g., OpenAI, Claude) and registering in composition root when AI enabled.
- Add new domain concepts (e.g., recurring transactions, budget alerts) without touching existing domain entities using vertical slice architecture (domain → application → infrastructure → presentation).
