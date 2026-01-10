/**
 * ApiResponse<T>: Wrapper for HTTP JSON responses.
 * Provides consistent response structure across all endpoints.
 * Every API response should use this format for consistency.
 * 
 * @template T - The type of data in the response
 * @example
 * ```typescript
 * const response: ApiResponse<{ transactionId: string }> = {
 *   success: true,
 *   data: { transactionId: 'tx-123' }
 * };
 * res.json(response);
 * ```
 */
interface ApiResponse<T> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * The response data (present on success)
   */
  data?: T;

  /**
   * Error information (present on failure)
   */
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };

  /**
   * Request timestamp for tracing
   */
  timestamp: string;
}

/**
 * ResponseFormatter: Utility for building consistent API responses.
 * Ensures all endpoints return data in the same format.
 * 
 * @example
 * ```typescript
 * const response = ResponseFormatter.success({ id: '123' });
 * res.json(response);
 * ```
 */
export class ResponseFormatter {
  /**
   * Format a successful response.
   * @param data - The response data
   * @returns ApiResponse with success=true
   */
  static success<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format an error response.
   * @param code - Error code for client handling
   * @param message - User-friendly error message
   * @param details - Optional error details for debugging
   * @returns ApiResponse with success=false
   */
  static error(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ApiResponse<null> {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
