/** First letter of a name, upper-cased — used by avatars and review bubbles. */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/**
 * Splits the "A partir de R$ 50" price spelling into its two visual parts.
 * `prefix` is null for plain prices, which render as a single green line.
 */
export function splitPriceLabel(price: string | undefined | null): {
  prefix: string | null;
  value: string;
} {
  const match = /^A partir de\s+(.+)$/.exec(price ?? '');
  return match ? { prefix: 'A partir de', value: match[1] } : { prefix: null, value: price ?? '' };
}
