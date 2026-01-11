/**
 * Helper functions for Express request handling
 */

/**
 * Converts Express route params/query values to a single string.
 * Express types route params as `string | string[]` but most use cases expect a single string.
 * 
 * @param value - The parameter value from req.params or req.query
 * @returns The first string if array, or the string itself, or empty string if undefined
 */
export function toSingleString(value: string | string[] | undefined): string {
  if (value === undefined) {
    return '';
  }
  return Array.isArray(value) ? (value[0] ?? '') : value;
}
