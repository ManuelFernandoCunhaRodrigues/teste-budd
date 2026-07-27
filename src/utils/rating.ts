/**
 * Rating presentation, in pt-BR.
 *
 * Centralised because a rating shows up in four places and each one was
 * formatting it by hand — which is how `4.9` reached the screen with a full
 * stop in a locale that uses a comma.
 */

/** Highest score the product allows. */
export const MAX_RATING = 5;

/**
 * Coerces a rating to a number.
 *
 * Historical API and persisted values may still arrive as strings, so this
 * boundary accepts either separator. Current catalogue entities store a number;
 * only the presentation layer turns it into locale-specific text.
 *
 * Accepts either separator, so a value that has already been localised does not
 * come back as `NaN`.
 */
export function parseRating(value: number | string): number {
  if (typeof value === 'number') return value;

  const parsed = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/**
 * `4.9` → `"4,9"`.
 *
 * Always one decimal, so a whole number reads `"5,0"` rather than `"5"` and the
 * column of ratings in a list stays the same width.
 */
export function formatRating(rating: number | string): string {
  const numeric = parseRating(rating);
  if (!Number.isFinite(numeric)) return '—';

  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** `284` → `"284 avaliações"`, and `1` → `"1 avaliação"`. */
export function formatReviewCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) return 'Sem avaliações';
  if (count === 0) return 'Sem avaliações';

  const formatted = Math.round(count).toLocaleString('pt-BR');
  return count === 1 ? `${formatted} avaliação` : `${formatted} avaliações`;
}

/**
 * Plain-language summary of an average.
 *
 * Bands are deliberately coarse: the point is to tell someone whether a place is
 * worth their evening, not to distinguish 4.2 from 4.3.
 */
export function ratingQualityLabel(rating: number | string): string | null {
  const numeric = parseRating(rating);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  if (numeric >= 4.5) return 'Excelente';
  if (numeric >= 4) return 'Muito bom';
  if (numeric >= 3) return 'Bom';
  if (numeric >= 2) return 'Regular';
  return 'Ruim';
}

/** Clamps to a whole number of stars. */
export function clampStars(value: number | string): number {
  const numeric = parseRating(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(MAX_RATING, Math.max(0, Math.round(numeric)));
}
