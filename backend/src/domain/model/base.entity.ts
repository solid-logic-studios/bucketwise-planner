/**
 * BaseEntity: Abstract base class for all domain entities.
 * Entities are identified by their unique ID, not their content.
 * All entities have immutable creation metadata (createdAt, updatedAt).
 * 
 * @abstract
 * @example
 * ```typescript
 * export class User extends BaseEntity {
 *   constructor(
 *     id: string,
 *     readonly name: string,
 *     readonly email: string
 *   ) {
 *     super(id);
 *   }
 * }
 * ```
 */
export abstract class BaseEntity {
  /**
   * Unique identifier for this entity
   */
  readonly id: string;

  /**
   * Timestamp when entity was created
   */
  readonly createdAt: Date;

  /**
   * Timestamp when entity was last updated
   */
  readonly updatedAt: Date;

  constructor(
    id: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}