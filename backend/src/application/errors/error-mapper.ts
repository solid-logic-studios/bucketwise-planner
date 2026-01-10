import { ZodError } from 'zod';
import { DomainError } from '../../domain/exceptions/domain-error.js';
import { ValidationError } from '../../domain/exceptions/validation-error.js';
import type { IApplicationError } from './application-error.interface.js';

/**
 * ErrorMapper: Utility for converting various error types to IApplicationError.
 * Maps domain exceptions, validation errors, and system errors to HTTP responses.
 * Provides consistent error handling across the application.
 * 
 * @example
 * ```typescript
 * try {
 *   // domain logic
 * } catch (error) {
 *   const appError = ErrorMapper.mapError(error);
 *   res.status(appError.statusCode).json(appError);
 * }
 * ```
 */
export class ErrorMapper {
  /**
   * Map any error to IApplicationError with appropriate HTTP status.
   * @param error - The error to map
   * @param isDevelopment - Whether to include detailed error info
   * @returns IApplicationError with status code and message
   */
  static mapError(
    error: unknown,
    isDevelopment = false
  ): IApplicationError {
    // Zod validation errors
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return {
        statusCode: 400,
        message: 'Validation failed',
        isDomainError: false,
        code: 'VALIDATION_ERROR',
        ...(isDevelopment
          ? { details: { errors: details } as Record<string, unknown> }
          : {}),
      } satisfies IApplicationError;
    }

    // Domain validation errors
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        message: error.message,
        isDomainError: true,
        code: 'DOMAIN_VALIDATION_ERROR',
      };
    }

    // Other domain errors
    if (error instanceof DomainError) {
      return {
        statusCode: 422,
        message: error.message,
        isDomainError: true,
        code: 'DOMAIN_ERROR',
      };
    }

    // Generic Error
    if (error instanceof Error) {
      return {
        statusCode: 500,
        message: isDevelopment
          ? error.message
          : 'An unexpected error occurred',
        isDomainError: false,
        code: 'INTERNAL_ERROR',
        ...(isDevelopment && error.stack
          ? { details: { stack: error.stack } as Record<string, unknown> }
          : {}),
      } satisfies IApplicationError;
    }

    // Unknown error
    return {
      statusCode: 500,
      message: 'An unknown error occurred',
      isDomainError: false,
      code: 'UNKNOWN_ERROR',
      ...(isDevelopment
        ? { details: { originalError: String(error) } as Record<string, unknown> }
        : {}),
    } satisfies IApplicationError;
  }
}
