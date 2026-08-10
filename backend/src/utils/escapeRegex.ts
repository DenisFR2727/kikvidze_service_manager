/**
 * Escape a string for safe use inside a RegExp source (user search input).
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
