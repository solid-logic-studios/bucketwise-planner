# Backend Patterns & Best Practices

## Domain Layer (Pure Business Logic)

### Entities
```typescript
// Example: Money value object (immutable)
export class Money {
  private constructor(private readonly cents: number) {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new ValidationError('Money must be non-negative integer cents');
    }
  }

  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  toCents(): number {
    return this.cents;
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.toCents());
  }
}
```

**Rules:**
- Guard invariants in constructors
- Throw `ValidationError` for invalid inputs
- Keep immutable (return new instances from operations)
- No framework dependencies (no Express, Zod, database libs)

### Repository Interfaces
```typescript
// Domain defines contracts
export interface IDebtRepository {
  findById(id: string): Promise<Debt | null>;
  findAll(): Promise<Debt[]>;
  save(debt: Debt): Promise<void>;
  delete(id: string): Promise<void>;
}
```

**Rules:**
- Define in `domain/repositories/`
- Return domain entities, not database rows
- Infrastructure implements these interfaces

## Application Layer (Use Cases)

### Use Case Structure
```typescript
export class CreateDebtUseCase implements IUseCase<CreateDebtRequest, DebtDTO> {
  constructor(
    private readonly debtRepository: IDebtRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(request: CreateDebtRequest): Promise<DebtDTO> {
    // 1. Validate (basic checks, Zod happens in controller middleware)
    if (request.balanceCents <= 0) {
      throw new ValidationError('Balance must be positive');
    }

    // 2. Create domain entity
    const debt = new Debt({ /* ... */ });

    // 3. Persist via repository
    await this.unitOfWork.begin();
    try {
      await this.debtRepository.save(debt);
      await this.unitOfWork.commit();
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }

    // 4. Map to DTO
    return {
      id: debt.getId(),
      name: debt.getName(),
      // ...
    };
  }
}
```

**Rules:**
- Implement `IUseCase<TRequest, TResponse>` interface
- Accept single request object (all params bundled)
- Use constructor injection for dependencies
- Throw domain errors (`ValidationError`, `DomainError`)
- Return DTOs (not domain entities directly)
- Use UnitOfWork for transactional operations

### Zod Schemas
```typescript
// application/dtos/schemas/debt.schema.ts
import { z } from 'zod';

export const createDebtRequestSchema = z.object({
  name: z.string().min(1).max(100),
  balanceCents: z.number().int().positive(),
  minimumPaymentCents: z.number().int().nonnegative(),
  annualInterestRatePercent: z.number().min(0).max(100),
  priority: z.number().int().positive(),
});

export type CreateDebtRequest = z.infer<typeof createDebtRequestSchema>;
```

**Rules:**
- Define in `application/dtos/schemas/`
- Export both schema and inferred type
- Controllers use validation middleware (don't re-parse)

## Presentation Layer (HTTP)

### Controllers
```typescript
export class DebtController {
  constructor(
    private readonly createDebtUseCase: CreateDebtUseCase,
    // other use cases...
  ) {}

  createDebt = async (req: Request, res: Response, next: NextFunction) => {
    // req.body already validated by middleware
    const request = req.body as CreateDebtRequest;
    
    const result = await this.createDebtUseCase.execute(request);
    
    res.status(201).json(ResponseFormatter.success(result));
  };
}
```

**Rules:**
- Keep thin — delegate to use cases
- Trust validation middleware (don't re-parse)
- Use `ResponseFormatter.success()` or `ResponseFormatter.error()`
- Let error handling middleware catch exceptions

### Route Registration
```typescript
// routes.ts
import { createDebtRequestSchema } from '../application/dtos/schemas/debt.schema.js';

export function registerRoutes(app: Express, controllers: Controllers) {
  app.post(
    '/debts',
    validateRequest(createDebtRequestSchema), // Zod validation first
    asyncHandler(controllers.debt.createDebt)  // Then controller
  );
}
```

**Rules:**
- Apply validation middleware before controller
- Wrap with `asyncHandler` to catch async errors
- Group related routes together

### Error Handling
```typescript
// middleware/error-handler.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiError = ErrorMapper.toApiError(err);
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(apiError.statusCode).json(
    ResponseFormatter.error(apiError)
  );
}
```

**Rules:**
- Centralized error handling middleware
- Map domain errors to HTTP status codes
- Suppress stack traces in production
- Always return `ApiResponse` envelope

## Infrastructure Layer

### Repository Implementation
```typescript
// infrastructure/persistence/postgres/postgres-debt.repository.ts
export class PostgresDebtRepository implements IDebtRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Debt | null> {
    const result = await this.pool.query(
      'SELECT * FROM debts WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  private mapRowToEntity(row: any): Debt {
    // Map database row to domain entity
    return new Debt({
      id: row.id,
      name: row.name,
      balanceCents: row.balance_cents,
      // ...
    });
  }
}
```

**Rules:**
- Implement repository interface from domain
- Use snake_case for database columns
- Map to domain entities (camelCase properties)
- Handle NULL values appropriately
- Don't expose database concerns to application layer

## Testing Patterns

### Domain Tests
```typescript
describe('Money', () => {
  it('should throw on negative cents', () => {
    expect(() => Money.fromCents(-100)).toThrow(ValidationError);
  });

  it('should add two money values', () => {
    const a = Money.fromCents(100);
    const b = Money.fromCents(50);
    expect(a.add(b).toCents()).toBe(150);
  });
});
```

### Use Case Tests
```typescript
describe('CreateDebtUseCase', () => {
  it('should create debt and persist', async () => {
    const mockRepo = {
      save: vi.fn(),
    } as any;

    const useCase = new CreateDebtUseCase(mockRepo, mockUnitOfWork);
    
    const result = await useCase.execute({
      name: 'Credit Card',
      balanceCents: 100000,
      // ...
    });

    expect(mockRepo.save).toHaveBeenCalledOnce();
    expect(result.name).toBe('Credit Card');
  });
});
```

**Rules:**
- Unit tests for domain logic (fast, deterministic)
- Mock repositories in use case tests
- Integration tests for full API endpoints
- Use Vitest (not Jest)
- Run with `pnpm test`

## Common Anti-Patterns to Avoid

❌ **Don't put business logic in controllers**
```typescript
// BAD
app.post('/debts', (req, res) => {
  const debt = new Debt(req.body);
  if (debt.balanceCents > 100000) {
    debt.priority = 1; // Business logic in controller
  }
  await debtRepo.save(debt);
  res.json(debt);
});
```

✅ **Do delegate to use cases**
```typescript
// GOOD
app.post('/debts', asyncHandler(controllers.debt.createDebt));
```

❌ **Don't re-parse validated inputs**
```typescript
// BAD
const validated = createDebtRequestSchema.parse(req.body);
```

✅ **Do trust middleware**
```typescript
// GOOD - middleware already validated
const request = req.body as CreateDebtRequest;
```

❌ **Don't leak database details to domain**
```typescript
// BAD
class Debt {
  @Column({ name: 'balance_cents' })
  balanceCents: number;
}
```

✅ **Do keep domain pure**
```typescript
// GOOD
class Debt {
  private readonly balanceCents: number;
}
```

## OOP Helper Patterns

### Base Use Case Template
```typescript
// application/use-cases/base-use-case.ts
export abstract class BaseUseCase<TRequest, TResponse> implements IUseCase<TRequest, TResponse> {
  async execute(request: TRequest): Promise<TResponse> {
    this.validate(request);
    return this.handle(request);
  }

  protected abstract validate(request: TRequest): void;
  protected abstract handle(request: TRequest): Promise<TResponse>;
}
```

**Rules:**
- Use base classes for shared workflow steps (validate/handle/persist)
- Keep domain logic in domain entities; use cases orchestrate
- Prefer composition with repositories/services over deep inheritance
