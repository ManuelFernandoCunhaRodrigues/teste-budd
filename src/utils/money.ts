/**
 * Money is handled as integer cents everywhere in the domain.
 *
 * Floating-point reais cannot represent values like `0.07` exactly, so summing
 * a cart or applying a fee accumulates error that eventually shows up as a
 * one-cent mismatch against the server. Cents keep every intermediate value an
 * exact integer; formatting to `pt-BR` / `BRL` happens only at the edge, in the
 * UI.
 */

/** An amount in integer cents. `1290` is R$ 12,90. */
export type MoneyInCents = number;

const CENTS_PER_UNIT = 100;

/**
 * `1290` -> `"R$ 12,90"`.
 *
 * Hermes ships Intl, but the exact ICU data available varies by platform and
 * engine build, so a manual `pt-BR` fallback keeps prices readable rather than
 * risking a crash inside a price label.
 */
export function formatCents(cents: MoneyInCents): string {
  if (!Number.isFinite(cents)) return 'R$ 0,00';

  const value = Math.round(cents) / CENTS_PER_UNIT;

  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  } catch {
    return `R$ ${formatCentsManually(Math.round(cents))}`;
  }
}

/** `1290` -> `"12,90"`, with thousands separators and no currency symbol. */
function formatCentsManually(cents: MoneyInCents): string {
  const negative = cents < 0;
  const absolute = Math.abs(cents);

  const units = Math.trunc(absolute / CENTS_PER_UNIT);
  const remainder = absolute % CENTS_PER_UNIT;

  const grouped = String(units).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimals = String(remainder).padStart(2, '0');

  return `${negative ? '-' : ''}${grouped},${decimals}`;
}

/**
 * `"R$ 16,00"` -> `1600`. Tolerates the `"R$ 5.00"` dot-decimal spelling and
 * bare integers such as `"R$ 19"`, returning `0` for anything unparseable.
 *
 * Used to read the authored catalogue, which stores display strings. Real API
 * payloads are expected to send cents directly.
 */
export function parseCurrencyToCents(input: string | number | null | undefined): MoneyInCents {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? Math.round(input * CENTS_PER_UNIT) : 0;
  }
  if (!input) return 0;

  const digits = String(input).replace(/[^0-9.,]/g, '');
  if (!digits) return 0;

  // Whichever separator appears last is the decimal separator.
  const decimalAt = Math.max(digits.lastIndexOf(','), digits.lastIndexOf('.'));

  if (decimalAt === -1) {
    const whole = Number.parseInt(digits, 10);
    return Number.isNaN(whole) ? 0 : whole * CENTS_PER_UNIT;
  }

  const whole = Number.parseInt(digits.slice(0, decimalAt).replace(/[.,]/g, '') || '0', 10);
  // Pad "5,5" to 50 cents and truncate anything beyond two decimal places.
  const fraction = Number.parseInt(digits.slice(decimalAt + 1).padEnd(2, '0').slice(0, 2), 10);

  if (Number.isNaN(whole) || Number.isNaN(fraction)) return 0;
  return whole * CENTS_PER_UNIT + fraction;
}

/**
 * Parses keypad input such as `"12,5"` into cents, rejecting anything that is
 * not a plain amount. Returns `null` — rather than `0` — so a caller can tell
 * "empty field" apart from "the user typed zero".
 */
export function parseAmountInputToCents(input: string): MoneyInCents | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Reject signs, exponents and stray characters outright: silently coercing
  // "-50" or "1e5" into a charge amount is exactly the class of bug §8.4 warns
  // about.
  if (!/^\d{1,9}([.,]\d{0,2})?$/.test(trimmed)) return null;

  return parseCurrencyToCents(trimmed);
}

/** Multiplies a unit price by a quantity, staying in integer cents. */
export function multiplyCents(unit: MoneyInCents, quantity: number): MoneyInCents {
  if (!Number.isFinite(unit) || !Number.isInteger(quantity) || quantity < 0) return 0;
  return Math.round(unit) * quantity;
}

/** Sums cents, ignoring non-finite entries rather than producing `NaN`. */
export function sumCents(values: readonly MoneyInCents[]): MoneyInCents {
  return values.reduce((total, value) => (Number.isFinite(value) ? total + Math.round(value) : total), 0);
}
