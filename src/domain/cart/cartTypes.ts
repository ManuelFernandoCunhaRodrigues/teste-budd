import type { GradientToken } from '@/theme/gradients';
import type { MoneyInCents } from '@/utils/money';

/** Minimum venue identity the cart needs to keep an order attributable. */
export interface VenueSummary {
  id: string;
  name: string;
}

/**
 * One commercial line.
 *
 * `productId` alone is not an identity: the same drink sold by two venues is
 * two different things, at two different prices. `lineId` carries the full
 * commercial identity and is what the cart is keyed by.
 */
export interface CartItem {
  lineId: string;
  venueId: string;
  productId: string;
  name: string;
  imageToken?: GradientToken;
  unitPriceInCents: MoneyInCents;
  quantity: number;
  variantId?: string;
  selectedOptionIds?: string[];
  addOnIds?: string[];
  notes?: string;
}

/** The fields that make two lines commercially distinct. */
export interface CartLineIdentity {
  venueId: string;
  productId: string;
  variantId?: string;
  selectedOptionIds?: string[];
  addOnIds?: string[];
}

/**
 * Builds the deterministic line key.
 *
 * Option lists are sorted first, so picking "gelo, limão" and "limão, gelo"
 * resolves to the same line instead of two half-quantity lines. Every segment is
 * percent-encoded, which escapes the `|` and `,` separators and stops an id that
 * happens to contain one from colliding with a different combination.
 *
 * `notes` is intentionally excluded: free text is not a commercial variant, and
 * including it would split lines on a stray space.
 */
export function createCartLineId(input: CartLineIdentity): string {
  const segments = [
    input.venueId,
    input.productId,
    input.variantId ?? '',
    normaliseIds(input.selectedOptionIds),
    normaliseIds(input.addOnIds),
  ];

  return segments.map((segment) => encodeURIComponent(segment)).join('|');
}

/** Sorted, de-duplicated and comma-joined, so ordering never affects identity. */
function normaliseIds(ids: readonly string[] | undefined): string {
  if (!ids || ids.length === 0) return '';
  return [...new Set(ids)].sort().join(',');
}
