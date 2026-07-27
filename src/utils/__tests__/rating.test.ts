import {
  clampStars,
  formatRating,
  formatReviewCount,
  parseRating,
  ratingQualityLabel,
} from '../rating';

/**
 * Rating presentation in pt-BR.
 *
 * Historical payloads may still contain a string with either separator. These
 * cases pin the presentation boundary that keeps raw values out of the UI.
 */

describe('parseRating', () => {
  it('passes a number straight through', () => {
    expect(parseRating(4.9)).toBe(4.9);
  });

  it('parses the dotted string the catalogue stores', () => {
    expect(parseRating('4.9')).toBe(4.9);
  });

  it('parses a value that was already localised', () => {
    // Round-tripping a formatted rating must not produce NaN.
    expect(parseRating('4,9')).toBe(4.9);
  });

  it('returns NaN for nonsense rather than zero', () => {
    // Zero would silently render as "0,0", which reads as a real terrible score.
    expect(Number.isNaN(parseRating('sem nota'))).toBe(true);
  });
});

describe('formatRating', () => {
  it('uses a comma, not a full stop', () => {
    expect(formatRating(4.9)).toBe('4,9');
  });

  it('formats the string form identically', () => {
    expect(formatRating('4.9')).toBe('4,9');
  });

  it('always shows one decimal, so a column of ratings stays aligned', () => {
    expect(formatRating(5)).toBe('5,0');
    expect(formatRating(4)).toBe('4,0');
  });

  it('rounds to one decimal', () => {
    expect(formatRating(4.86)).toBe('4,9');
  });

  it('degrades to a dash instead of NaN', () => {
    expect(formatRating('—')).toBe('—');
  });
});

describe('formatReviewCount', () => {
  it('pluralises with the accent intact', () => {
    expect(formatReviewCount(284)).toBe('284 avaliações');
  });

  it('uses the singular for exactly one', () => {
    expect(formatReviewCount(1)).toBe('1 avaliação');
  });

  it('groups thousands the Brazilian way', () => {
    expect(formatReviewCount(1284)).toBe('1.284 avaliações');
  });

  it('says so when there are none', () => {
    expect(formatReviewCount(0)).toBe('Sem avaliações');
  });
});

describe('ratingQualityLabel', () => {
  it.each([
    [5, 'Excelente'],
    [4.9, 'Excelente'],
    [4.5, 'Excelente'],
    [4.4, 'Muito bom'],
    [4, 'Muito bom'],
    [3.2, 'Bom'],
    [2.5, 'Regular'],
    [1.2, 'Ruim'],
  ])('describes %s as %s', (rating, expected) => {
    expect(ratingQualityLabel(rating)).toBe(expected);
  });

  it('says nothing when there is no score yet', () => {
    expect(ratingQualityLabel(0)).toBeNull();
    expect(ratingQualityLabel('sem nota')).toBeNull();
  });
});

describe('clampStars', () => {
  it.each([
    [-1, 0],
    [0, 0],
    [3, 3],
    [4.6, 5],
    [9, 5],
  ])('clamps %s to %s', (input, expected) => {
    expect(clampStars(input)).toBe(expected);
  });

  it('treats unparseable input as no stars', () => {
    expect(clampStars('nada')).toBe(0);
  });
});
