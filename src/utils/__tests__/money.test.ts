import {
  formatCents,
  multiplyCents,
  parseAmountInputToCents,
  parseCurrencyToCents,
  sumCents,
} from '../money';

describe('parseCurrencyToCents', () => {
  it('reads the authored catalogue format', () => {
    expect(parseCurrencyToCents('R$ 16,00')).toBe(1600);
    expect(parseCurrencyToCents('R$ 49,90')).toBe(4990);
  });

  it('tolerates the dot-decimal spelling some entries use', () => {
    expect(parseCurrencyToCents('R$ 5.00')).toBe(500);
  });

  it('reads a bare integer as whole reais', () => {
    expect(parseCurrencyToCents('R$ 19')).toBe(1900);
  });

  it('pads a single decimal place', () => {
    expect(parseCurrencyToCents('12,5')).toBe(1250);
  });

  it('truncates beyond two decimal places rather than rounding up', () => {
    expect(parseCurrencyToCents('10,999')).toBe(1099);
  });

  it('returns zero for unparseable input', () => {
    expect(parseCurrencyToCents('')).toBe(0);
    expect(parseCurrencyToCents(null)).toBe(0);
    expect(parseCurrencyToCents(undefined)).toBe(0);
    expect(parseCurrencyToCents('abc')).toBe(0);
  });

  it('rejects non-finite numbers', () => {
    expect(parseCurrencyToCents(Number.NaN)).toBe(0);
    expect(parseCurrencyToCents(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('parseAmountInputToCents', () => {
  it('returns null for an empty field, distinct from a typed zero', () => {
    expect(parseAmountInputToCents('')).toBeNull();
    expect(parseAmountInputToCents('   ')).toBeNull();
    expect(parseAmountInputToCents('0')).toBe(0);
  });

  it('rejects signs, exponents and stray characters', () => {
    // Coercing any of these into a charge amount is the class of bug §8.4 warns
    // about, so they must not silently become a number.
    expect(parseAmountInputToCents('-50')).toBeNull();
    expect(parseAmountInputToCents('1e5')).toBeNull();
    expect(parseAmountInputToCents('50abc')).toBeNull();
    expect(parseAmountInputToCents('1,2,3')).toBeNull();
  });

  it('rejects more than two decimal places', () => {
    expect(parseAmountInputToCents('10,123')).toBeNull();
  });

  it('parses valid keypad amounts', () => {
    expect(parseAmountInputToCents('12,5')).toBe(1250);
    expect(parseAmountInputToCents('100')).toBe(10_000);
  });
});

describe('formatCents', () => {
  it('formats as pt-BR currency', () => {
    // Non-breaking spaces vary by ICU build, so assert on the parts that matter.
    const formatted = formatCents(1290);
    expect(formatted).toContain('R$');
    expect(formatted).toContain('12,90');
  });

  it('groups thousands', () => {
    expect(formatCents(123_456)).toContain('1.234,56');
  });

  it('degrades to zero rather than NaN', () => {
    expect(formatCents(Number.NaN)).toBe('R$ 0,00');
  });
});

describe('integer arithmetic', () => {
  it('multiplies without floating-point drift', () => {
    // 0.07 * 3 in float reais is 0.21000000000000002; in cents it is exact.
    expect(multiplyCents(7, 3)).toBe(21);
  });

  it('sums a cart exactly', () => {
    expect(sumCents([1600, 4990, 1300])).toBe(7890);
  });

  it('refuses fractional quantities', () => {
    expect(multiplyCents(1600, 1.5)).toBe(0);
  });

  it('ignores non-finite entries instead of poisoning the total', () => {
    expect(sumCents([100, Number.NaN, 200])).toBe(300);
  });
});
