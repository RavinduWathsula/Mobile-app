/**
 * Safely extract a route parameter as a string.
 * Express v5 types define params as string | string[] — this normalizes it.
 */
export function paramToInt(value: string | string[] | undefined): number {
  const str = Array.isArray(value) ? value[0] : value;
  return parseInt(str || '0', 10);
}
