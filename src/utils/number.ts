/**
 * `pt-BR` number formatting.
 *
 * Companion to `utils/money`: currency lives there, plain counts here. Both go
 * through `Intl` with a manual fallback, because the ICU data Hermes ships varies
 * by platform build and a formatter throwing inside a label would blank the row.
 */

/** `1234` -> `"1.234"`. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';

  try {
    return new Intl.NumberFormat('pt-BR').format(value);
  } catch {
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}

/**
 * Follower counts, which the catalogue stores in thousands.
 *
 * `27` -> `"27 mil"`, `1200` -> `"1,2 mi"`. Rendering the raw `27` — as the card
 * did — reads as twenty-seven followers rather than twenty-seven thousand.
 */
export function formatFollowers(inThousands: number): string {
  if (!Number.isFinite(inThousands) || inThousands < 0) return '0';

  if (inThousands >= 1000) {
    const millions = inThousands / 1000;
    // One decimal place, and no trailing ",0".
    const rounded = Math.round(millions * 10) / 10;
    return `${formatNumber(rounded).replace(/,0$/, '')} mi`;
  }

  return `${formatNumber(inThousands)} mil`;
}
