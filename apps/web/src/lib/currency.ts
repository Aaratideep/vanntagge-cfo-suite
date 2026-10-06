/**
 * Formats a number as Indian Rupees (₹) with Indian locale number grouping
 * e.g. 1234567 → ₹12,34,567
 */
export function formatINR(value: number | string | undefined | null): string {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a number with Indian locale grouping only (no symbol), for custom prefix/suffix usage
 * e.g. 1234567 → 12,34,567
 */
export function formatINRNumber(value: number | string | undefined | null): string {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(num);
}
