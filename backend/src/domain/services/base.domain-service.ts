/**
 * BaseDomainService: Abstract base class for domain services.
 * Domain services contain complex business logic that operates on domain objects.
 * They are stateless and act as coordinating logic between entities and value objects.
 * 
 * Unlike entities, they should not maintain state.
 * Unlike use cases, they contain only domain logic, not application orchestration.
 * 
 * @abstract
 * @example
 * ```typescript
 * export class DebtPayoffCalculator extends BaseDomainService {
 *   calculateSnowball(debts: Debt[]): PayoffPlan {
 *     // Complex domain logic here
 *   }
 * }
 * ```
 */
export abstract class BaseDomainService {
  /**
   * Override in subclasses to define initialization logic if needed
   */
  protected initialize(): void {
    // Optional: subclasses can override
  }
}
