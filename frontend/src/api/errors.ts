import type { ApiResponse } from './types.ts';

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return fallback;
}

export async function createApiClientError(
  response: Response,
  fallbackMessage?: string,
): Promise<ApiClientError> {
  let message = fallbackMessage || `Request failed: ${response.status} ${response.statusText}`;
  let code: string | undefined;
  let details: Record<string, unknown> | undefined;

  try {
    const errJson = (await response.json()) as ApiResponse<unknown>;
    if (errJson?.error?.message) {
      message = errJson.error.message;
    }
    code = errJson?.error?.code;
    details = errJson?.error?.details;
  } catch {
    // Ignore non-JSON error bodies and fall back to status text.
  }

  return new ApiClientError(message, response.status, code, details);
}