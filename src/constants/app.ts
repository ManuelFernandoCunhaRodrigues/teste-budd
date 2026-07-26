/** Business rules and fixed app values taken from the design. */

/**
 * Credit top-up limits, in integer cents.
 *
 * The device validates against these to avoid a pointless round trip, but the
 * server revalidates: a client-side bound is a convenience, never a control.
 */
export const RECHARGE = {
  minInCents: 100,
  maxInCents: 100_000,
  /** PIX processing fee applied to every top-up. Server is authoritative. */
  feeRate: 0.05,
  quickAmountsInCents: [5_000, 10_000, 20_000, 50_000],
} as const;

/** Buddcoin loyalty programme. */
export const BUDDCOIN_LABEL = 'BDC';

/**
 * Support contact moved to configuration.
 *
 * The number used to be hard-coded here as `5598999999999` — a placeholder that
 * would have opened a chat with whoever owns it (B-02). It now comes from
 * `EXPO_PUBLIC_WHATSAPP_SUPPORT_NUMBER` via `config/support`, is validated, and
 * the menu entry is disabled when unset. Messages live in `WHATSAPP_MESSAGES`.
 */

/** Default map framing for São Luís / MA, where the mock data lives. */
export const DEFAULT_REGION = {
  latitude: -2.549,
  longitude: -44.2508,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
} as const;

/** Tighter framing used by the single-venue mini map on the event screen. */
export const MINI_MAP_DELTA = {
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
} as const;
