/**
 * IApplicationError: Interface for application-level errors with HTTP status codes.
 * Maps domain errors to HTTP responses with appropriate status codes and messages.
 * Used in middleware for consistent error handling.
 * 
 * @example
 * ```typescript
 * const error: IApplicationError = {
 *   statusCode: 400,
 *   message: 'Invalid transaction: description cannot be empty',
 *   isDomainError: true
 * };
 * ```
 */
export interface IApplicationError {
  /**
   * HTTP status code for this error
   */
  statusCode: number;

  /**
   * User-facing error message
   */
  message: string;

  /**
   * Whether this is a domain error (expected) vs system error (unexpected)
   */
  isDomainError: boolean;

  /**
   * Optional error code for client-side handling
   */
  code?: string;

  /**
   * Optional detailed error information (only in development)
   */
  details?: Record<string, unknown>;
}
